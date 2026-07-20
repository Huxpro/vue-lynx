// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * List element management for the Main Thread ops executor.
 *
 * Native <list> elements must be created via __CreateList with callbacks.
 * The native list calls componentAtIndex(list, listID, cellIndex, operationID)
 * when it needs to render an item. We collect items as they're inserted and
 * provide them via the callback.
 *
 * Diffs are flushed via `update-list-info` (insertAction / removeAction /
 * updateAction). INSERT respects anchors (prepend / mid-list). Same-list
 * moves detach then re-insert (like ReactLynx treating insert-before of an
 * existing child as remove+insert).
 */

import { elements, pageUniqueId } from './element-registry.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Per-list state: ordered list of child elements that the native list can request */
interface ListItemEntry {
  el: LynxElement;
  bgId: number;
}
const listItems = new Map<number, ListItemEntry[]>();

/** Set of BG-thread element IDs that are <list> elements */
const listElementIds = new Set<number>();

/** item-key values per bg element ID (for list-item children) */
const itemKeyMap = new Map<number, string>();

/**
 * Platform info attributes for list items — these must go ONLY into
 * update-list-info's insertAction / updateAction, NOT via __SetAttribute on
 * the native element. Setting them both ways causes the native list to count
 * items twice. (Matches React Lynx's platformInfoAttributes.)
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

/** Per list-item bg ID -> platform info attributes (for update-list-info) */
const listItemPlatformInfo = new Map<number, Record<string, unknown>>();

/** How many items native currently knows about (fully synced list length) */
const listItemsReported = new Map<number, number>();

/**
 * Pending remove indices per list, expressed against the list state *before*
 * this applyOps batch's removes (same convention as ReactLynx removeAction).
 */
const pendingRemoves = new Map<number, number[]>();

/** Pending inserts: position is the index in listItems *after* the splice. */
const pendingInserts = new Map<
  number,
  Array<{ position: number; bgId: number }>
>();

/** Pending platform-info updates for items already known to native. */
const pendingUpdates = new Map<
  number,
  Array<Record<string, unknown>>
>();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** No-op: element recycling is tracked separately (see GitHub issues). */
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
    for (let j = 0; j < cellIndexes.length; j++) {
      const cellIndex = cellIndexes[j]!;
      const _operationID = operationIDs[j]!;
      if (cellIndex < 0 || cellIndex >= items.length) {
        elementIDs.push(-1);
        continue;
      }
      const item = items[cellIndex]!.el;
      __AppendElement(list, item);
      const sign = __GetElementUniqueID(item);
      elementIDs.push(sign);
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

/**
 * Detach `childId` from the list tracking array and queue a removeAction.
 * @returns the pre-batch remove index, or -1 if not found.
 */
function detachListItem(
  parentId: number,
  childId: number,
  clearPlatformInfo: boolean,
): number {
  const items = listItems.get(parentId);
  if (!items) return -1;
  const idx = items.findIndex((entry) => entry.bgId === childId);
  if (idx === -1) return -1;

  const pending = pendingRemoves.get(parentId) ?? [];
  // Convert current (post-prior-splices) index → pre-batch index.
  let originalIdx = idx;
  for (const r of pending) {
    if (r <= originalIdx) originalIdx++;
  }
  pending.push(originalIdx);
  pendingRemoves.set(parentId, pending);

  // Drop any not-yet-flushed insert for this child (move / re-insert same batch).
  const inserts = pendingInserts.get(parentId);
  if (inserts) {
    const filtered = inserts.filter((p) => p.bgId !== childId);
    pendingInserts.set(parentId, filtered);
  }

  items.splice(idx, 1);

  const reported = listItemsReported.get(parentId) ?? 0;
  if (idx < reported) {
    listItemsReported.set(parentId, reported - 1);
  }

  if (clearPlatformInfo) {
    itemKeyMap.delete(childId);
    listItemPlatformInfo.delete(childId);
  }

  return originalIdx;
}

function findListIdForItem(itemBgId: number): number | undefined {
  for (const [listId, items] of listItems) {
    if (items.some((e) => e.bgId === itemBgId)) return listId;
  }
  return undefined;
}

function queuePlatformUpdate(listId: number, itemBgId: number): void {
  const items = listItems.get(listId);
  if (!items) return;
  const idx = items.findIndex((e) => e.bgId === itemBgId);
  if (idx === -1) return;

  // Still in this batch's insertAction — platform info merges there.
  const inserts = pendingInserts.get(listId) ?? [];
  if (inserts.some((p) => p.bgId === itemBgId)) return;

  const pInfo = listItemPlatformInfo.get(itemBgId) ?? {};
  const pending = pendingUpdates.get(listId) ?? [];
  const existing = pending.findIndex((u) => u.from === idx);
  const action: Record<string, unknown> = {
    ...pInfo,
    from: idx,
    to: idx,
    flush: false,
    type: 'list-item',
  };
  if (existing >= 0) {
    pending[existing] = action;
  } else {
    pending.push(action);
  }
  pendingUpdates.set(listId, pending);
}

// ---------------------------------------------------------------------------
// Public API (called from ops-apply.ts switch cases)
// ---------------------------------------------------------------------------

/** Check if a parent element ID is a <list> element */
export function isListParent(parentId: number): boolean {
  return listElementIds.has(parentId);
}

/** Check if a prop key is a platform-info attribute for list items */
export function isPlatformInfoAttr(key: string): boolean {
  return PLATFORM_INFO_ATTRS.has(key);
}

/** CREATE case: create a native <list> element and set up tracking state */
export function createListElement(id: number): LynxElement {
  listElementIds.add(id);
  listItems.set(id, []);
  listItemsReported.set(id, 0);
  pendingRemoves.set(id, []);
  pendingInserts.set(id, []);
  pendingUpdates.set(id, []);
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
 * INSERT case: place a child into the list array.
 * `anchorId === -1` → append; otherwise insert before the anchor (prepend /
 * mid-list). If the child is already in this list, treat as a move
 * (detach + re-insert), matching ReactLynx's insertBefore-of-existing-child.
 */
export function insertListItem(
  parentId: number,
  child: LynxElement,
  childId: number,
  anchorId: number = -1,
): void {
  const items = listItems.get(parentId);
  if (!items) return;

  // Same-list move: Vue hostInsert does INSERT without REMOVE when the
  // parent stays the same — detach first so we don't duplicate listItems.
  if (items.some((e) => e.bgId === childId)) {
    detachListItem(parentId, childId, false);
  }

  const entry: ListItemEntry = { el: child, bgId: childId };
  let index: number;
  if (anchorId === -1) {
    index = items.length;
    items.push(entry);
  } else {
    const anchorIdx = items.findIndex((e) => e.bgId === anchorId);
    if (anchorIdx === -1) {
      index = items.length;
      items.push(entry);
    } else {
      index = anchorIdx;
      items.splice(index, 0, entry);
    }
  }

  const pending = pendingInserts.get(parentId) ?? [];
  pending.push({ position: index, bgId: childId });
  pendingInserts.set(parentId, pending);
}

/**
 * REMOVE case: drop a child from the list tracking array and queue a
 * `removeAction` index. Without this, Reset / re-adding the same `item-key`
 * appends duplicates and native list throws error 2202 (duplicated item-key).
 */
export function removeListItem(parentId: number, childId: number): void {
  detachListItem(parentId, childId, true);
}

/** SET_PROP case: store a platform-info attribute for a list item */
export function setPlatformInfoProp(
  id: number,
  key: string,
  value: unknown,
): void {
  const info = listItemPlatformInfo.get(id);
  if (info) {
    info[key] = value;
  } else {
    listItemPlatformInfo.set(id, { [key]: value });
  }
  if (key === 'item-key') itemKeyMap.set(id, String(value));

  const listId = findListIdForItem(id);
  if (listId !== undefined) {
    queuePlatformUpdate(listId, id);
  }
}

/**
 * Post-ops flush: tell the native list about removes / inserts / platform
 * updates via `update-list-info`.
 */
export function flushListUpdates(): void {
  for (const [bgId, items] of listItems) {
    const removes = pendingRemoves.get(bgId) ?? [];
    const inserts = pendingInserts.get(bgId) ?? [];
    const updates = pendingUpdates.get(bgId) ?? [];
    if (
      removes.length === 0
      && inserts.length === 0
      && updates.length === 0
    ) {
      continue;
    }
    const listEl = elements.get(bgId);
    if (!listEl) continue;

    // Stable sort by position; equal positions keep record order (two prepends).
    const insertAction = inserts
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(({ position, bgId: itemBgId }) => {
        const action: Record<string, unknown> = {
          position,
          type: 'list-item',
          'item-key': itemKeyMap.get(itemBgId) ?? String(position),
        };
        const pInfo = listItemPlatformInfo.get(itemBgId);
        if (pInfo) Object.assign(action, pInfo);
        return action;
      });

    __SetAttribute(listEl, 'update-list-info', {
      insertAction,
      removeAction: [...removes].sort((a, b) => a - b),
      updateAction: updates,
    });
    listItemsReported.set(bgId, items.length);
    pendingRemoves.set(bgId, []);
    pendingInserts.set(bgId, []);
    pendingUpdates.set(bgId, []);
  }
}

/** Reset all list state — for testing only. */
export function resetListState(): void {
  listItems.clear();
  listElementIds.clear();
  itemKeyMap.clear();
  listItemPlatformInfo.clear();
  listItemsReported.clear();
  pendingRemoves.clear();
  pendingInserts.clear();
  pendingUpdates.clear();
}
