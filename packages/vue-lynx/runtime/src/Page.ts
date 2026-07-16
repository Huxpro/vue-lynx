// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  defineComponent,
  getCurrentInstance,
  inject,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
} from '@vue/runtime-core';

import { nodeOps } from './node-ops.js';
import type { ShadowElement } from './shadow-element.js';

export const PAGE_COMPONENT_NAME = 'VueLynxPage';

export interface PageRootContext {
  root: ShadowElement;
  owner: object | null;
  /** Non-owner wrappers waiting to claim the root when the owner releases. */
  waiters?: Set<() => void>;
}

export const pageRootContextKey: unique symbol = Symbol(
  'vue-lynx-page-root',
);

function reportMultiplePages(): void {
  const message = '[vue-lynx] Attempt to render more than one <page>, which is not supported.';
  const lynxGlobal = (globalThis as {
    lynx?: { reportError?: (error: Error) => void };
  }).lynx;
  if (typeof lynxGlobal?.reportError === 'function') {
    lynxGlobal.reportError(new Error(message));
  } else {
    console.error(message);
  }
}

/** Shallow-compare two plain style objects so re-renders that rebuild an
 * identical inline `:style` object don't re-emit a SET_STYLE op. */
function shallowEqualStyle(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    a == null || b == null
    || typeof a !== 'object' || typeof b !== 'object'
    || Array.isArray(a) || Array.isArray(b)
  ) {
    return false;
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  if (aKeys.length !== Object.keys(bObj).length) return false;
  for (const key of aKeys) {
    if (aObj[key] !== bObj[key]) return false;
  }
  return true;
}

/**
 * Transparent runtime representation of an explicit `<page>` wrapper.
 *
 * Lynx creates the native page before Background JS starts. This component
 * applies the wrapper's attributes to that existing root and renders only its
 * children, so Vue never asks the Main Thread to create a second page.
 *
 * Exactly one wrapper owns the root at a time. When the owner unmounts (or is
 * deactivated by `<KeepAlive>`), ownership is handed to the next waiting
 * wrapper — this keeps replacement flows working where the incoming page
 * mounts before the outgoing one unmounts (`<Transition>` without `out-in`,
 * `<Suspense>`, route swaps).
 *
 * @public
 */
export const Page = defineComponent({
  name: PAGE_COMPONENT_NAME,
  inheritAttrs: false,

  setup(_props, { attrs, slots, expose }) {
    const context = inject<PageRootContext>(pageRootContextKey);
    if (!context) {
      throw new Error(
        '[vue-lynx] <page> must be rendered inside a Vue Lynx application.',
      );
    }
    const waiters = context.waiters ??= new Set();

    const { root } = context;
    const owner = {};
    const instance = getCurrentInstance();
    let owned = false;
    let previousAttrs: Record<string, unknown> = {};
    let latestAttrs: Record<string, unknown> = {};
    let appliedScopeId: string | null = null;

    const applyAttrs = (nextAttrs: Record<string, unknown>): void => {
      const keys = new Set([
        ...Object.keys(previousAttrs),
        ...Object.keys(nextAttrs),
      ]);
      for (const key of keys) {
        const previous = previousAttrs[key];
        const next = nextAttrs[key];
        if (previous === next) continue;
        if (key === 'style' && shallowEqualStyle(previous, next)) continue;
        nodeOps.patchProp(root, key, previous, next, undefined);
      }
      previousAttrs = nextAttrs;
    };

    const tryClaim = (): boolean => {
      if (owned) return true;
      if (context.owner !== null) return false;
      context.owner = owner;
      owned = true;
      const scopeId = instance?.vnode.scopeId;
      if (scopeId) {
        nodeOps.setScopeId?.(root, scopeId);
        appliedScopeId = scopeId;
      }
      return true;
    };

    // Invoked by the releasing owner so a waiting wrapper picks ownership up
    // immediately (it may not re-render on its own after the owner unmounts).
    const claimFromWaitlist = (): void => {
      waiters.delete(claimFromWaitlist);
      if (tryClaim()) applyAttrs(latestAttrs);
    };

    const release = (): void => {
      waiters.delete(claimFromWaitlist);
      if (!owned) return;
      applyAttrs({});
      if (appliedScopeId !== null) {
        // scopeIdToCssId('') maps to cssId 0 — Lynx's unscoped default.
        nodeOps.setScopeId?.(root, '');
        appliedScopeId = null;
      }
      owned = false;
      if (context.owner === owner) {
        context.owner = null;
      }
      // Hand the root to the next waiting wrapper, if any.
      const next = waiters.values().next().value;
      next?.();
    };

    if (!tryClaim()) {
      reportMultiplePages();
      waiters.add(claimFromWaitlist);
    }

    expose(root);

    onBeforeUnmount(release);
    // <KeepAlive>: a deactivated wrapper must not keep holding the root.
    onDeactivated(release);
    onActivated(() => {
      if (tryClaim()) {
        applyAttrs(latestAttrs);
      } else if (!waiters.has(claimFromWaitlist)) {
        reportMultiplePages();
        waiters.add(claimFromWaitlist);
      }
    });

    return () => {
      latestAttrs = { ...attrs };
      if (owned) applyAttrs(latestAttrs);
      return slots.default?.();
    };
  },
});
