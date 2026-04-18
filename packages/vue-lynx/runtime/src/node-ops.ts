// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { RendererOptions } from '@vue/runtime-core';

import { register, unregister, updateHandler } from './event-registry.js';
import { scheduleFlush } from './flush.js';
import { OP, pushOp } from './ops.js';
import { registerWorkletCtx } from './run-on-background.js';
import { scopeIdToCssId } from './scope-bridge.js';
import { ShadowElement } from './shadow-element.js';
import type { Worklet } from './worklet-types.js';

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

// Registry for Teleport target resolution: id string → ShadowElement.
const idRegistry = new Map<string, ShadowElement>();

/** Recursively clean up idRegistry for a subtree being removed. */
function cleanupIds(el: ShadowElement): void {
  if (el._id) idRegistry.delete(el._id);
  let child = el.firstChild;
  while (child) {
    cleanupIds(child);
    child = child.next;
  }
}

// ---------------------------------------------------------------------------
// Class resolution — merges user :class with transition classes
// ---------------------------------------------------------------------------

export function resolveClass(el: ShadowElement): string {
  if (el._transitionClasses.size === 0) return el._baseClass;
  const parts: string[] = [];
  if (el._baseClass) parts.push(el._baseClass);
  for (const cls of el._transitionClasses) parts.push(cls);
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// RendererOptions implementation
// ---------------------------------------------------------------------------

export const nodeOps: RendererOptions<ShadowElement, ShadowElement> = {
  createElement(type: string): ShadowElement {
    const el = new ShadowElement(type);
    pushOp(OP.CREATE, el.id, type);
    scheduleFlush();
    return el;
  },

  createText(text: string): ShadowElement {
    const el = new ShadowElement('#text');
    pushOp(OP.CREATE_TEXT, el.id);
    if (text) pushOp(OP.SET_TEXT, el.id, text);
    scheduleFlush();
    return el;
  },

  // Comment nodes are used by Vue as position anchors for v-if / Fragment.
  // We materialise them as invisible placeholder elements on the Main Thread.
  createComment(_text: string): ShadowElement {
    const el = new ShadowElement('#comment');
    pushOp(OP.CREATE, el.id, '__comment');
    scheduleFlush();
    return el;
  },

  setText(node: ShadowElement, text: string): void {
    pushOp(OP.SET_TEXT, node.id, text);
    scheduleFlush();
  },

  // Called when a host element's text content changes (e.g. h('text', null, dynamic)).
  setElementText(el: ShadowElement, text: string): void {
    // Remove all children from shadow tree
    while (el.firstChild) {
      const child = el.firstChild;
      el.removeChild(child);
      pushOp(OP.REMOVE, el.id, child.id);
    }
    // Set text content directly on the element
    pushOp(OP.SET_TEXT, el.id, text);
    scheduleFlush();
  },

  insert(
    child: ShadowElement,
    parent: ShadowElement,
    anchor?: ShadowElement | null,
  ): void {
    // Reparent: if child is moving to a different parent (e.g. KeepAlive move),
    // emit REMOVE from old parent so MT correctly detaches first.
    if (child.parent && child.parent !== parent) {
      pushOp(OP.REMOVE, child.parent.id, child.id);
    }

    // Always update the shadow tree (Vue needs it for internal diffing).
    parent.insertBefore(child, anchor ?? null);

    // Lynx's native <list> only accepts <list-item> children.
    // Vue's v-for creates comment anchor nodes as fragment markers —
    // skip sending them to the Main Thread to avoid NSInvalidArgumentException.
    if (
      parent.type === 'list'
      && (child.type === '#comment' || child.type === '#text')
    ) {
      return;
    }

    // If the anchor is a comment node inside a <list>, it was never inserted
    // on the Main Thread. Walk forward to find the next real (non-comment)
    // sibling so __InsertElementBefore has a valid reference.
    let resolvedAnchor: ShadowElement | null = anchor ?? null;
    if (parent.type === 'list') {
      while (
        resolvedAnchor
        && (resolvedAnchor.type === '#comment'
          || resolvedAnchor.type === '#text')
      ) {
        resolvedAnchor = resolvedAnchor.next;
      }
    }

    const anchorId = resolvedAnchor ? resolvedAnchor.id : -1;
    pushOp(OP.INSERT, parent.id, child.id, anchorId);
    scheduleFlush();
  },

  remove(child: ShadowElement): void {
    if (child?.parent) {
      const parentId = child.parent.id;
      child.parent.removeChild(child);
      cleanupIds(child);
      pushOp(OP.REMOVE, parentId, child.id);
      scheduleFlush();
    }
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
    if (key.startsWith('main-thread-')) {
      const suffix = key.slice('main-thread-'.length);
      if (suffix === 'ref') {
        // MainThreadRef — send the serialised { _wvid, _initValue } to MT
        if (
          nextValue != null && typeof nextValue === 'object'
          && '_wvid' in (nextValue as Record<string, unknown>)
        ) {
          pushOp(
            OP.SET_MT_REF,
            el.id,
            (nextValue as { toJSON(): unknown }).toJSON(),
          );
        }
      } else {
        // Worklet event — suffix is an event key like "bindtap", "bindscroll"
        const event = parseEventProp(suffix);
        if (event && nextValue != null) {
          registerWorkletCtx(nextValue as Worklet);
          pushOp(
            OP.SET_WORKLET_EVENT,
            el.id,
            event.type,
            event.name,
            nextValue,
          );
        } else if (event) {
          // Worklet handler removed — send REMOVE_EVENT so MT clears eventMap
          pushOp(OP.REMOVE_EVENT, el.id, event.type, event.name);
        }
      }
      scheduleFlush();
      return;
    }

    const event = parseEventProp(key);

    if (event) {
      let signs = elementEventSigns.get(el.id);
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
              elementEventSigns.set(el.id, signs);
            }
            signs.set(key, sign);
            // Respect _lynxCatch even on once-events (e.g. @tap.once.stop).
            // The Vue compiler emits onTapOnce: withModifiers(fn, ['stop']),
            // so _lynxCatch lives on the handler, not on the onceHandler wrapper.
            const onceEventType = (handler as { _lynxCatch?: boolean })._lynxCatch
              ? 'catchEvent'
              : event.type;
            pushOp(OP.SET_EVENT, el.id, onceEventType, event.name, sign);
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
            elementEventSigns.set(el.id, signs);
          }
          signs.set(key, sign);
          pushOp(OP.SET_EVENT, el.id, eventType, event.name, sign);
        }
      } else if (oldSign) {
        // Handler removed entirely.
        onceWrappers.delete(oldSign);
        unregister(oldSign);
        signs!.delete(key);
        pushOp(OP.REMOVE_EVENT, el.id, event.type, event.name);
      }
    } else if (key === 'style') {
      const style = nextValue != null && typeof nextValue === 'object'
        ? normalizeStyle(nextValue as Record<string, unknown>)
        : {};
      el._style = style;
      const effective = el._vShowHidden ? { ...style, display: 'none' } : style;
      pushOp(OP.SET_STYLE, el.id, effective);
    } else if (key === 'class') {
      el._baseClass = (nextValue as string) ?? '';
      const finalClass = resolveClass(el);
      pushOp(OP.SET_CLASS, el.id, finalClass);
    } else if (key === 'id') {
      if (el._id) idRegistry.delete(el._id);
      el._id = nextValue as string | undefined;
      if (el._id) idRegistry.set(el._id, el);
      pushOp(OP.SET_ID, el.id, nextValue);
    } else {
      pushOp(OP.SET_PROP, el.id, key, nextValue);
    }

    scheduleFlush();
  },

  // Called by Vue's renderer after createElement to apply scoped CSS.
  // Vue calls this once per scope ID on the element (own scope, parent scope, etc.).
  setScopeId(el: ShadowElement, id: string): void {
    pushOp(OP.SET_SCOPE_ID, el.id, scopeIdToCssId(id));
    scheduleFlush();
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
