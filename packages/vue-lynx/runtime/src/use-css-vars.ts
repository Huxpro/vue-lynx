// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  Fragment,
  getCurrentInstance,
  onBeforeUpdate,
  onMounted,
  queuePostFlushCb,
  watchPostEffect,
} from '@vue/runtime-core';
import type { VNode } from '@vue/runtime-core';

import { OP, pushOp } from './ops.js';
import { scheduleFlush } from './flush.js';
import { ShadowElement } from './shadow-element.js';

// ShapeFlags from @vue/shared (not publicly exported from runtime-core).
// Kept as plain constants to avoid a hard dep on @vue/shared internals.
const SF_ELEMENT = 1;
const SF_COMPONENT = 6; // STATEFUL_COMPONENT (4) | FUNCTIONAL_COMPONENT (2)
const SF_ARRAY_CHILDREN = 16;
// SF_TEXT_CHILDREN = 8 — text string children, no VNodes to recurse into.

function applyVarsToEl(el: ShadowElement, vars: Record<string, string>): void {
  const style: Record<string, unknown> = { ...el._style };
  for (const key in vars) {
    // The SFC compiler passes keys WITHOUT the leading '--' (e.g. "v33993c7f").
    // We add '--' here, matching what @vue/runtime-dom does with el.style.setProperty().
    style[`--${key}`] = vars[key];
  }
  // Preserve vShow hidden state
  const effective = el._vShowHidden ? { ...style, display: 'none' } : style;
  pushOp(OP.SET_STYLE, el.id, effective);
  scheduleFlush();
}

function applyVarsToVNode(
  vnode: VNode | null | undefined,
  vars: Record<string, string>,
): void {
  if (!vnode) return;
  const { shapeFlag, el } = vnode;

  if (shapeFlag & SF_ELEMENT) {
    if (el instanceof ShadowElement) {
      applyVarsToEl(el, vars);
    }
  } else if (shapeFlag & SF_COMPONENT) {
    // Recurse into the component's rendered subtree.
    if (vnode.component) {
      applyVarsToVNode(vnode.component.subTree, vars);
    }
  } else if (vnode.type === Fragment && (shapeFlag & SF_ARRAY_CHILDREN)) {
    // Fragment root — walk every sibling child.
    for (const child of vnode.children as VNode[]) {
      applyVarsToVNode(child, vars);
    }
  }
}

/**
 * Lynx-specific implementation of Vue's `useCssVars`.
 *
 * Vue's SFC compiler transforms `v-bind(expr)` inside a `<style>` block into:
 * - CSS:  `color: var(--v33993c7f)`
 * - JS:   `useCssVars(_ctx => ({ "v33993c7f": _ctx.textColor }))`
 *
 * The standard `@vue/runtime-dom` version uses DOM APIs (`el.style.setProperty`)
 * which are unavailable in Lynx's Background Thread.  This implementation
 * instead merges the CSS variables into the component root element's inline
 * style and sends them to the Main Thread via the ops pipeline.
 *
 * CSS vars are stamped on the component's root element(s). The Lynx engine
 * propagates custom property updates to descendants via the CSS inheritance
 * chain (fixed in lynx-family/lynx#5889).
 *
 * Requires `enableCSSInlineVariables: true` in `lynx.config.ts`.
 *
 * @hidden
 */
export function useCssVars(
  getter: (ctx: unknown) => Record<string, string>,
): void {
  const instance = getCurrentInstance();
  if (!instance) return;

  const setVars = () => {
    const vars = getter(instance.proxy);
    applyVarsToVNode(instance.subTree, vars);
  };

  onMounted(() => {
    watchPostEffect(setVars);
  });

  // Re-apply on every component update: patchProp's SET_STYLE overwrites
  // the CSS vars that useCssVars previously merged in, and the VNode tree
  // may have new elements that need vars applied.
  onBeforeUpdate(() => {
    queuePostFlushCb(setVars);
  });
}
