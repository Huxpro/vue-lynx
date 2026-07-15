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

export const nodeOps: RendererOptions<ShadowElement, ShadowElement> = {
  createElement(type: string): ShadowElement {
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
  // We materialise them as invisible placeholder elements on the Main Thread.
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
    _prevValue: unknown,
    nextValue: unknown,
  ): void {
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
