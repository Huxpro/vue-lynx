// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * List element management for the Main Thread ops executor.
 *
 * Native <list> elements must be created via __CreateList with callbacks.
 * Diffs are flushed via `update-list-info`.
 *
 * Diff strategy (inspired by ReactLynx `ListUpdateInfoRecording`):
 * - Mutate a live `listItems` array so `componentAtIndex` always sees current order.
 * - On flush, diff `lastFlushed` (snapshot after previous flush) against `listItems`
 *   with an LIS-based move detection: items that stay in increasing old-index
 *   order are kept; everything else is remove+insert. This matches ReactLynx's
 *   "move = removeChild + insertBefore" semantics without fragile per-op index math.
 */

import { elements, pageUniqueId } from './element-registry.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Per-list state: ordered list of child elements that the native list can request */
export interface ListItemEntry {
  el: LynxElement;
  bgId: number;
}
const listItems = new Map<number, ListItemEntry[]>();

/** Snapshot of listItems after the last successful flush (native's view). */
const lastFlushed = new Map<number, ListItemEntry[]>();

/** Set of BG-thread element IDs that are <list> elements */
const listElementIds = new Set<number>();

/** item-key values per bg element ID (for list-item children) */
const itemKeyMap = new Map<number, string>();

/**
 * Platform info attributes for list items — these must go ONLY into
 * update-list-info's insertAction / updateAction, NOT via __SetAttribute.
 */
const PLATFORM_INFO_ATTRS = new Set([
  'item-key',
  'estimated-main-axis-size-px',
  'estimated-height-px',
  'estimated-height',
  'reuse-identifier',
  'full-span',
  'sticky-top',
  'sticky-bottom',
  'recyclable',
]);

/** Per list-item bg ID -> platform info attributes */
const listItemPlatformInfo = new Map<number, Record<string, unknown>>();

/** bgIds whose platform info changed since last flush */
const dirtyPlatformInfo = new Set<number>();

/**
 * List BG ids whose structure or platform-info needs a diff on the next flush.
 * `applyOps` calls `flushListUpdates` on every patch — without this set we would
 * re-run LIS over every registered list (including untouched infinite feeds).
 */
const dirtyLists = new Set<number>();

/** list-item bgId → owning <list> bgId (for platform-info → dirtyLists). */
const itemToList = new Map<number, number>();

// ---------------------------------------------------------------------------
// Diff (exported for unit tests)
// ---------------------------------------------------------------------------

export interface ListDiffResult {
  removeAction: number[];
  insertAction: Array<{ position: number; bgId: number }>;
  /** bgIds that remained in place (LIS) — eligible for updateAction */
  stayedBgIds: Set<number>;
}

/**
 * Longest increasing subsequence of `seq` (values are old indices).
 * Returns the set of values (old indices) that are part of one LIS.
 */
export function longestIncreasingSubsequence(
  seq: number[],
): Set<number> {
  const n = seq.length;
  if (n === 0) return new Set();
  // tails[k] = index in seq of smallest tail of LIS length k+1
  const tails: number[] = [];
  const prev: number[] = Array.from({ length: n }, () => -1);

  for (let i = 0; i < n; i++) {
    const v = seq[i]!;
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (seq[tails[mid]!]! < v) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1]!;
    if (lo === tails.length) tails.push(i);
    else tails[lo] = i;
  }

  const lisIdx = new Set<number>();
  let k = tails[tails.length - 1]!;
  while (k >= 0) {
    lisIdx.add(seq[k]!);
    k = prev[k]!;
  }
  return lisIdx;
}

/**
 * Diff old (last flushed) vs new (live listItems) by bgId.
 * Stayers = LIS of old indices among items present in both, in new order.
 * Removals = old indices not in stayers. Insertions = new items not in stayers.
 *
 * `removeAction` indices are relative to the **pre-diff snapshot** (`oldItems`)
 * and must be applied as a batch by native `update-list-info`. Confirmed against
 * ReactLynx `ListUpdateInfoRecording.__toAttribute`: it pushes
 * `removals.push(i)` while iterating `oldChildNodes`, then
 * `removals.sort((a, b) => a - b)` — ascending old indices, not sequential
 * mutating-array indices. Do not reinterpret as "remove index 2 then index 5
 * against a shrinking array" (that would require descending order).
 */
export function diffListItems(
  oldItems: ListItemEntry[],
  newItems: ListItemEntry[],
): ListDiffResult {
  const oldIndex = new Map<number, number>();
  for (let i = 0; i < oldItems.length; i++) {
    oldIndex.set(oldItems[i]!.bgId, i);
  }

  const commonNewOrder: number[] = [];
  for (const entry of newItems) {
    const oi = oldIndex.get(entry.bgId);
    if (oi !== undefined) commonNewOrder.push(oi);
  }
  const stayedOldIndices = longestIncreasingSubsequence(commonNewOrder);

  const removeAction: number[] = [];
  for (let i = 0; i < oldItems.length; i++) {
    if (!stayedOldIndices.has(i)) removeAction.push(i);
  }

  const insertAction: Array<{ position: number; bgId: number }> = [];
  const stayedBgIds = new Set<number>();
  for (const oi of stayedOldIndices) {
    stayedBgIds.add(oldItems[oi]!.bgId);
  }

  for (let pos = 0; pos < newItems.length; pos++) {
    const bgId = newItems[pos]!.bgId;
    if (!stayedBgIds.has(bgId)) {
      insertAction.push({ position: pos, bgId });
    }
  }

  return { removeAction, insertAction, stayedBgIds };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** No-op: element recycling tracked in #302. */
// biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op
function enqueueComponentNoop(): void {}

function createListCallbacks(bgId: number): {
  componentAtIndex: (
    list: LynxElement,
    listID: number,
    cellIndex: number,
    operationID: number,
  ) => number | undefined;
  enqueueComponent: (...args: unknown[]) => void;
  componentAtIndexes: (
    list: LynxElement,
    listID: number,
    cellIndexes: number[],
    operationIDs: number[],
  ) => void;
} {
  const componentAtIndex = (
    list: LynxElement,
    listID: number,
    cellIndex: number,
    operationID: number,
  ): number | undefined => {
    const items = listItems.get(bgId);
    if (!items || cellIndex < 0 || cellIndex >= items.length) return undefined;
    const item = items[cellIndex]!.el;
    __AppendElement(list, item);
    const sign = __GetElementUniqueID(item);
    __FlushElementTree(item, {
      triggerLayout: true,
      operationID,
      elementID: sign,
      listID,
    });
    return sign;
  };

  const enqueueComponent = enqueueComponentNoop;

  const componentAtIndexes = (
    list: LynxElement,
    listID: number,
    cellIndexes: number[],
    operationIDs: number[],
  ): void => {
    const items = listItems.get(bgId);
    if (!items) return;
    const elementIDs: number[] = [];
    for (const cellIndex of cellIndexes) {
      if (cellIndex < 0 || cellIndex >= items.length) {
        elementIDs.push(-1);
        continue;
      }
      const item = items[cellIndex]!.el;
      __AppendElement(list, item);
      elementIDs.push(__GetElementUniqueID(item));
    }
    __FlushElementTree(list, {
      triggerLayout: true,
      operationIDs,
      elementIDs,
      listID,
    });
  };

  return { componentAtIndex, enqueueComponent, componentAtIndexes };
}

function buildPlatformAction(
  itemBgId: number,
  position: number,
): Record<string, unknown> {
  const action: Record<string, unknown> = {
    position,
    type: 'list-item',
    'item-key': itemKeyMap.get(itemBgId) ?? String(position),
  };
  const pInfo = listItemPlatformInfo.get(itemBgId);
  if (pInfo) Object.assign(action, pInfo);
  return action;
}

// ---------------------------------------------------------------------------
// Public API (called from ops-apply.ts switch cases)
// ---------------------------------------------------------------------------

export function isListParent(parentId: number): boolean {
  return listElementIds.has(parentId);
}

export function isPlatformInfoAttr(key: string): boolean {
  return PLATFORM_INFO_ATTRS.has(key);
}

export function createListElement(id: number): LynxElement {
  listElementIds.add(id);
  listItems.set(id, []);
  lastFlushed.set(id, []);
  const cbs = createListCallbacks(id);
  const el = __CreateList(
    pageUniqueId,
    cbs.componentAtIndex,
    cbs.enqueueComponent,
    {},
    cbs.componentAtIndexes,
  );
  __SetCSSId([el], 0);
  return el;
}

/**
 * Place a child into the live list array.
 * `anchorId === -1` → append; otherwise insert before anchor.
 * If the child is already in this list, splice it out first (same-list move).
 */
export function insertListItem(
  parentId: number,
  child: LynxElement,
  childId: number,
  anchorId = -1,
): void {
  const items = listItems.get(parentId);
  if (!items) return;

  const existingIdx = items.findIndex((e) => e.bgId === childId);
  if (existingIdx !== -1) {
    items.splice(existingIdx, 1);
  }

  const entry: ListItemEntry = { el: child, bgId: childId };
  if (anchorId === -1) {
    items.push(entry);
  } else {
    const anchorIdx = items.findIndex((e) => e.bgId === anchorId);
    if (anchorIdx === -1) items.push(entry);
    else items.splice(anchorIdx, 0, entry);
  }
  itemToList.set(childId, parentId);
  dirtyLists.add(parentId);
}

/** Drop a child from the live list array (hard remove). */
export function removeListItem(parentId: number, childId: number): void {
  const items = listItems.get(parentId);
  if (!items) return;
  const idx = items.findIndex((entry) => entry.bgId === childId);
  if (idx === -1) return;
  items.splice(idx, 1);
  itemKeyMap.delete(childId);
  listItemPlatformInfo.delete(childId);
  dirtyPlatformInfo.delete(childId);
  itemToList.delete(childId);
  dirtyLists.add(parentId);
}

/** Store a platform-info attribute; mark dirty for updateAction if already flushed. */
export function setPlatformInfoProp(
  id: number,
  key: string,
  value: unknown,
): void {
  const info = listItemPlatformInfo.get(id);
  if (info) info[key] = value;
  else listItemPlatformInfo.set(id, { [key]: value });
  if (key === 'item-key') itemKeyMap.set(id, String(value));
  dirtyPlatformInfo.add(id);
  const listId = itemToList.get(id);
  if (listId !== undefined) dirtyLists.add(listId);
}

/**
 * Diff lastFlushed → listItems and set `update-list-info`.
 * Only lists in `dirtyLists` are diffed (unrelated patches skip the LIS walk).
 */
export function flushListUpdates(): void {
  if (dirtyLists.size === 0) return;

  for (const bgId of dirtyLists) {
    const items = listItems.get(bgId);
    if (!items) continue;

    const prev = lastFlushed.get(bgId) ?? [];
    const { removeAction, insertAction, stayedBgIds } = diffListItems(
      prev,
      items,
    );

    // Build updateAction with O(stayed) lookups via bgId → index map.
    const indexByBgId = new Map<number, number>();
    for (let i = 0; i < items.length; i++) {
      indexByBgId.set(items[i]!.bgId, i);
    }

    const updateAction: Record<string, unknown>[] = [];
    for (const stayedId of stayedBgIds) {
      if (!dirtyPlatformInfo.has(stayedId)) continue;
      const idx = indexByBgId.get(stayedId);
      if (idx === undefined) continue;
      const pInfo = listItemPlatformInfo.get(stayedId) ?? {};
      updateAction.push({
        ...pInfo,
        from: idx,
        to: idx,
        flush: false,
        type: 'list-item',
      });
      dirtyPlatformInfo.delete(stayedId);
    }

    // Clear dirty flags for inserted items (info already in insertAction).
    for (const { bgId: itemBgId } of insertAction) {
      dirtyPlatformInfo.delete(itemBgId);
    }

    if (
      removeAction.length === 0
      && insertAction.length === 0
      && updateAction.length === 0
    ) {
      continue;
    }

    const listEl = elements.get(bgId);
    if (!listEl) continue;

    __SetAttribute(listEl, 'update-list-info', {
      insertAction: insertAction.map(({ position, bgId: itemBgId }) =>
        buildPlatformAction(itemBgId, position)
      ),
      removeAction,
      updateAction,
    });

    lastFlushed.set(
      bgId,
      items.map((e) => ({ el: e.el, bgId: e.bgId })),
    );
  }

  dirtyLists.clear();
}

/** Reset all list state — for testing only. */
export function resetListState(): void {
  listItems.clear();
  lastFlushed.clear();
  listElementIds.clear();
  itemKeyMap.clear();
  listItemPlatformInfo.clear();
  dirtyPlatformInfo.clear();
  dirtyLists.clear();
  itemToList.clear();
}

/** Test helper: current live item bgIds for a list. */
export function getListItemBgIdsForTest(listId: number): number[] {
  return (listItems.get(listId) ?? []).map((e) => e.bgId);
}
