// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Late-bound renderer for element-template slot content.
 *
 * Slot children are carried as `__hN` hole props (VNodes) on the lowered
 * template vnode. Mounting them through the Vue renderer into the slot
 * wrapper ShadowElement reuses the full patch/unmount pipeline without
 * making them children of the template vnode (which would fight the baked
 * skeleton). The renderer is installed from index.ts after createRenderer
 * to avoid a circular import with node-ops.
 */

import type { VNode } from '@vue/runtime-core';

import type { ShadowElement } from './shadow-element.js';

type SlotRenderFn = (
  vnode: VNode | null,
  container: ShadowElement,
) => void;

let renderFn: SlotRenderFn | null = null;

/** @internal — called once from the runtime entry after createRenderer. */
export function setTemplateSlotRenderer(fn: SlotRenderFn): void {
  renderFn = fn;
}

/** Mount / patch / unmount a vnode tree into an element-slot wrapper. */
export function renderTemplateSlot(
  vnode: VNode | null,
  container: ShadowElement,
): void {
  renderFn?.(vnode, container);
}
