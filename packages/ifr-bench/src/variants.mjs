/**
 * The seven first-frame rendering strategies under comparison.
 *
 * Variant contract: `makeVariant(bundle)` returns
 *   { reset(ctx), run(), collect() }
 * where ctx = { page, pageUid } (the page root is created untimed — it is
 * common to every strategy's renderPage). `run()` performs one complete
 * first-frame render through the currently-installed PAPI globals and is the
 * only timed call. `collect()` returns aux metrics (ops payload etc.).
 *
 * Strategies:
 *   bg-baseline   — no IFR: real shipped pipeline, BG render → JSON →
 *                   vuePatchUpdate interpreter (measures render+serialize+
 *                   parse+apply; excludes BG boot & IPC, which only add to it)
 *   ifr-replay    — current IFR: real shipped modules (mount on MT, ops
 *                   recorded + interpreted locally)
 *   ifr-direct    — route #2 prototype: same vdom walk, ops recorded, but
 *                   applied via element handles at emit time (no interpreter,
 *                   no id-map lookups)
 *   ifr-static-tpl— route (a) prototype: fully-static islands lowered to
 *                   generated straight-line create() fns; the rest = direct
 *   ifr-block-tpl — route (b)/Q2 prototype: whole blocks lowered to skeleton
 *                   templates with holes/slots; vdom exists only at block
 *                   granularity (one vnode per block/hole set)
 *   ifr-vapor     — route (c)/Q1 upper bound: no vdom at all; skeleton fns +
 *                   per-hole closure application (≈ Vapor's template()+
 *                   renderEffect on first render; effect re-tracking omitted)
 *   papi-floor    — absolute floor: one generated straight-line function
 */

import { createRenderer } from '@vue/runtime-core';
import { OP } from 'vue-lynx/internal/ops';
import { ShadowElement, createApp, resetForTesting } from 'vue-lynx';

import {
  elements,
  setPageUniqueId,
} from '../../vue-lynx/main-thread/dist/element-registry.js';
import {
  enableIFR,
  resetIfrForTesting,
  runIfrRender,
} from '../../vue-lynx/main-thread/dist/ifr.js';
import {
  applyOps,
  resetMainThreadState,
} from '../../vue-lynx/main-thread/dist/ops-apply.js';

const OP_INSTANTIATE = 100; // bench-local opcode for template instantiation

// ---------------------------------------------------------------------------
// Shared: real-pipeline state reset
// ---------------------------------------------------------------------------

function resetRealPipeline(ctx) {
  resetForTesting();
  resetMainThreadState();
  resetIfrForTesting();
  setPageUniqueId(ctx.pageUid);
  elements.set(1, ctx.page);
}

// ---------------------------------------------------------------------------
// bg-baseline
// ---------------------------------------------------------------------------

function bgBaseline(bundle) {
  let payloadBytes = 0;
  let batches = 0;
  globalThis.lynx = {
    getNativeApp: () => ({
      callLepusMethod(_method, params, cb) {
        payloadBytes += params.data.length;
        batches += 1;
        applyOps(JSON.parse(params.data));
        cb();
      },
    }),
  };
  return {
    reset(ctx) {
      resetRealPipeline(ctx);
      payloadBytes = 0;
      batches = 0;
    },
    run() {
      createApp(bundle.component).mount();
    },
    collect: () => ({ opsBytes: payloadBytes, batches }),
  };
}

// ---------------------------------------------------------------------------
// ifr-replay (current implementation, real shipped modules)
// ---------------------------------------------------------------------------

function ifrReplay(bundle) {
  let recorded = [];
  return {
    reset(ctx) {
      resetRealPipeline(ctx);
      enableIFR();
      const g = globalThis;
      const orig = g.__vueLynxIfrApplyOps;
      recorded = [];
      g.__vueLynxIfrApplyOps = (ops) => {
        recorded.push(ops);
        orig(ops);
      };
      // User code evaluates before renderPage: mount() defers.
      createApp(bundle.component).mount();
    },
    run() {
      runIfrRender({});
    },
    collect: () => ({
      opsBytes: recorded.reduce((n, b) => n + JSON.stringify(b).length, 0),
      opsFrames: recorded.reduce((n, b) => n + b.length, 0),
    }),
  };
}

// ---------------------------------------------------------------------------
// Direct substrate: handle-carrying nodeOps shared by the prototype variants
// ---------------------------------------------------------------------------

const TYPED = {
  view: (P) => __CreateView(P),
  text: (P) => __CreateText(P),
  image: (P) => __CreateImage(P),
  'scroll-view': (P) => __CreateScrollView(P),
};

function createTyped(tag, P) {
  const f = TYPED[tag];
  return f ? f(P) : __CreateElement(tag, P);
}

/**
 * Build a renderer whose nodeOps apply directly through native handles.
 * `hooks.createElement(tag, sh)` may claim template tags; `hooks.patchProp`
 * may claim template hole props. `record` receives protocol frames (route
 * #2/(a)/(b) still ship an ops stream for hydration).
 */
function makeDirectRenderer(hooks) {
  const state = {
    P: 1,
    record: [],
    handleMap: new Map(), // id → native handle (post-hydration protocol parity)
    signCounter: 0,
    handlers: new Map(),
  };

  const registerEvent = (handler) => {
    const sign = `vue:${state.signCounter++}`;
    state.handlers.set(sign, handler);
    return sign;
  };

  const nodeOps = {
    createElement(type) {
      const sh = new ShadowElement(type);
      const claimed = hooks.createElement?.(type, sh, state);
      if (!claimed) {
        const native = createTyped(type, state.P);
        __SetCSSId([native], 0);
        __SetAttribute(native, `vue-ref-${sh.id}`, 1);
        sh._native = native;
        state.record.push(OP.CREATE, sh.id, type);
      }
      state.handleMap.set(sh.id, sh._native);
      return sh;
    },
    createText(text) {
      const sh = new ShadowElement('#text');
      const native = __CreateText(state.P);
      __SetCSSId([native], 0);
      __SetAttribute(native, `vue-ref-${sh.id}`, 1);
      sh._native = native;
      state.record.push(OP.CREATE_TEXT, sh.id);
      state.handleMap.set(sh.id, native);
      if (text) {
        __SetAttribute(native, 'text', text);
        state.record.push(OP.SET_TEXT, sh.id, text);
      }
      return sh;
    },
    createComment() {
      const sh = new ShadowElement('#comment');
      sh._native = __CreateRawText('');
      state.record.push(OP.CREATE, sh.id, '__comment');
      state.handleMap.set(sh.id, sh._native);
      return sh;
    },
    setText(node, text) {
      __SetAttribute(node._native, 'text', text);
      state.record.push(OP.SET_TEXT, node.id, text);
    },
    setElementText(el, text) {
      __SetAttribute(el._native, 'text', text);
      state.record.push(OP.SET_TEXT, el.id, text);
    },
    insert(child, parent, anchor) {
      parent.insertBefore(child, anchor ?? null);
      const target = parent._slotNative ?? parent._native;
      if (anchor) __InsertElementBefore(target, child._native, anchor._native);
      else __AppendElement(target, child._native);
      state.record.push(OP.INSERT, parent.id, child.id, anchor ? anchor.id : -1);
    },
    remove(child) {
      if (child.parent) {
        const p = child.parent;
        p.removeChild(child);
        __RemoveElement(p._slotNative ?? p._native, child._native);
        state.record.push(OP.REMOVE, p.id, child.id);
      }
    },
    patchProp(el, key, _prev, next) {
      if (hooks.patchProp?.(el, key, next, state)) return;
      if (key === 'class') {
        __SetClasses(el._native, next ?? '');
        state.record.push(OP.SET_CLASS, el.id, next ?? '');
      } else if (key === 'style') {
        __SetInlineStyles(el._native, next ?? {});
        state.record.push(OP.SET_STYLE, el.id, next ?? {});
      } else if (key === 'id') {
        __SetID(el._native, next ?? undefined);
        state.record.push(OP.SET_ID, el.id, next);
      } else if (/^on[A-Z]/.test(key)) {
        const name = key.slice(2, 3).toLowerCase() + key.slice(3);
        const sign = registerEvent(next);
        __AddEvent(el._native, 'bindEvent', name, sign);
        state.record.push(OP.SET_EVENT, el.id, 'bindEvent', name, sign);
      } else {
        __SetAttribute(el._native, key, next);
        state.record.push(OP.SET_PROP, el.id, key, next);
      }
    },
    parentNode: (n) => n.parent,
    nextSibling: (n) => n.next,
  };

  const renderer = createRenderer(nodeOps);
  return { renderer, state };
}

function directVariant(bundle, component, hooks = {}) {
  let ctx0 = null;
  let made = null;
  return {
    reset(ctx) {
      ctx0 = ctx;
      ShadowElement.nextId = 2;
      made = makeDirectRenderer(hooks);
      made.state.P = ctx.pageUid;
      hooks.onReset?.(made.state);
    },
    run() {
      const root = new ShadowElement('page', 1);
      root._native = ctx0.page;
      made.renderer.createApp(component).mount(root);
    },
    collect: () => ({
      opsBytes: JSON.stringify(made.state.record).length,
      opsFrames: made.state.record.length,
    }),
  };
}

// ---------------------------------------------------------------------------
// ifr-direct (route #2)
// ---------------------------------------------------------------------------

function ifrDirect(bundle) {
  return directVariant(bundle, bundle.component);
}

// ---------------------------------------------------------------------------
// ifr-static-tpl (route a): <sta-N> islands instantiated via generated fns
// ---------------------------------------------------------------------------

function ifrStaticTpl(bundle) {
  const registry = bundle.staticTpl.registry;
  const hooks = {
    createElement(type, sh, state) {
      const tpl = registry.get(type);
      if (!tpl) return false;
      sh._native = tpl.create(null, state.P, null);
      state.record.push(OP_INSTANTIATE, sh.id, type);
      return true;
    },
  };
  return directVariant(bundle, bundle.staticTpl.component, hooks);
}

// ---------------------------------------------------------------------------
// ifr-block-tpl (route b / Q2): <tpl-N> block skeletons with holes + slots
// ---------------------------------------------------------------------------

function applyHole(meta, handle, value, state) {
  if (meta.kind === 'text') {
    __SetAttribute(handle, 'text', value);
  } else if (meta.kind === 'event') {
    const sign = `vue:${state.signCounter++}`;
    state.handlers.set(sign, value);
    __AddEvent(handle, 'bindEvent', meta.event, sign);
  } else if (meta.prop === 'class') {
    __SetClasses(handle, value ?? '');
  } else if (meta.prop === 'style') {
    __SetInlineStyles(handle, value ?? {});
  } else {
    __SetAttribute(handle, meta.prop, value);
  }
}

function ifrBlockTpl(bundle) {
  const registry = bundle.blockTpl.registry;
  const hooks = {
    createElement(type, sh, state) {
      const tpl = registry.get(type);
      if (!tpl) return false;
      const H = [];
      const S = [];
      sh._native = tpl.create(state.P, H, S);
      sh._holes = H;
      sh._holeMeta = tpl.holes;
      if (S.length > 0) sh._slotNative = S[0];
      state.record.push(OP_INSTANTIATE, sh.id, type);
      return true;
    },
    patchProp(el, key, next, state) {
      if (el._holes && key.charCodeAt(0) === 104 /* h */) {
        const idx = Number(key.slice(1));
        if (!Number.isNaN(idx)) {
          applyHole(el._holeMeta[idx], el._holes[idx], next, state);
          state.record.push(OP.SET_PROP, el.id, key, next);
          return true;
        }
      }
      return false;
    },
  };
  return directVariant(bundle, bundle.blockTpl.component, hooks);
}

// ---------------------------------------------------------------------------
// ifr-vapor (route c / Q1 upper bound): no vdom
// ---------------------------------------------------------------------------

function ifrVapor(bundle) {
  const plan = bundle.blockPlan;
  const data = bundle.data;
  let ctx0 = null;
  let signCounter = 0;
  const readHole = (meta, it) =>
    meta.kind === 'event'
      ? data[meta.key]
      : meta.item !== undefined
      ? it[meta.item]
      : data[meta.key];

  return {
    reset(ctx) {
      ctx0 = ctx;
      signCounter = 0;
    },
    run() {
      const P = ctx0.pageUid;
      const state = { signCounter, handlers: new Map() };
      const H = [];
      const S = [];
      const root = plan.create(P, H, S);
      // Per-hole closure application ≈ Vapor's renderEffect-per-binding on
      // the first render (re-tracking machinery omitted).
      const effects = [];
      for (let i = 0; i < plan.holes.length; i++) {
        const meta = plan.holes[i];
        const handle = H[i];
        effects.push(() => applyHole(meta, handle, readHole(meta, null), state));
      }
      for (const eff of effects) eff();
      // Lists: one skeleton instantiation + hole loop per item.
      for (let li = 0; li < plan.lists.length; li++) {
        const listPlan = plan.lists[li];
        const slot = S[li];
        const items = data[listPlan.each];
        for (let k = 0; k < items.length; k++) {
          const it = items[k];
          const IH = [];
          const node = listPlan.create(P, IH, []);
          for (let i = 0; i < listPlan.holes.length; i++) {
            applyHole(listPlan.holes[i], IH[i], readHole(listPlan.holes[i], it), state);
          }
          __AppendElement(slot, node);
        }
      }
      __AppendElement(ctx0.page, root);
      signCounter = state.signCounter;
    },
    collect: () => ({}),
  };
}

// ---------------------------------------------------------------------------
// papi-floor
// ---------------------------------------------------------------------------

function papiFloor(bundle) {
  const plan = bundle.inlinePlan;
  const data = bundle.data;
  let ctx0 = null;
  let ev = 0;
  const EV = () => `bench:${ev++}`;
  return {
    reset(ctx) {
      ctx0 = ctx;
      ev = 0;
    },
    run() {
      const root = plan.render(data, ctx0.pageUid, EV);
      __AppendElement(ctx0.page, root);
    },
    collect: () => ({}),
  };
}

// ---------------------------------------------------------------------------

export const VARIANTS = {
  'bg-baseline': bgBaseline,
  'ifr-replay': ifrReplay,
  'ifr-direct': ifrDirect,
  'ifr-static-tpl': ifrStaticTpl,
  'ifr-block-tpl': ifrBlockTpl,
  'ifr-vapor': ifrVapor,
  'papi-floor': papiFloor,
};
