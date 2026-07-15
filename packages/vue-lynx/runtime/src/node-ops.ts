// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { RendererOptions } from '@vue/runtime-core';

import { patchEventProp, resetEventPropState } from './event-props.js';
import { scheduleFlush } from './flush.js';
import { applyMainThreadProp } from './main-thread-props.js';
import { OP, pushOp } from './ops.js';
import { ShadowElement } from './shadow-element.js';
import { normalizeStyleObject } from './style-normalization.js';
import {
  idRegistry,
  insertNode,
  removeNode,
  resolveClass,
  setElementTextContent,
  setIdAttr,
} from './tree-ops.js';

// Class resolution is shared with the Vapor DOM-compat layer.
export { resolveClass } from './tree-ops.js';

// Event prop patching lives in event-props.ts — shared with
// ShadowElement.setAttribute (the Vapor pipeline's chokepoint).
export { patchEventProp } from './event-props.js';

// ---------------------------------------------------------------------------
// RendererOptions implementation
// ---------------------------------------------------------------------------

/**
 * Mount a compile-time-lowered element template (`__vlx-tpl:<id>` vnode).
 *
 * One ShadowElement represents the whole subtree; hole shadows are allocated
 * immediately after it (no CREATE ops — the main thread materializes the
 * subtree inside the template's create() function and maps rootId+1+i to the
 * i-th hole). Subsequent updates flow through patchProp's hole delegation
 * below using ordinary SET_* ops.
 */
function createTemplateInstance(type: string): ShadowElement {
  const tplId = type.slice(TPL_TYPE_PREFIX.length);
  const holeKeys = getElementTemplateHoles(tplId);
  const el = new ShadowElement(type);
  if (!holeKeys) {
    // Unregistered template (should not happen — registration is hoisted in
    // the same module as the render fn). Degrade to an empty view so the
    // surrounding tree still renders.
    if (__DEV__) {
      console.error(
        `[vue-lynx] element template "${tplId}" is not registered — rendering an empty view.`,
      );
    }
    pushOp(OP.CREATE, el.id, 'view');
    scheduleFlush();
    return el;
  }
  const holes: ShadowElement[] = [];
  for (const _ of holeKeys) {
    holes.push(new ShadowElement('#tpl-hole'));
  }
  el._tplHoleKeys = holeKeys;
  el._tplHoles = holes;
  pushOp(OP.INSTANTIATE_TEMPLATE, el.id, tplId, holeKeys.length);
  scheduleFlush();
  return el;
}

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
    pushOp(OP.CREATE_TEXT, el.uid);
    if (text) pushOp(OP.SET_TEXT, el.uid, text);
    scheduleFlush();
    return el;
  },

  // Comment nodes are used by Vue as position anchors for v-if / Fragment.
  // Keep them in the Background Thread shadow tree only. Native Lynx gives an
  // empty raw-text node a default line box, so materialising comments on the
  // Main Thread adds visible height for every v-if branch and Fragment anchor.
  createComment(_text: string): ShadowElement {
    const el = new ShadowElement('#comment');
    pushOp(OP.CREATE, el.uid, '__comment');
    scheduleFlush();
    return el;
  },

  setText(node: ShadowElement, text: string): void {
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
    prevValue: unknown,
    nextValue: unknown,
  ): void {
    // ------------------------------------------------------------------
    // Element-template holes: a lowered template vnode carries its interior
    // dynamic parts as __hN props. Delegate to the hole's ShadowElement with
    // the original prop key so the full event/class/style logic is reused.
    // ------------------------------------------------------------------
    if (el._tplHoles !== undefined && key.startsWith(TPL_HOLE_PREFIX)) {
      const idx = Number(key.slice(TPL_HOLE_PREFIX.length));
      const holeKey = el._tplHoleKeys?.[idx];
      const holeEl = el._tplHoles[idx];
      if (holeKey !== undefined && holeEl !== undefined) {
        if (holeKey === '#text') {
          pushOp(
            OP.SET_TEXT,
            holeEl.id,
            nextValue == null ? '' : String(nextValue),
          );
          scheduleFlush();
        } else {
          nodeOps.patchProp(holeEl, holeKey, prevValue, nextValue);
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
