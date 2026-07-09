// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/** Map from BG-thread ShadowElement id to Lynx Main Thread element handle */
export const elements = new Map<number, LynxElement>();

// ---------------------------------------------------------------------------
// Tree bookkeeping for registry cleanup.
//
// The BG thread only sends REMOVE for the root of an unmounted subtree — the
// engine detaches descendants implicitly. Without our own parent/children
// index, the `elements` map would retain every descendant handle forever;
// long-lived pages that keep creating and removing large trees (lists,
// route switches) would then accumulate unbounded detached elements, with
// severe GC pressure. (Found via the vdom-vs-vapor benchmark: repeated
// 10k-row create/clear cycles degraded from ~1.2s to ~27s per create.)
// ---------------------------------------------------------------------------

const parentOf = new Map<number, number>();
const childrenOf = new Map<number, Set<number>>();

/** Record that `childId` is now parented under `parentId`. */
export function trackInsert(parentId: number, childId: number): void {
  const prevParent = parentOf.get(childId);
  if (prevParent !== undefined && prevParent !== parentId) {
    childrenOf.get(prevParent)?.delete(childId);
  }
  parentOf.set(childId, parentId);
  let siblings = childrenOf.get(parentId);
  if (!siblings) {
    siblings = new Set();
    childrenOf.set(parentId, siblings);
  }
  siblings.add(childId);
}

/** Drop `childId`'s subtree from all registries (elements included). */
export function releaseSubtree(childId: number): void {
  const parentId = parentOf.get(childId);
  if (parentId !== undefined) {
    childrenOf.get(parentId)?.delete(childId);
  }
  const stack = [childId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    elements.delete(id);
    parentOf.delete(id);
    const kids = childrenOf.get(id);
    if (kids) {
      childrenOf.delete(id);
      for (const kid of kids) stack.push(kid);
    }
  }
}

/** Reset tree bookkeeping — for testing only. */
export function resetElementRegistry(): void {
  elements.clear();
  parentOf.clear();
  childrenOf.clear();
}

/**
 * PAPI unique ID of the root PageElement.
 * Passed as `parentComponentUniqueId` to element creation PAPI calls.
 * `__SetCSSId` sets `css_style_sheet_manager_` directly on each element,
 * so CSS rendering works without a ComponentElement ancestor.
 */
export let pageUniqueId = 1;

export function setPageUniqueId(id: number): void {
  pageUniqueId = id;
}
