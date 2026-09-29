// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main-thread element-template registry.
 *
 * Element templates are compile-time-lowered static subtrees: a create()
 * function of straight-line PAPI calls returning `[root, hole0, hole1, …]`.
 * They are registered at bundle-evaluation time — before any renderPage or
 * ops batch — through `globalThis.__vueLynxRegisterTemplate` (installed by
 * entry-main):
 *
 *  - IFR bundles: the full render module runs on this thread; the runtime's
 *    `registerElementTemplate` forwards the create() here.
 *  - Interpreter-only bundles: worklet-loader-mt extracts the hoisted
 *    registration statements from the compiled render module, which call the
 *    same global.
 *
 * The registry is intentionally NOT cleared by resetMainThreadState():
 * registration happens once per bundle evaluation while renderPage may run
 * multiple times (reload, tests).
 *
 * Hole keys distinguish attr/text bindings from element slots (`'#slot'`).
 * Element-slot handles are also indexed by slot-index (order among `'#slot'`
 * keys) so INSERT/REMOVE_TEMPLATE_SLOT can address them without a stable
 * parent FiberElement id (needed once sparse ET makes parents anonymous).
 */

import { TPL_SLOT_KEY } from 'vue-lynx/internal/ops';

type CreateFn = (pageUniqueId: number) => LynxElement[];

interface TemplateEntry {
  create: CreateFn;
  holes: string[];
  /** Indices into create()'s return array (skipping root at 0) for `#slot`. */
  slotHoleOffsets: number[];
}

const templates = new Map<string, TemplateEntry>();

interface InstanceSlots {
  /** element-slot handles in slot-index order */
  handles: LynxElement[];
  /** registry ids of those handles (rootId + 1 + hole offset) */
  ids: number[];
}

/** template rootId → element-slot handles/ids in slot-index order */
const instanceSlots = new Map<number, InstanceSlots>();

function slotOffsetsFor(holes: string[]): number[] {
  const offsets: number[] = [];
  for (let i = 0; i < holes.length; i++) {
    if (holes[i] === TPL_SLOT_KEY) offsets.push(i);
  }
  return offsets;
}

export function registerTemplate(
  id: string,
  create: CreateFn,
  holes: string[] = [],
): void {
  if (!templates.has(id)) {
    templates.set(id, {
      create,
      holes,
      slotHoleOffsets: slotOffsetsFor(holes),
    });
  }
}

export function getTemplate(id: string): TemplateEntry | undefined {
  return templates.get(id);
}

/**
 * Record the element-slot handles for a freshly instantiated template so
 * INSERT/REMOVE_TEMPLATE_SLOT can resolve slotIndex → parent FiberElement.
 */
export function bindTemplateInstanceSlots(
  rootId: number,
  handles: LynxElement[],
  entry: TemplateEntry | undefined,
): void {
  if (!entry || entry.slotHoleOffsets.length === 0) {
    instanceSlots.delete(rootId);
    return;
  }
  const slots: LynxElement[] = [];
  const ids: number[] = [];
  for (const offset of entry.slotHoleOffsets) {
    // handles = [root, hole0, hole1, …]; hole at holes[offset] → handles[offset+1]
    slots.push(handles[offset + 1] ?? handles[0]!);
    ids.push(rootId + offset + 1);
  }
  instanceSlots.set(rootId, { handles: slots, ids });
}

export function getTemplateSlotParent(
  rootId: number,
  slotIndex: number,
): LynxElement | undefined {
  return instanceSlots.get(rootId)?.handles[slotIndex];
}

/** Registry id of the slotIndex-th element slot (for tree bookkeeping). */
export function getTemplateSlotId(
  rootId: number,
  slotIndex: number,
): number | undefined {
  return instanceSlots.get(rootId)?.ids[slotIndex];
}

/**
 * Drop slot bindings for a released template instance. Called per id from
 * the registry's subtree release (batch end), never on REMOVE itself — a
 * KeepAlive/Teleport move re-inserts the root later in the same batch.
 */
export function unbindTemplateInstanceSlots(rootId: number): void {
  instanceSlots.delete(rootId);
}

/** Test helper — clear per-instance slot bindings (not the create registry). */
export function resetTemplateInstanceSlots(): void {
  instanceSlots.clear();
}

/** Test helper — number of live per-instance slot bindings. */
export function templateInstanceSlotCountForTest(): number {
  return instanceSlots.size;
}
