// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  defineComponent,
  getCurrentInstance,
  inject,
  onBeforeUnmount,
} from '@vue/runtime-core';

import { nodeOps } from './node-ops.js';
import type { ShadowElement } from './shadow-element.js';

export const PAGE_COMPONENT_NAME = 'VueLynxPage';

export interface PageRootContext {
  root: ShadowElement;
  owner: object | null;
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

/**
 * Transparent runtime representation of an explicit `<page>` wrapper.
 *
 * Lynx creates the native page before Background JS starts. This component
 * applies the wrapper's attributes to that existing root and renders only its
 * children, so Vue never asks the Main Thread to create a second page.
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

    const { root } = context;
    const owner = {};
    const ownsRoot = context.owner === null;
    let previousAttrs: Record<string, unknown> = {};

    if (ownsRoot) {
      context.owner = owner;
    } else {
      reportMultiplePages();
    }

    expose(root);

    if (ownsRoot) {
      const vnode = getCurrentInstance()?.vnode;
      if (vnode?.scopeId) {
        nodeOps.setScopeId?.(root, vnode.scopeId);
      }
    }

    onBeforeUnmount(() => {
      if (!ownsRoot) return;
      for (const [key, previous] of Object.entries(previousAttrs)) {
        nodeOps.patchProp(root, key, previous, undefined, undefined);
      }
      previousAttrs = {};
      if (context.owner === owner) {
        context.owner = null;
      }
    });

    return () => {
      if (!ownsRoot) return slots.default?.();
      const nextAttrs = { ...attrs };
      const keys = new Set([
        ...Object.keys(previousAttrs),
        ...Object.keys(nextAttrs),
      ]);

      for (const key of keys) {
        const previous = previousAttrs[key];
        const next = nextAttrs[key];
        if (previous !== next) {
          nodeOps.patchProp(root, key, previous, next, undefined);
        }
      }

      previousAttrs = nextAttrs;
      return slots.default?.();
    };
  },
});
