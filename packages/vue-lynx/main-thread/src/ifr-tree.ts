// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * IFR tree handover (`ifrHandover: 'tree'`, D1 of
 * `plans/0731-1-rl-render-to-opcodes-insights.md`).
 *
 * The stream handover (`ifr.ts`) compares the background op stream against the
 * recorded main-thread stream **frame by frame in order**, and any deviation
 * costs a full teardown + replay. Stream equality is strictly stronger than
 * tree equality: it is sensitive to op order and flush granularity, not just to
 * the resulting tree.
 *
 * This module replaces the recording with a **paint tree** — the tree the first
 * frame actually produced — and turns hydration into **adoption**: background
 * allocations are matched structurally against painted nodes and the background
 * id is aliased onto the painted element (`elements.set(bgId, paintEl)`), which
 * is the main-thread-side equivalent of ReactLynx's `hydrate()` + `options.swap`
 * id map. Downstream ops need no rewriting because they address the background
 * id, which now resolves to the painted element.
 *
 * Consequences:
 *  - Determinism drops from a correctness requirement to a performance one.
 *    A divergent render costs the diverging nodes, not the page.
 *  - Adoption is **prefix-only per parent**: children are claimed in order and
 *    the first mismatch stops adoption for that parent. Everything after it is
 *    created for real and inserted with normal semantics, which keeps ordering
 *    correct without any repair pass (a fresh node can never need to anchor
 *    into the adopted prefix — if it did, the prefix would have stopped there).
 *  - Misses are always safe. An unknown template size, a list parent, a tag
 *    mismatch, an id already materialized by an earlier batch — every one of
 *    them degrades to "create it for real", never to a wrong tree.
 *
 * Not adopted into: `list` children (native list ownership rides on
 * `update-list-info` / enqueue callbacks, which adoption would bypass) and
 * allocation frames whose block size cannot be derived (`+b:c`'s
 * INSTANTIATE_BOUND_TEMPLATE when the bound entry is absent).
 */

import { OP, OP_ARITY, PAGE_ROOT_ID } from 'vue-lynx/internal/ops';
import type { TemplateNode } from 'vue-lynx/internal/ops';

import { elements, releaseSubtree, trackInsert } from './element-registry.js';
import { getTemplateSlotParent } from './element-templates.js';
import {
  getBoundVaporTemplate,
  getVaporStructure,
} from './vapor-templates.js';

const ARITY = OP_ARITY as Readonly<Record<number, number | undefined>>;

/**
 * Parent addressing key: `${id}` for element parents, `${rootId}#${slotIndex}`
 * for template element slots (the slot parent may be anonymous under sparse
 * naming, so it has no id of its own).
 */
type SlotKey = string;

/** One allocation frame's product: a contiguous id block with a kind tag. */
interface AllocNode {
  /** Structural signature — two nodes may only be matched when equal. */
  kind: string;
  /** Number of ids this frame names, starting at the frame's root id. 0 = unknown. */
  block: number;
}

/** The tree an op stream produces, simulated without touching the engine. */
export interface OpTree {
  alloc: Map<number, AllocNode>;
  children: Map<SlotKey, number[]>;
  /** Registered template id → named element count (block size for clones). */
  trees: Map<number, number>;
  /** Ids created as `list` elements — never adopted into. */
  lists: Set<number>;
  /** id → value key → last value, for skipping redundant SET_* on adoption. */
  values: Map<number, Map<string, unknown>>;
  /** Paint side only: element handles captured after the ops were applied. */
  handles: Map<number, LynxElement>;
  /**
   * owner id → its `${id}#${slot}` child keys. Without this index every
   * adoption step would rescan `children.keys()`, which is O(nodes) per node
   * — quadratic on a first screen, and first screens are exactly where this
   * code runs.
   */
  slotKeys: Map<number, string[]>;
}

export function createOpTree(): OpTree {
  return {
    alloc: new Map(),
    children: new Map(),
    trees: new Map(),
    lists: new Set(),
    values: new Map(),
    handles: new Map(),
    slotKeys: new Map(),
  };
}

/** Structural deep equality for op payloads (styles, worklet ctx, arrays). */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    a === null
    || b === null
    || typeof a !== 'object'
    || typeof b !== 'object'
  ) {
    return false;
  }

  const aIsArray = Array.isArray(a);
  if (aIsArray !== Array.isArray(b)) return false;
  if (aIsArray) {
    const aArray = a as unknown[];
    const bArray = b as unknown[];
    if (aArray.length !== bArray.length) return false;
    for (let i = 0; i < aArray.length; i++) {
      if (!sameValue(aArray[i], bArray[i])) return false;
    }
    return true;
  }

  const aObject = a as Record<string, unknown>;
  const bObject = b as Record<string, unknown>;
  const aKeys = Object.keys(aObject);
  if (aKeys.length !== Object.keys(bObject).length) return false;
  for (const key of aKeys) {
    if (
      !Object.prototype.hasOwnProperty.call(bObject, key)
      || !sameValue(aObject[key], bObject[key])
    ) {
      return false;
    }
  }
  return true;
}

/** Named element count of a registered structure (pre-order slot count). */
function countStructureNodes(node: TemplateNode): number {
  let n = 1;
  for (const child of node[2]) n += countStructureNodes(child);
  return n;
}

function namedCount(
  structure: TemplateNode | undefined,
  addressedOr0: unknown,
): number {
  if (Array.isArray(addressedOr0)) return addressedOr0.length;
  return structure ? countStructureNodes(structure) : 0;
}

/**
 * Value ops that must always be re-applied from the background frame: the
 * worklet ctx carries the BG `_execId` needed by `runOnBackground`, and refs
 * are owned by the reactive realm.
 */
const ALWAYS_OPS: ReadonlySet<number> = new Set([
  OP.SET_WORKLET_EVENT,
  OP.SET_MT_REF,
  OP.INIT_MT_REF,
]);

/** Addressable value frames: `(elementId, key)` → payload at `valueIndex`. */
function valueFrame(
  ops: unknown[],
  start: number,
  code: number,
): { id: number; key: string; valueIndex: number } | null {
  switch (code) {
    case OP.SET_PROP:
      return {
        id: ops[start + 1] as number,
        key: `p:${String(ops[start + 2])}`,
        valueIndex: start + 3,
      };
    case OP.SET_TEXT:
      return { id: ops[start + 1] as number, key: 't', valueIndex: start + 2 };
    case OP.SET_STYLE:
      return { id: ops[start + 1] as number, key: 's', valueIndex: start + 2 };
    case OP.SET_CLASS:
      return { id: ops[start + 1] as number, key: 'c', valueIndex: start + 2 };
    case OP.SET_ID:
      return { id: ops[start + 1] as number, key: 'i', valueIndex: start + 2 };
    case OP.SET_EVENT:
      return {
        id: ops[start + 1] as number,
        key: `ev:${String(ops[start + 2])}:${String(ops[start + 3])}`,
        valueIndex: start + 4,
      };
    default:
      return null;
  }
}

function childList(tree: OpTree, key: SlotKey): number[] {
  let list = tree.children.get(key);
  if (!list) {
    list = [];
    tree.children.set(key, list);
    const hash = key.indexOf('#');
    if (hash >= 0) {
      const owner = Number(key.slice(0, hash));
      const keys = tree.slotKeys.get(owner);
      if (keys) keys.push(key);
      else tree.slotKeys.set(owner, [key]);
    }
  }
  return list;
}

function linkChild(
  tree: OpTree,
  key: SlotKey,
  childId: number,
  anchorId: number,
): void {
  const list = childList(tree, key);
  // A move re-links: drop the previous position first.
  const previous = list.indexOf(childId);
  if (previous >= 0) list.splice(previous, 1);
  const at = anchorId === -1 ? -1 : list.indexOf(anchorId);
  if (at < 0) list.push(childId);
  else list.splice(at, 0, childId);
}

function unlinkChild(tree: OpTree, key: SlotKey, childId: number): void {
  const list = tree.children.get(key);
  if (!list) return;
  const at = list.indexOf(childId);
  if (at >= 0) list.splice(at, 1);
}

function recordValue(
  tree: OpTree,
  id: number,
  key: string,
  value: unknown,
): void {
  let map = tree.values.get(id);
  if (!map) {
    map = new Map();
    tree.values.set(id, map);
  }
  map.set(key, value);
}

/**
 * Fold one op batch into the tree it produces. `capture` snapshots the element
 * handles for every named id (paint side: the ops have already been applied,
 * so the registry holds the real handles).
 */
export function consumeOps(
  tree: OpTree,
  ops: unknown[],
  capture = false,
): void {
  const len = ops.length;
  let i = 0;

  const alloc = (id: number, kind: string, block: number): void => {
    tree.alloc.set(id, { kind, block });
    if (!capture) return;
    for (let k = 0; k < Math.max(block, 1); k++) {
      const el = elements.get(id + k);
      if (el) tree.handles.set(id + k, el);
    }
  };

  while (i < len) {
    const code = ops[i] as number;
    const arity = ARITY[code];
    if (arity === undefined || i + arity >= len) break;
    const s = i;
    i += arity + 1;

    switch (code) {
      case OP.CREATE: {
        const id = ops[s + 1] as number;
        const type = ops[s + 2] as string;
        if (type === 'list') tree.lists.add(id);
        alloc(id, `e:${type}`, 1);
        break;
      }
      case OP.CREATE_TEXT:
        alloc(ops[s + 1] as number, 't', 1);
        break;

      case OP.REGISTER_TREE: {
        const treeId = ops[s + 1] as number;
        tree.trees.set(
          treeId,
          namedCount(ops[s + 2] as TemplateNode, ops[s + 3]),
        );
        break;
      }
      case OP.REGISTER_TREE_BUNDLE: {
        const treeId = ops[s + 1] as number;
        tree.trees.set(
          treeId,
          namedCount(getVaporStructure(ops[s + 2] as string), ops[s + 3]),
        );
        break;
      }
      case OP.CLONE_TREE: {
        const treeId = ops[s + 1] as number;
        alloc(
          ops[s + 2] as number,
          `c:${treeId}`,
          tree.trees.get(treeId) ?? 0,
        );
        break;
      }
      case OP.INSTANTIATE_BOUND_TEMPLATE: {
        const treeId = ops[s + 1] as number;
        const bound = getBoundVaporTemplate(treeId);
        const block = bound?.namedParents?.length
          ?? tree.trees.get(treeId)
          ?? 0;
        alloc(ops[s + 2] as number, `b:${treeId}`, block);
        break;
      }
      case OP.INSTANTIATE_TEMPLATE: {
        const rootId = ops[s + 1] as number;
        const tplId = ops[s + 2] as string;
        const holeCount = ops[s + 3] as number;
        alloc(rootId, `i:${tplId}`, holeCount + 1);
        break;
      }

      case OP.INSERT:
        linkChild(
          tree,
          String(ops[s + 1] as number),
          ops[s + 2] as number,
          ops[s + 3] as number,
        );
        break;
      case OP.INSERT_TEMPLATE_SLOT:
        linkChild(
          tree,
          `${ops[s + 1] as number}#${ops[s + 2] as number}`,
          ops[s + 3] as number,
          ops[s + 4] as number,
        );
        break;
      case OP.REMOVE:
        unlinkChild(
          tree,
          String(ops[s + 1] as number),
          ops[s + 2] as number,
        );
        break;
      case OP.REMOVE_TEMPLATE_SLOT:
        unlinkChild(
          tree,
          `${ops[s + 1] as number}#${ops[s + 2] as number}`,
          ops[s + 3] as number,
        );
        break;

      case OP.REMOVE_EVENT:
        tree.values.get(ops[s + 1] as number)?.delete(
          `ev:${String(ops[s + 2])}:${String(ops[s + 3])}`,
        );
        break;

      default: {
        const frame = valueFrame(ops, s, code);
        if (frame) {
          recordValue(tree, frame.id, frame.key, ops[frame.valueIndex]);
        }
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Adoption
// ---------------------------------------------------------------------------

export interface Adoption {
  /** background id → paint id, for block roots and interior ids alike. */
  paintIdOf: Map<number, number>;
  /** background allocation frames whose execution is replaced by adoption. */
  dropAlloc: Set<number>;
  /** background children whose INSERT is unnecessary (already in place). */
  dropInsert: Set<number>;
  /** paint block roots that have been claimed. */
  claimed: Set<number>;
  /** background ids materialized for real — never adoptable afterwards. */
  materialized: Set<number>;
}

export function createAdoption(): Adoption {
  return {
    paintIdOf: new Map(),
    dropAlloc: new Set(),
    dropInsert: new Set(),
    claimed: new Set(),
    materialized: new Set(),
  };
}

function claim(
  paint: OpTree,
  adoption: Adoption,
  parentBgId: number,
  bgId: number,
  paintId: number,
  block: number,
  suppressInsert: boolean,
): void {
  adoption.claimed.add(paintId);
  adoption.dropAlloc.add(bgId);
  // Once a parent's child order has diverged, the adopted element may sit at
  // the wrong index: keep the element, re-issue the INSERT. One move per node
  // instead of rebuilding its subtree.
  if (suppressInsert) adoption.dropInsert.add(bgId);
  for (let k = 0; k < block; k++) {
    const el = paint.handles.get(paintId + k);
    if (!el) continue;
    adoption.paintIdOf.set(bgId + k, paintId + k);
    elements.set(bgId + k, el);
    // Registry bookkeeping the skipped INSERT would have done. Interior
    // template ids hang off their block root so `releaseSubtree` still frees
    // the whole instance when the root is removed.
    trackInsert(k === 0 ? parentBgId : bgId, bgId + k);
  }
}

/**
 * Match the incoming (background) tree against the paint tree, top-down from
 * the page root, and claim every matching prefix.
 *
 * Idempotent: re-running it after another batch has been folded in re-derives
 * the same decisions and only extends them.
 */
export function matchTrees(
  paint: OpTree,
  incoming: OpTree,
  adoption: Adoption,
): void {
  const walk = (paintKey: SlotKey, bgKey: SlotKey, listParent: boolean): void => {
    const paintKids = paint.children.get(paintKey);
    const bgKids = incoming.children.get(bgKey);
    if (!paintKids || !bgKids) return;
    if (listParent) return; // native list ownership — never adopt into it

    const parentBgId = bgKey.includes('#')
      ? Number(bgKey.slice(0, bgKey.indexOf('#')))
      : Number(bgKey);

    let cursor = 0;
    // Set once the two child orders stop agreeing. From that point adopted
    // elements keep being reused but their INSERT is replayed, so the final
    // order is the background's regardless of where they were painted.
    let orderDirty = false;

    for (const bgId of bgKids) {
      const bgNode = incoming.alloc.get(bgId);
      if (
        !bgNode
        || bgNode.block === 0
        || adoption.materialized.has(bgId)
      ) {
        // Not an adoptable allocation (a move, a later-batch node, or an
        // unknown block size): it is materialized for real and lands after
        // whatever has been adopted so far.
        orderDirty = true;
        continue;
      }

      // One-step lookahead: `cursor` matches the common case, `cursor + 1`
      // absorbs a single painted child the background dropped. Anything
      // deeper degrades to "create it", which is always correct.
      const already = adoption.paintIdOf.get(bgId);
      if (already !== undefined) {
        // Claimed by an earlier batch; keep the cursor in step and recurse.
        const at = paintKids.indexOf(already, cursor);
        if (at >= 0) cursor = at + 1;
        for (let k = 0; k < bgNode.block; k++) {
          walk(
            String(already + k),
            String(bgId + k),
            paint.lists.has(already + k),
          );
        }
        for (const key of paint.slotKeys.get(already) ?? []) {
          walk(key, `${bgId}${key.slice(key.indexOf('#'))}`, false);
        }
        continue;
      }

      let matchAt = -1;
      const limit = Math.min(cursor + 2, paintKids.length);
      for (let probe = cursor; probe < limit; probe++) {
        const paintId = paintKids[probe]!;
        const paintNode = paint.alloc.get(paintId);
        if (
          paintNode
          && !adoption.claimed.has(paintId)
          && paintNode.kind === bgNode.kind
          && paintNode.block === bgNode.block
        ) {
          matchAt = probe;
          break;
        }
      }

      if (matchAt < 0) {
        // The background inserted something the paint tree does not have.
        orderDirty = true;
        continue;
      }
      if (matchAt !== cursor) orderDirty = true; // painted children skipped

      const paintId = paintKids[matchAt]!;
      claim(
        paint,
        adoption,
        parentBgId,
        bgId,
        paintId,
        bgNode.block,
        !orderDirty,
      );
      cursor = matchAt + 1;

      // Recurse over the whole id block: children may hang off any named
      // interior node, or off a template element slot addressed by index.
      for (let k = 0; k < bgNode.block; k++) {
        walk(
          String(paintId + k),
          String(bgId + k),
          paint.lists.has(paintId + k),
        );
      }
      for (const key of paint.slotKeys.get(paintId) ?? []) {
        walk(key, `${bgId}${key.slice(key.indexOf('#'))}`, false);
      }
    }
  };

  walk(String(PAGE_ROOT_ID), String(PAGE_ROOT_ID), false);
}

/**
 * Rewrite one background batch for application: drop the frames adoption has
 * already satisfied, keep everything else verbatim.
 */
export function filterBatch(
  ops: unknown[],
  paint: OpTree,
  adoption: Adoption,
): unknown[] {
  const out: unknown[] = [];
  const len = ops.length;
  let i = 0;

  while (i < len) {
    const code = ops[i] as number;
    const arity = ARITY[code];
    if (arity === undefined || i + arity >= len) {
      // Malformed tail: pass through untouched rather than guessing.
      for (; i < len; i++) out.push(ops[i]);
      break;
    }
    const s = i;
    i += arity + 1;
    let drop = false;

    switch (code) {
      case OP.CREATE:
      case OP.CREATE_TEXT:
      case OP.INSTANTIATE_TEMPLATE:
        drop = adoption.dropAlloc.has(ops[s + 1] as number);
        if (!drop) adoption.materialized.add(ops[s + 1] as number);
        break;
      case OP.CLONE_TREE:
      case OP.INSTANTIATE_BOUND_TEMPLATE:
        drop = adoption.dropAlloc.has(ops[s + 2] as number);
        if (!drop) adoption.materialized.add(ops[s + 2] as number);
        break;
      case OP.INSERT:
        drop = adoption.dropInsert.has(ops[s + 2] as number);
        break;
      case OP.INSERT_TEMPLATE_SLOT:
        drop = adoption.dropInsert.has(ops[s + 3] as number);
        break;
      case OP.REMOVE_EVENT: {
        const paintId = adoption.paintIdOf.get(ops[s + 1] as number);
        if (paintId !== undefined) {
          const key = `ev:${String(ops[s + 2])}:${String(ops[s + 3])}`;
          drop = !paint.values.get(paintId)?.has(key);
        }
        break;
      }
      default: {
        if (ALWAYS_OPS.has(code)) break;
        const frame = valueFrame(ops, s, code);
        if (!frame) break;
        const paintId = adoption.paintIdOf.get(frame.id);
        if (paintId === undefined) break;
        const painted = paint.values.get(paintId);
        drop = painted !== undefined
          && painted.has(frame.key)
          && sameValue(painted.get(frame.key), ops[frame.valueIndex]);
        break;
      }
    }

    if (!drop) for (let k = s; k < i; k++) out.push(ops[k]);
  }

  return out;
}

/**
 * Remove everything the background never claimed. Deferred to the end of
 * hydration so a node arriving in a later batch can still adopt.
 */
export function sweepUnclaimed(paint: OpTree, adoption: Adoption): boolean {
  let removedAny = false;

  const removeUnder = (paintKey: SlotKey, parent: LynxElement | undefined): void => {
    const kids = paint.children.get(paintKey);
    if (!kids || !parent) return;
    for (const paintId of kids) {
      if (adoption.claimed.has(paintId)) continue;
      const el = paint.handles.get(paintId);
      if (!el) continue;
      __RemoveElement(parent, el);
      // Only release the registry entry when it still refers to THIS element:
      // a background node that was materialized for real may already own the
      // same numeric id (both realms count from the same seed).
      if (elements.get(paintId) === el) releaseSubtree(paintId);
      removedAny = true;
    }
  };

  const visit = (paintId: number): void => {
    const node = paint.alloc.get(paintId);
    const block = node ? Math.max(node.block, 1) : 1;
    const descend = (key: SlotKey): void => {
      for (const child of paint.children.get(key) ?? []) {
        if (adoption.claimed.has(child)) visit(child);
      }
    };
    for (let k = 0; k < block; k++) {
      removeUnder(String(paintId + k), paint.handles.get(paintId + k));
      descend(String(paintId + k));
      for (const key of paint.slotKeys.get(paintId + k) ?? []) {
        removeUnder(
          key,
          getTemplateSlotParent(paintId + k, Number(key.slice(key.indexOf('#') + 1))),
        );
        descend(key);
      }
    }
  };

  removeUnder(String(PAGE_ROOT_ID), elements.get(PAGE_ROOT_ID));
  for (const child of paint.children.get(String(PAGE_ROOT_ID)) ?? []) {
    if (adoption.claimed.has(child)) visit(child);
  }

  // Drop the paint-side aliases the background renamed, so the registry keeps
  // exactly one key per live element.
  for (const [bgId, paintId] of adoption.paintIdOf) {
    if (bgId === paintId) continue;
    if (elements.get(paintId) === paint.handles.get(paintId)) {
      elements.delete(paintId);
    }
  }

  return removedAny;
}

/** Remove every painted root — the render-failure path. */
export function teardownPaintTree(paint: OpTree): boolean {
  const page = elements.get(PAGE_ROOT_ID);
  const roots = paint.children.get(String(PAGE_ROOT_ID)) ?? [];
  let removed = false;
  if (page) {
    for (const rootId of roots) {
      const el = paint.handles.get(rootId);
      if (el) {
        __RemoveElement(page, el);
        removed = true;
      }
    }
  }
  return removed;
}
