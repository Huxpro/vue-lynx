// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { RendererOptions } from '@vue/runtime-core';

import { register, unregister, updateHandler } from './event-registry.js';
import { scheduleFlush } from './flush.js';
import { applyMainThreadProp } from './main-thread-props.js';
import { OP, pushOp } from './ops.js';
import { ShadowElement } from './shadow-element.js';
import {
  idRegistry,
  insertNode,
  removeNode,
  resolveClass,
  setElementTextContent,
  setIdAttr,
} from './tree-ops.js';

// ---------------------------------------------------------------------------
// Style normalisation – numeric values → 'Npx' (Lynx requires units)
// ---------------------------------------------------------------------------

// Properties that accept a bare number (no unit needed).
const DIMENSIONLESS = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexOrder',
  'order',
  'opacity',
  'zIndex',
  'aspectRatio',
  'fontWeight',
  'lineClamp',
]);

/**
 * Warned property names — each auto-converted property is warned only once
 * per session to avoid log spam.
 */
const _warnedProps: Set<string> | undefined = __DEV__ ? new Set() : undefined;

function normalizeStyle(
  style: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(style)) {
    const val = style[key];
    // TODO(huxpro): Remove this workaround once the Lynx engine fixes
    // inline style object handling for `flex: 1`.
    //
    // Today the engine may read an int32 numeric `flex` value as 0 when
    // it arrives through the object-style `__SetInlineStyles` path, so we
    // stringify numeric `flex` here to force the engine onto its string parser.
    if (key === 'flex' && typeof val === 'number') {
      out[key] = `${val}`;
    } else if (
      __VUE_LYNX_AUTO_PIXEL_UNIT__
      && typeof val === 'number'
      && !DIMENSIONLESS.has(key)
    ) {
      if (__DEV__ && val !== 0 && !_warnedProps!.has(key)) {
        _warnedProps!.add(key);
        console.warn(
          `[vue-lynx] Numeric style value detected (${key}: ${val} → "${val}px"). `
          + 'This auto-conversion is deprecated and will be removed in the next major version. '
          + 'Use string values with explicit units instead.',
        );
      }
      out[key] = val === 0 ? 0 : `${val}px`;
    } else {
      out[key] = val;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Event prop classification
// ---------------------------------------------------------------------------

interface EventSpec {
  type: string;
  name: string;
  /** True when the Vue compiler emitted an `onXxxOnce` prop key. */
  once: boolean;
}

function parseEventProp(key: string): EventSpec | null {
  if (key.startsWith('global-bind')) {
    return { type: 'bindGlobalEvent', name: key.slice('global-bind'.length), once: false };
  }
  if (key.startsWith('global-catch')) {
    return { type: 'catchGlobalEvent', name: key.slice('global-catch'.length), once: false };
  }
  if (key.startsWith('catch')) {
    return { type: 'catchEvent', name: key.slice('catch'.length), once: false };
  }
  if (/^bind(?!ingx)/.test(key)) {
    return { type: 'bindEvent', name: key.slice('bind'.length), once: false };
  }
  if (/^on[A-Z]/.test(key)) {
    // onTap        → { name: 'tap',       once: false }
    // onTapOnce    → { name: 'tap',       once: true  }
    // onTouchStart → { name: 'touchStart', once: false }
    let name = key.slice(2, 3).toLowerCase() + key.slice(3);
    let once = false;
    if (name.endsWith('Once')) {
      name = name.slice(0, -4);
      once = true;
    }
    return { type: 'bindEvent', name, once };
  }
  return null;
}

// Track the sign registered for each (element, propKey) so we can unregister
// on prop removal / update.
const elementEventSigns = new Map<number, Map<string, string>>();

// For once-events (onXxxOnce prop keys): the once-wrapper closes over a
// mutable `inner` reference so re-renders can update the underlying handler
// without resetting the `called` state.
interface OnceWrapper {
  called: boolean;
  inner: (data: unknown) => void;
}
const onceWrappers = new Map<string, OnceWrapper>();

// Class resolution is shared with the Vapor DOM-compat layer.
export { resolveClass } from './tree-ops.js';

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

    const event = parseEventProp(key);

    if (event) {
      let signs = elementEventSigns.get(el.uid);
      const oldSign = signs?.get(key);

      if (nextValue != null) {
        const handler = nextValue as (data: unknown) => void;
        if (event.once) {
          if (oldSign) {
            // Re-render of a once-event: update the inner handler so the
            // fresh closure is used when the event eventually fires.
            // The `called` state is preserved — if it already fired, the
            // wrapper will keep returning early.
            const wrapper = onceWrappers.get(oldSign);
            if (wrapper) wrapper.inner = handler;
          } else {
            // First registration of a once-event.
            const wrapper: OnceWrapper = { called: false, inner: handler };
            const onceHandler = (data: unknown): void => {
              if (wrapper.called) return;
              wrapper.called = true;
              wrapper.inner(data);
            };
            const sign = register(onceHandler);
            onceWrappers.set(sign, wrapper);
            if (!signs) {
              signs = new Map<string, string>();
              elementEventSigns.set(el.uid, signs);
            }
            signs.set(key, sign);
            // Respect _lynxCatch even on once-events (e.g. @tap.once.stop).
            // The Vue compiler emits onTapOnce: withModifiers(fn, ['stop']),
            // so _lynxCatch lives on the handler, not on the onceHandler wrapper.
            const onceEventType = (handler as { _lynxCatch?: boolean })._lynxCatch
              ? 'catchEvent'
              : event.type;
            pushOp(OP.SET_EVENT, el.uid, onceEventType, event.name, sign);
          }
        } else if (oldSign) {
          // Re-render: update handler in-place so the sign on the Main Thread
          // stays valid.  No new SET_EVENT op needed.
          updateHandler(oldSign, handler);
        } else {
          // First time this event is bound on this element.
          // If the handler is tagged _lynxCatch (from withModifiers '.stop'),
          // use catchEvent so native Lynx stops bubbling at this element.
          const eventType = (handler as { _lynxCatch?: boolean })._lynxCatch
            ? 'catchEvent'
            : event.type;
          const sign = register(handler);
          if (!signs) {
            signs = new Map<string, string>();
            elementEventSigns.set(el.uid, signs);
          }
          signs.set(key, sign);
          pushOp(OP.SET_EVENT, el.uid, eventType, event.name, sign);
        }
      } else if (oldSign) {
        // Handler removed entirely.
        onceWrappers.delete(oldSign);
        unregister(oldSign);
        signs!.delete(key);
        pushOp(OP.REMOVE_EVENT, el.uid, event.type, event.name);
      }
    } else if (key === 'style') {
      const style = nextValue != null && typeof nextValue === 'object'
        ? normalizeStyle(nextValue as Record<string, unknown>)
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
  elementEventSigns.clear();
  onceWrappers.clear();
  idRegistry.clear();
}
