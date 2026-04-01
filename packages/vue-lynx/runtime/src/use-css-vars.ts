// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { getCurrentInstance, watchPostEffect } from '@vue/runtime-core';
import type { VNode } from '@vue/runtime-core';

import { OP, pushOp } from './ops.js';
import { scheduleFlush } from './flush.js';
import { ShadowElement } from './shadow-element.js';

// ShapeFlags from @vue/shared (not publicly exported from runtime-core).
// Kept as plain constants to avoid a hard dep on @vue/shared internals.
const SF_ELEMENT = 1;
const SF_COMPONENT = 6; // STATEFUL_COMPONENT (4) | FUNCTIONAL_COMPONENT (2)
const SF_ARRAY_CHILDREN = 16;

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
    // Recurse into the component's rendered subtree
    if (vnode.component) {
      applyVarsToVNode(vnode.component.subTree, vars);
    }
  }

  // Fragment / array children — walk every child
  if (shapeFlag & SF_ARRAY_CHILDREN) {
    const children = vnode.children as VNode[];
    for (const child of children) {
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
 * instead merges the CSS variables into the element's inline style and sends
 * them to the Main Thread via the ops pipeline.
 *
 * Requires `enableCSSInlineVariables: true` and `enableCSSInheritance: true`
 * in `lynx.config.ts` so the Lynx engine propagates `--*` inline-style vars
 * to descendant elements.
 *
 * @hidden
 */
export function useCssVars(
  getter: (ctx: unknown) => Record<string, string>,
): void {
  const instance = getCurrentInstance();
  if (!instance) return;

  watchPostEffect(() => {
    const vars = getter(instance.proxy);
    applyVarsToVNode(instance.subTree, vars);
  });
}
