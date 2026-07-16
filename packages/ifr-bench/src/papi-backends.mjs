/**
 * PAPI backends for the benchmark.
 *
 *  - counting stub: minimal in-memory elements + call counters. Isolates the
 *    framework-side JS cost (what the variants differ in) from fake-DOM cost.
 *  - jsdom: @lynx-js/testing-environment's PAPI over a real jsdom document —
 *    the correctness oracle (variants must produce identical HTML).
 *
 * Both are installed by assigning the __* functions onto globalThis, exactly
 * how lepus exposes PAPI.
 */

const PAPI_NAMES = [
  '__CreatePage',
  '__CreateView',
  '__CreateText',
  '__CreateImage',
  '__CreateScrollView',
  '__CreateElement',
  '__CreateRawText',
  '__AppendElement',
  '__InsertElementBefore',
  '__RemoveElement',
  '__SetAttribute',
  '__SetClasses',
  '__SetInlineStyles',
  '__SetID',
  '__SetCSSId',
  '__AddEvent',
  '__GetElementUniqueID',
  '__FlushElementTree',
];

// ---------------------------------------------------------------------------
// Counting stub
// ---------------------------------------------------------------------------

export function makeCountingBackend() {
  const counters = { create: 0, insert: 0, setattr: 0, event: 0, flush: 0 };
  let uid = 1;

  const mk = (tag) => {
    counters.create++;
    // Small realistic object so allocation cost is represented.
    return { tag, uid: uid++, at: null, cls: '', st: null, ch: null };
  };

  const backend = {
    __CreatePage: () => mk('page'),
    __CreateView: () => mk('view'),
    __CreateText: () => mk('text'),
    __CreateImage: () => mk('image'),
    __CreateScrollView: () => mk('scroll-view'),
    __CreateElement: (tag) => mk(tag),
    __CreateRawText: () => mk('raw-text'),
    __AppendElement: (p, c) => {
      counters.insert++;
      (p.ch ?? (p.ch = [])).push(c);
    },
    __InsertElementBefore: (p, c, ref) => {
      counters.insert++;
      const arr = p.ch ?? (p.ch = []);
      const i = arr.indexOf(ref);
      if (i === -1) arr.push(c);
      else arr.splice(i, 0, c);
    },
    __RemoveElement: (p, c) => {
      const arr = p.ch;
      if (arr) {
        const i = arr.indexOf(c);
        if (i !== -1) arr.splice(i, 1);
      }
    },
    __SetAttribute: (el, k, v) => {
      counters.setattr++;
      (el.at ?? (el.at = {}))[k] = v;
    },
    __SetClasses: (el, cls) => {
      counters.setattr++;
      el.cls = cls;
    },
    __SetInlineStyles: (el, st) => {
      counters.setattr++;
      el.st = st;
    },
    __SetID: (el, id) => {
      el.id = id;
    },
    __SetCSSId: () => {},
    __AddEvent: (el, _t, _n, _h) => {
      counters.event++;
    },
    __GetElementUniqueID: (el) => el.uid,
    __FlushElementTree: () => {
      counters.flush++;
    },
  };

  return {
    kind: 'counting',
    counters,
    install() {
      for (const n of PAPI_NAMES) globalThis[n] = backend[n];
    },
    reset() {
      counters.create = counters.insert = counters.setattr = counters.event = counters.flush = 0;
      uid = 1;
    },
  };
}

// ---------------------------------------------------------------------------
// jsdom backend (correctness oracle)
// ---------------------------------------------------------------------------

export async function makeJsdomBackend() {
  // LynxTestingEnv installs its jsdom `document`/`window` on globalThis every
  // time it switches to the Main Thread.  That is correct for the PAPI
  // implementation, but the real Vapor variant must keep using vue-lynx's
  // ShadowElement DOM shim (production bundles rewrite those accesses to the
  // shim globals).  Capture and restore the runtime-facing constructors while
  // leaving the testing environment's PAPI functions installed.
  const runtimeGlobalNames = [
    'document',
    'window',
    'Node',
    'Element',
    'Text',
    'Comment',
    'CharacterData',
    'DocumentFragment',
    'HTMLElement',
    'SVGElement',
    'MathMLElement',
    'HTMLSlotElement',
    'ShadowRoot',
  ];
  const runtimeGlobals = new Map(
    runtimeGlobalNames.map((name) => [name, globalThis[name]]),
  );
  const restoreRuntimeGlobals = () => {
    for (const [name, value] of runtimeGlobals) {
      if (value !== undefined) globalThis[name] = value;
    }
  };

  const { JSDOM } = await import('jsdom');
  const { LynxTestingEnv } = await import('@lynx-js/testing-environment');
  const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const env = new LynxTestingEnv(jsdom);
  globalThis.lynxTestingEnv = env;
  const installMainThreadPapi = () => {
    env.switchToMainThread();
    const papi = new Map(PAPI_NAMES.map((name) => [name, globalThis[name]]));
    const papiDomGlobals = new Map(
      runtimeGlobalNames
        .filter((name) => env.mainThread.globalThis[name] !== undefined)
        .map((name) => [name, env.mainThread.globalThis[name]]),
    );
    restoreRuntimeGlobals();

    // ElementPAPI's functions read the active `document` global.  Wrap each
    // call so only the PAPI observes jsdom; application/runtime code keeps
    // observing the ShadowElement shim between calls.
    for (const [name, fn] of papi) {
      globalThis[name] = (...args) => {
        for (const [globalName, value] of papiDomGlobals) {
          globalThis[globalName] = value;
        }
        try {
          return fn(...args);
        } finally {
          restoreRuntimeGlobals();
        }
      };
    }
  };
  installMainThreadPapi();

  return {
    kind: 'jsdom',
    env,
    document: jsdom.window.document,
    install() {
      installMainThreadPapi();
    },
    reset() {
      jsdom.window.document.body.innerHTML = '';
    },
    html() {
      return jsdom.window.document.body.innerHTML;
    },
  };
}

/** Normalize HTML for cross-variant comparison (bookkeeping attrs differ by design). */
export function normalizeHtml(html) {
  return html
    .replace(/ vue-ref-\d+="[^"]*"/g, '')
    // Upstream runtime-vapor marks its mount container with `data-v-app`.
    // It is renderer bookkeeping on the engine-owned page, not app output.
    .replace(/^<page class="([^"]*)">/, (_match, classes) => {
      const kept = classes.split(/\s+/).filter((name) => name !== 'data-v-app');
      return kept.length > 0 ? `<page class="${kept.join(' ')}">` : '<page>';
    })
    // Vue's fragment machinery uses empty text nodes as position anchors
    // (hostCreateText('')). They are invisible zero-size placeholders; the
    // lowered variants intentionally don't emit them.
    .replace(/<text><\/text>/g, '')
    // collapse incidental whitespace differences between variants.
    .replace(/\s+</g, '<');
}
