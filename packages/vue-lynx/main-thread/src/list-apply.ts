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
 *
 * Cell recycling (inspired by ReactLynx `gSignMap` / `gRecycleMap`):
 * - `enqueueComponent` pools off-screen list-item roots by reuse-identifier.
 * - `componentAtIndex` prefers self-reuse (same uiSign), then cross-item hydrate.
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
 * Active on-screen cells: listFiberId → (uiSign → entry).
 * Mirrors ReactLynx `gSignMap`.
 */
const signMaps = new Map<number, Map<number, ListItemEntry>>();

/**
 * Recycle pools: listFiberId → (reuseKey → (uiSign → entry)).
 * Mirrors ReactLynx `gRecycleMap`.
 */
const recycleMaps = new Map<
  number,
  Map<string, Map<number, ListItemEntry>>
>();

/** BG list id → native Fiber unique id (listID passed to callbacks). */
const listBgToFiberId = new Map<number, number>();

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
// Recycling helpers
// ---------------------------------------------------------------------------

/**
 * Pool key for a list-item.
 * - Explicit `reuse-identifier` → shared pool (cross-item hydrate allowed).
 * - Missing / empty → per-item key so only self-reuse is possible. Putting
 *   every unannotated cell in one pool mixed incompatible shapes (#307 review).
 */
function reuseKeyFor(itemBgId: number): string {
  const reuseId = listItemPlatformInfo.get(itemBgId)?.['reuse-identifier'];
  if (reuseId === undefined || reuseId === null || String(reuseId) === '') {
    return `item:${itemBgId}`;
  }
  return `list-item:${reuseId}`;
}

function allowsCrossItemReuse(reuseKey: string): boolean {
  return reuseKey.startsWith('list-item:');
}

/** Children via Element PAPI; jsdom testing-env falls back to DOM links. */
function childElements(parent: LynxElement): LynxElement[] {
  if (typeof __GetChildren === 'function') {
    try {
      const kids = __GetChildren(parent);
      if (Array.isArray(kids)) return kids as LynxElement[];
    } catch {
      // fall through
    }
  }
  const kids: LynxElement[] = [];
  let child =
    (typeof __FirstElement === 'function'
      ? (__FirstElement(parent) as LynxElement | null)
      : null)
    ?? ((parent as { firstChild?: LynxElement | null }).firstChild ?? null);
  while (child) {
    kids.push(child);
    child =
      (typeof __NextElement === 'function'
        ? (__NextElement(child) as LynxElement | null)
        : null)
      ?? ((child as { nextSibling?: LynxElement | null }).nextSibling ?? null);
  }
  return kids;
}

function attributeNames(el: LynxElement): string[] {
  if (typeof __GetAttributeNames === 'function') {
    try {
      return __GetAttributeNames(el) ?? [];
    } catch {
      // fall through
    }
  }
  const dom = el as { getAttributeNames?: () => string[] };
  return typeof dom.getAttributeNames === 'function'
    ? dom.getAttributeNames()
    : [];
}

function readAttribute(el: LynxElement, name: string): string | null {
  if (typeof __GetAttributeByName === 'function') {
    try {
      const v = __GetAttributeByName(el, name);
      return v == null ? null : String(v);
    } catch {
      // fall through
    }
  }
  const dom = el as { getAttribute?: (n: string) => string | null };
  return typeof dom.getAttribute === 'function' ? dom.getAttribute(name) : null;
}

function writeAttribute(el: LynxElement, name: string, value: string): void {
  __SetAttribute(el, name, value);
}

function removeAttribute(el: LynxElement, name: string): void {
  // Native PAPI uses null to clear; testing env mirrors that.
  __SetAttribute(el, name, null);
}

type ContentSnapshot = {
  text: string | null;
  attrs: [string, string][];
};

function snapshotContent(el: LynxElement): ContentSnapshot {
  const names = attributeNames(el);
  if (names.length === 0) {
    // Raw text nodes: prefer the `text` attribute, then textContent.
    const textAttr = readAttribute(el, 'text');
    if (textAttr !== null) return { text: textAttr, attrs: [] };
    const tc = (el as { textContent?: string | null }).textContent;
    return { text: tc ?? null, attrs: [] };
  }
  const attrs: [string, string][] = [];
  for (const name of names) {
    if (name.startsWith('vue-ref-')) continue;
    attrs.push([name, readAttribute(el, name) ?? '']);
  }
  return { text: null, attrs };
}

function applyContent(el: LynxElement, snap: ContentSnapshot): void {
  if (snap.text !== null && snap.attrs.length === 0) {
    __SetAttribute(el, 'text', snap.text);
    return;
  }
  const keep = new Set(snap.attrs.map(([n]) => n));
  for (const name of attributeNames(el)) {
    if (name.startsWith('vue-ref-')) continue;
    if (!keep.has(name)) removeAttribute(el, name);
  }
  for (const [name, value] of snap.attrs) {
    writeAttribute(el, name, value);
  }
}

function retargetVueRef(el: LynxElement, bgId: number): void {
  for (const name of attributeNames(el)) {
    if (name.startsWith('vue-ref-')) removeAttribute(el, name);
  }
  writeAttribute(el, `vue-ref-${bgId}`, '1');
}

function elementTag(el: LynxElement): string {
  if (typeof __GetTag === 'function') {
    try {
      return String(__GetTag(el));
    } catch {
      // fall through
    }
  }
  return String((el as { nodeName?: string }).nodeName ?? '');
}

/** Require isomorphic trees before cross-item hydrate. */
function shapesCompatible(a: LynxElement, b: LynxElement): boolean {
  if (elementTag(a) !== elementTag(b)) return false;
  const kidsA = childElements(a);
  const kidsB = childElements(b);
  if (kidsA.length !== kidsB.length) return false;
  for (let i = 0; i < kidsA.length; i++) {
    if (!shapesCompatible(kidsA[i]!, kidsB[i]!)) return false;
  }
  return true;
}

function collectSubtree(
  root: LynxElement,
  out: Set<LynxElement>,
): void {
  out.add(root);
  for (const child of childElements(root)) {
    collectSubtree(child, out);
  }
}

/**
 * Cross-item recycle: swap fiber ownership between donor and target subtrees
 * via Element PAPI (not DOM `.firstChild` / `getAttributeNames`).
 *
 * Note on memory (#302 / #307 review): both trees were eagerly CREATEd by Vue
 * ops. Swapping remaps uiSign ownership for the native protocol but does **not**
 * free the displaced tree — total MT trees remain O(data items) until list-item
 * creation is deferred. This path is for correct recycle identity, not a
 * viewport-sized memory bound.
 */
function hydrateListItemEntry(
  donor: ListItemEntry,
  target: ListItemEntry,
): void {
  const recycled = donor.el;
  const orphaned = target.el;
  if (recycled === orphaned) return;

  // Only index fibers in the two subtrees (avoid full-registry rebuild cost
  // for unrelated page elements).
  const fibers = new Set<LynxElement>();
  collectSubtree(recycled, fibers);
  collectSubtree(orphaned, fibers);
  const reverse = new Map<LynxElement, number>();
  for (const [id, el] of elements) {
    if (fibers.has(el)) reverse.set(el, id);
  }

  function walk(a: LynxElement, b: LynxElement): void {
    const idA = reverse.get(a);
    const idB = reverse.get(b);

    const contentA = snapshotContent(a);
    const contentB = snapshotContent(b);
    applyContent(a, contentB);
    applyContent(b, contentA);

    if (idA !== undefined && idB !== undefined) {
      elements.set(idA, b);
      elements.set(idB, a);
      reverse.set(a, idB);
      reverse.set(b, idA);
      retargetVueRef(a, idB);
      retargetVueRef(b, idA);
    } else if (idB !== undefined) {
      elements.set(idB, a);
      reverse.set(a, idB);
      if (idA !== undefined && elements.get(idA) === a) {
        elements.delete(idA);
      }
      retargetVueRef(a, idB);
    }

    const kidsA = childElements(a);
    const kidsB = childElements(b);
    // shapesCompatible already enforced equal lengths
    for (let i = 0; i < kidsA.length; i++) {
      walk(kidsA[i]!, kidsB[i]!);
    }
  }

  walk(recycled, orphaned);
  target.el = recycled;
  donor.el = orphaned;
}

function purgeItemFromPools(childId: number): void {
  for (const sm of signMaps.values()) {
    for (const [sign, entry] of sm) {
      if (entry.bgId === childId) sm.delete(sign);
    }
  }
  for (const rm of recycleMaps.values()) {
    for (const bySign of rm.values()) {
      for (const [sign, entry] of bySign) {
        if (entry.bgId === childId) bySign.delete(sign);
      }
    }
  }
}

function mountListItem(
  list: LynxElement,
  listID: number,
  entry: ListItemEntry,
  operationID: number | undefined,
  enableBatchRender: boolean,
  asyncFlush: boolean,
): number {
  let signMap = signMaps.get(listID);
  let recycleMap = recycleMaps.get(listID);
  if (!signMap || !recycleMap) {
    // Callbacks can outlive a reset in tests — recreate empty pools.
    signMap = new Map();
    recycleMap = new Map();
    signMaps.set(listID, signMap);
    recycleMaps.set(listID, recycleMap);
  }

  const reuseKey = reuseKeyFor(entry.bgId);
  let recycleSignMap = recycleMap.get(reuseKey);
  const ownSign = __GetElementUniqueID(entry.el);

  // 1) Self-reuse: same item scrolled back into view.
  if (recycleSignMap?.has(ownSign)) {
    recycleSignMap.delete(ownSign);
    signMap.set(ownSign, entry);
    __AppendElement(list, entry.el);
    if (!enableBatchRender) {
      __FlushElementTree(entry.el, {
        triggerLayout: true,
        operationID,
        elementID: ownSign,
        listID,
      });
    } else if (asyncFlush) {
      __FlushElementTree(entry.el, { asyncFlush: true });
    }
    return ownSign;
  }

  // 2) Cross-item: only when an explicit reuse-identifier shares a pool
  //    and the donor/target subtrees are structurally isomorphic.
  if (
    allowsCrossItemReuse(reuseKey)
    && recycleSignMap
    && recycleSignMap.size > 0
  ) {
    const first = recycleSignMap.entries().next().value as
      | [number, ListItemEntry]
      | undefined;
    if (first) {
      const [recycledSign, donor] = first;
      recycleSignMap.delete(recycledSign);

      if (
        donor.bgId !== entry.bgId
        && shapesCompatible(donor.el, entry.el)
      ) {
        hydrateListItemEntry(donor, entry);
        // Donor's spare tree (former target root) is immediately recyclable.
        // Reminder: this does not free MT memory — both trees stay alive
        // until list-item creation is deferred (#302 follow-up).
        const spareSign = __GetElementUniqueID(donor.el);
        if (!recycleMap.has(reuseKey)) {
          recycleMap.set(reuseKey, new Map());
          recycleSignMap = recycleMap.get(reuseKey)!;
        }
        recycleSignMap!.set(spareSign, donor);

        signMap.set(recycledSign, entry);
        __AppendElement(list, entry.el);
        if (!enableBatchRender) {
          __FlushElementTree(entry.el, {
            triggerLayout: true,
            operationID,
            elementID: recycledSign,
            listID,
          });
        } else if (asyncFlush) {
          __FlushElementTree(entry.el, { asyncFlush: true });
        }
        return recycledSign;
      }

      // Incompatible shape (or same item) — put donor back and fall through.
      recycleSignMap.set(recycledSign, donor);
    }
  }

  // 3) Fresh mount — use the eagerly created fiber tree.
  __AppendElement(list, entry.el);
  signMap.set(ownSign, entry);
  if (!enableBatchRender) {
    __FlushElementTree(entry.el, {
      triggerLayout: true,
      operationID,
      elementID: ownSign,
      listID,
    });
  } else if (asyncFlush) {
    __FlushElementTree(entry.el, { asyncFlush: true });
  }
  return ownSign;
}

function enqueueListItem(
  listID: number,
  sign: number,
): void {
  const signMap = signMaps.get(listID);
  const recycleMap = recycleMaps.get(listID);
  if (!signMap || !recycleMap) return;

  const entry = signMap.get(sign);
  if (!entry) return;
  signMap.delete(sign);

  const reuseKey = reuseKeyFor(entry.bgId);
  let recycleSignMap = recycleMap.get(reuseKey);
  if (!recycleSignMap) {
    recycleSignMap = new Map();
    recycleMap.set(reuseKey, recycleSignMap);
  }
  recycleSignMap.set(sign, entry);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function createListCallbacks(bgId: number): {
  componentAtIndex: (
    list: LynxElement,
    listID: number,
    cellIndex: number,
    operationID: number,
  ) => number | undefined;
  enqueueComponent: (
    list: LynxElement,
    listID: number,
    sign: number,
  ) => void;
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
    return mountListItem(
      list,
      listID,
      items[cellIndex]!,
      operationID,
      false,
      false,
    );
  };

  const enqueueComponent = (
    _list: LynxElement,
    listID: number,
    sign: number,
  ): void => {
    enqueueListItem(listID, sign);
  };

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
      elementIDs.push(
        mountListItem(
          list,
          listID,
          items[cellIndex]!,
          undefined,
          true,
          false,
        ),
      );
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
  const listID = __GetElementUniqueID(el);
  listBgToFiberId.set(id, listID);
  signMaps.set(listID, new Map());
  recycleMaps.set(listID, new Map());
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
  purgeItemFromPools(childId);
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
  signMaps.clear();
  recycleMaps.clear();
  listBgToFiberId.clear();
}

/** Test helper: current live item bgIds for a list. */
export function getListItemBgIdsForTest(listId: number): number[] {
  return (listItems.get(listId) ?? []).map((e) => e.bgId);
}

/**
 * Test helper: recycle pool size for a list Fiber id.
 * Pass `reuseKey` to inspect one pool; omit to sum every pool for that list
 * (useful when keys are per-item `item:${bgId}`).
 */
export function getRecyclePoolSizeForTest(
  listFiberId: number,
  reuseKey?: string,
): number {
  const map = recycleMaps.get(listFiberId);
  if (!map) return 0;
  if (reuseKey !== undefined) return map.get(reuseKey)?.size ?? 0;
  let n = 0;
  for (const bySign of map.values()) n += bySign.size;
  return n;
}

/** Test helper: active sign-map size for a list Fiber id. */
export function getSignMapSizeForTest(listFiberId: number): number {
  return signMaps.get(listFiberId)?.size ?? 0;
}

export interface ListRecycleProbeResult {
  selfOk: boolean;
  crossOk: boolean;
  sign0: number;
  sign0b: number;
  sign1: number;
  poolAfterLeave: number;
  poolAfterCross: number;
  reuseKey: string;
}

function resolveListBgId(list?: LynxElement | null): number {
  if (list) {
    for (const id of listElementIds) {
      if (elements.get(id) === list) return id;
    }
    try {
      const fiberId = __GetElementUniqueID(list);
      for (const [bgId, fid] of listBgToFiberId) {
        if (fid === fiberId) return bgId;
      }
    } catch {
      // web wrappers may not expose PAPI unique ids the same way
    }
    // Walk ancestors — main-thread-ref may point at an inner node.
    let cur: { parentNode?: unknown } | null | undefined =
      list as { parentNode?: unknown };
    for (let i = 0; i < 8 && cur; i++) {
      for (const id of listElementIds) {
        if (elements.get(id) === cur) return id;
      }
      cur = cur.parentNode as { parentNode?: unknown } | null | undefined;
    }
  }
  // Do not fall back to "first registered list" — that silently probes the
  // wrong list on multi-list pages (#307 review).
  throw new Error('probeListRecycle: could not resolve <list> element');
}

/**
 * Drive enqueue / componentAtIndex against a live list and report whether
 * uiSigns self-reuse and cross-item-reuse. Used by the ListRecycle example
 * and headless browser checks.
 *
 * Calls the same internal mount/enqueue paths as the native callbacks so it
 * works even when `main-thread-ref` resolves to a web wrapper without the
 * callback properties attached.
 */
export function probeListRecycle(
  list?: LynxElement | null,
): ListRecycleProbeResult {
  const bgId = resolveListBgId(list);
  const listEl = elements.get(bgId);
  const listID = listBgToFiberId.get(bgId);
  const items = listItems.get(bgId);
  if (!listEl || listID === undefined || !items || items.length < 2) {
    throw new Error('probeListRecycle requires a list with ≥ 2 items');
  }

  const reuseKey = reuseKeyFor(items[0]!.bgId);

  // Warm index 0 then leave so the probe starts from a pooled state.
  const existing0 = mountListItem(
    listEl,
    listID,
    items[0]!,
    9001,
    false,
    false,
  );
  enqueueListItem(listID, existing0);

  const sign0 = mountListItem(listEl, listID, items[0]!, 9002, false, false);
  enqueueListItem(listID, sign0);
  const poolAfterLeave = getRecyclePoolSizeForTest(listID, reuseKey);

  const sign0b = mountListItem(listEl, listID, items[0]!, 9003, false, false);
  const selfOk = sign0b === sign0;

  enqueueListItem(listID, sign0b);
  const sign1 = mountListItem(listEl, listID, items[1]!, 9004, false, false);
  const crossOk = sign1 === sign0b;
  const poolAfterCross = getRecyclePoolSizeForTest(listID, reuseKey);

  return {
    selfOk,
    crossOk,
    sign0,
    sign0b,
    sign1,
    poolAfterLeave,
    poolAfterCross,
    reuseKey,
  };
}
