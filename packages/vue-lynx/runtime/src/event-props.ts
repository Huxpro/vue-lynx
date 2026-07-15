// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Lynx event-prop handling shared by the vdom renderer and the Vapor
 * DOM-compat surface.
 *
 * ReactLynx-style event props (`bindtap`, `catchtap`, `global-bind*`,
 * `onTap`, `onTapOnce`, …) arrive through two pipelines:
 *
 *  - vdom: `nodeOps.patchProp` intercepts the prop key.
 *  - Vapor: the template compiler has no notion of Lynx event props, so
 *    `:bindtap="fn"` compiles to a plain attribute write (`setAttr` →
 *    `el.setAttribute`), including runtime-vapor's internal paths
 *    (fallthrough attrs, `v-bind` spreads). `ShadowElement.setAttribute`
 *    routes function-valued event keys here.
 */

import { register, unregister, updateHandler } from './event-registry.js';
import { scheduleFlush } from './flush.js';
import { OP, pushOp } from './ops.js';
import type { ShadowElement } from './shadow-element.js';

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

/**
 * Register / update / remove a Lynx event prop on an element.
 *
 * Returns `false` when `key` is not an event prop — the caller falls through
 * to its regular attribute/prop path.
 */
export function patchEventProp(
  el: ShadowElement,
  key: string,
  nextValue: unknown,
): boolean {
  const event = parseEventProp(key);
  if (!event) return false;

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

  scheduleFlush();
  return true;
}

/** Reset module state – for testing only. */
export function resetEventPropState(): void {
  elementEventSigns.clear();
  onceWrappers.clear();
}
