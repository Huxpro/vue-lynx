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
    stampElementDescendants(vnode, vars); // lynx-family/lynx#5889
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
 * Workaround for lynx-family/lynx#5889.
 *
 * When `__SetInlineStyles` updates a CSS custom property on a parent element,
 * the Lynx engine does not re-propagate the new value through the CSS
 * inheritance chain to descendant class rules, despite `enableCSSInheritance`
 * being set. Stamping every element directly means no inheritance is needed.
 *
 * TO REVERT when lynx-family/lynx#5889 is fixed:
 *   1. Delete this function.
 *   2. Remove the `stampElementDescendants(vnode, vars)` call in `applyVarsToVNode`.
 *   Root-only stamping via `applyVarsToEl` will be sufficient once the engine
 *   re-evaluates inheritance on `__SetInlineStyles` updates.
 */
function stampElementDescendants(
  vnode: VNode,
  vars: Record<string, string>,
): void {
  if (!(vnode.shapeFlag & SF_ARRAY_CHILDREN)) return;
  for (const child of vnode.children as VNode[]) {
    applyVarsToVNode(child, vars);
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
 * instead merges the CSS variables into every element's inline style and sends
 * them to the Main Thread via the ops pipeline.
 *
 * CSS vars are stamped on every element in the component subtree rather than
 * only the root. Lynx's `{{--varName}}` class rule resolver reads from an
 * element's own inline styles but does not resolve inherited CSS vars from
 * ancestor inline styles, so each element needs the var present on itself.
 *
 * Requires `enableCSSInlineVariables: true` in `lynx.config.ts`.
 * `enableCSSInheritance` is not required — CSS vars are stamped on every
 * element directly rather than relying on the engine's CSS var inheritance.
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
