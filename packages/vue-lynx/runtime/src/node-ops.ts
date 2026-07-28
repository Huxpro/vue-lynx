// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { RendererOptions, VNode } from '@vue/runtime-core';
import { Fragment, Text, createVNode, isVNode } from '@vue/runtime-core';

import { patchEventProp, resetEventPropState } from './event-props.js';
import {
  TPL_HOLE_PREFIX,
  TPL_SLOT_KEY,
  TPL_TYPE_PREFIX,
  getElementTemplateHoles,
} from './element-template.js';
import { scheduleFlush } from './flush.js';
import { applyMainThreadProp } from './main-thread-props.js';
import { OP, pushOp } from './ops.js';
import { ShadowElement } from './shadow-element.js';
import { renderTemplateSlot } from './slot-host.js';
import { normalizeStyleObject } from './style-normalization.js';
import {
  idRegistry,
  insertNode,
  removeNode,
  resolveClass,
  setElementTextContent,
  setIdAttr,
  setTeardownTemplateSlotsHook,
  setTextNode,
} from './tree-ops.js';

// Class resolution is shared with the Vapor DOM-compat layer.
export { resolveClass } from './tree-ops.js';

// Event prop patching lives in event-props.ts — shared with
// ShadowElement.setAttribute (the Vapor pipeline's chokepoint).
export { patchEventProp } from './event-props.js';

// ---------------------------------------------------------------------------
// Element-template helpers
// ---------------------------------------------------------------------------

/**
 * Mount a compile-time-lowered element template (`__vlx-tpl:<id>` vnode).
 *
 * The root ShadowElement represents the whole subtree. Hole shadows allocate
 * the contiguous uid range following the root; the main thread maps those ids
 * to the create() function's returned hole handles. Attr/text updates flow
 * through patchProp's hole delegation using ordinary SET_* ops; element-slot
 * content is mounted into wrapper holes via the Vue renderer and
 * INSERT/REMOVE_TEMPLATE_SLOT.
 */
function createTemplateInstance(type: string): ShadowElement {
  const tplId = type.slice(TPL_TYPE_PREFIX.length);
  const holeKeys = getElementTemplateHoles(tplId);
  const el = new ShadowElement(type);
  if (!holeKeys) {
    if (__DEV__) {
      console.error(
        `[vue-lynx] element template "${tplId}" is not registered — rendering an empty view.`,
      );
    }
    pushOp(OP.CREATE, el.uid, 'view');
    scheduleFlush();
    return el;
  }

  const holes: ShadowElement[] = [];
  const slots: ShadowElement[] = [];
  for (const key of holeKeys) {
    const hole = new ShadowElement(
      key === TPL_SLOT_KEY ? '#tpl-slot' : '#tpl-hole',
    );
    holes.push(hole);
    if (key === TPL_SLOT_KEY) {
      hole._tplRoot = el;
      hole._tplSlotIndex = slots.length;
      slots.push(hole);
    }
  }
  el._tplHoleKeys = holeKeys;
  el._tplHoles = holes;
  el._tplSlots = slots.length > 0 ? slots : undefined;
  pushOp(OP.INSTANTIATE_TEMPLATE, el.uid, tplId, holeKeys.length);
  scheduleFlush();
  return el;
}

/** Normalize a `__hN` slot prop value into a mountable VNode (or null). */
function normalizeSlotContent(value: unknown): VNode | null {
  // Compiler wraps slot expressions in thunks so block tracking does not
  // leak into the template root; invoke here during patchProp.
  let resolved = value;
  if (typeof resolved === 'function') {
    resolved = (resolved as () => unknown)();
  }
  if (resolved == null || resolved === false) return null;
  if (isVNode(resolved)) return resolved;
  if (Array.isArray(resolved)) return createVNode(Fragment, null, resolved);
  return createVNode(Text, null, String(resolved));
}

/** Unmount any element-slot trees rooted on a template instance. */
function teardownTemplateSlots(el: ShadowElement): void {
  if (!el._tplSlots) return;
  for (const slot of el._tplSlots) {
    renderTemplateSlot(null, slot);
  }
}

setTeardownTemplateSlotsHook(teardownTemplateSlots);

// ---------------------------------------------------------------------------
// RendererOptions implementation
// ---------------------------------------------------------------------------

export const nodeOps: RendererOptions<ShadowElement, ShadowElement> = {
  createElement(type: string): ShadowElement {
    if (type.startsWith(TPL_TYPE_PREFIX)) {
      return createTemplateInstance(type);
    }
    // Lynx owns exactly one native <page>, created before the app runs. A
    // `page` vnode must go through the transparent Page built-in (the plugin
    // compiler rewrites template <page> tags; the exported `h` routes
    // h('page', ...)). Reaching here means a bypass path was used —
    // createVNode/JSX or a template compiled without vueLynxCompilerOptions —
    // and the engine will reject the second __CreatePage (error 9901).
    if (__DEV__ && type === 'page') {
      console.error(
        '[vue-lynx] A <page> element reached the renderer as a plain element. '
          + 'It must render through the Page built-in: compile templates with '
          + "pluginVueLynx, or use h('page', ...) / the exported Page "
          + 'component from vue-lynx.',
      );
    }
    const el = new ShadowElement(type);
    pushOp(OP.CREATE, el.uid, type);
    scheduleFlush();
    return el;
  },

  createText(text: string): ShadowElement {
    const el = new ShadowElement('#text');
    el._text = text;
    if (text) {
      pushOp(OP.CREATE_TEXT, el.uid);
      pushOp(OP.SET_TEXT, el.uid, text);
      el._mtCreated = true;
      scheduleFlush();
    }
    return el;
  },

  // Comment nodes are used by Vue as position anchors for v-if / Fragment.
  // They stay in the Background Thread shadow tree only — see tree-ops.ts.
  createComment(text: string): ShadowElement {
    const el = new ShadowElement('#comment');
    el._text = text;
    return el;
  },

  setText(node: ShadowElement, text: string): void {
    if (node.tag === '#text') {
      setTextNode(node, text);
      return;
    }
    pushOp(OP.SET_TEXT, node.uid, text);
    scheduleFlush();
  },

  // Called when a host element's text content changes (e.g. h('text', null, dynamic)).
  setElementText(el: ShadowElement, text: string): void {
    setElementTextContent(el, text);
  },

  insert(
    child: ShadowElement,
    parent: ShadowElement,
    anchor?: ShadowElement | null,
  ): void {
    insertNode(child, parent, anchor);
  },

  remove(child: ShadowElement): void {
    removeNode(child);
  },

  patchProp(
    el: ShadowElement,
    key: string,
    _prevValue: unknown,
    nextValue: unknown,
  ): void {
    // Element-template holes: lowered template vnode props are named __hN.
    // Delegate to the hole with its original prop key so event/class/style
    // behavior stays identical to the normal renderer path.
    if (el._tplHoles !== undefined && key.startsWith(TPL_HOLE_PREFIX)) {
      const idx = Number(key.slice(TPL_HOLE_PREFIX.length));
      const holeKey = el._tplHoleKeys?.[idx];
      const holeEl = el._tplHoles[idx];
      if (holeKey !== undefined && holeEl !== undefined) {
        if (holeKey === TPL_SLOT_KEY) {
          // Element slot: `__hN` carries a VNode (v-if / v-for / component),
          // often as a thunk so openBlock() does not leak into the template
          // root's dynamicChildren. Mount into the wrapper via the Vue
          // renderer; inserts inside emit INSERT_TEMPLATE_SLOT.
          renderTemplateSlot(normalizeSlotContent(nextValue), holeEl);
        } else if (holeKey === '#text') {
          pushOp(
            OP.SET_TEXT,
            holeEl.uid,
            nextValue == null ? '' : String(nextValue),
          );
          scheduleFlush();
        } else {
          nodeOps.patchProp(holeEl, holeKey, undefined, nextValue);
        }
        return;
      }
    }

    // ------------------------------------------------------------------
    // Main-thread worklet props: :main-thread-bindtap, :main-thread-ref
    // ------------------------------------------------------------------
    if (applyMainThreadProp(el, key, nextValue)) return;

    if (patchEventProp(el, key, nextValue)) {
      return;
    } else if (key === 'style') {
      const style = nextValue != null && typeof nextValue === 'object'
        ? normalizeStyleObject(nextValue as Record<string, unknown>)
        : {};
      el._style = style;
      const effective = el._vShowHidden ? { ...style, display: 'none' } : style;
      pushOp(OP.SET_STYLE, el.uid, effective);
    } else if (key === 'class') {
      el._baseClass = (nextValue as string) ?? '';
      const finalClass = resolveClass(el);
      pushOp(OP.SET_CLASS, el.uid, finalClass);
    } else if (key === 'id') {
      setIdAttr(el, nextValue);
      return;
    } else {
      pushOp(OP.SET_PROP, el.uid, key, nextValue);
    }

    scheduleFlush();
  },

  // Called by Vue's renderer after createElement to apply scoped CSS.
  // Vue calls this once per scope ID on the element (own scope, parent scope, etc.).
  setScopeId(el: ShadowElement, id: string): void {
    el._addScopeClass(id);
  },

  parentNode(node: ShadowElement): ShadowElement | null {
    return node.parent;
  },

  nextSibling(node: ShadowElement): ShadowElement | null {
    return node.next;
  },

  querySelector(selector: string): ShadowElement | null {
    if (selector.startsWith('#')) {
      return idRegistry.get(selector.slice(1)) ?? null;
    }
    if (__DEV__) {
      console.warn(
        `[vue-lynx] querySelector only supports #id selectors, got "${selector}".`,
      );
    }
    return null;
  },
};

/** Reset module state – for testing only. */
export function resetNodeOpsState(): void {
  resetEventPropState();
  idRegistry.clear();
}
