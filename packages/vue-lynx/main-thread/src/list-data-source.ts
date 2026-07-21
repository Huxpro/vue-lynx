// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Compile-time list-item templates exposed as a logical data source.
 *
 * DEFINE_LIST_ITEM_TEMPLATE registers a cheap logical instance containing a
 * template id and the latest mutations for its root/hole nodes. No native
 * element is created at registration time. Native list callbacks ask
 * list-apply.ts to acquire a materialized cell, then `hydrateListTemplateCell`
 * replays that logical state onto it.
 */

import { elements, pageUniqueId } from './element-registry.js';
import { getTemplate } from './element-templates.js';

type ApplyMutation = (element: LynxElement) => void;

interface LogicalMutation {
  apply: ApplyMutation;
  release?: ApplyMutation;
}

interface LogicalNodeState {
  mutations: Map<string, LogicalMutation>;
}

export interface ListTemplateInstance {
  rootId: number;
  templateId: string;
  nodeIds: number[];
  nodes: LogicalNodeState[];
  cell?: ListTemplateCell;
  destroyed: boolean;
}

export interface ListTemplateCell {
  templateId: string;
  handles: LynxElement[];
  /** Logical node ids whose selectors currently point at these handles. */
  ownerNodeIds: number[];
}

const instances = new Map<number, ListTemplateInstance>();
const nodeOwners = new Map<
  number,
  { instance: ListTemplateInstance; offset: number }
>();
let createdCells = 0;
let hydrationCount = 0;

export function defineListItemTemplate(
  rootId: number,
  templateId: string,
  holeCount: number,
): void {
  const nodeIds = Array.from(
    { length: holeCount + 1 },
    (_, offset) => rootId + offset,
  );
  const instance: ListTemplateInstance = {
    rootId,
    templateId,
    nodeIds,
    nodes: nodeIds.map(() => ({ mutations: new Map() })),
    destroyed: false,
  };
  instances.set(rootId, instance);
  for (let offset = 0; offset < nodeIds.length; offset++) {
    nodeOwners.set(nodeIds[offset]!, { instance, offset });
  }
}

export function getListTemplateInstance(
  rootId: number,
): ListTemplateInstance | undefined {
  return instances.get(rootId);
}

export function isListTemplateNode(id: number): boolean {
  return nodeOwners.has(id);
}

/**
 * Record the latest value of a logical mutation and apply it immediately when
 * this logical instance currently owns a materialized cell.
 */
export function applyOrRecordListTemplateMutation(
  id: number,
  mutationKey: string,
  apply: ApplyMutation,
  release?: ApplyMutation,
): boolean {
  const owner = nodeOwners.get(id);
  if (!owner) return false;

  const handle = owner.instance.cell?.handles[owner.offset];
  const previous = owner.instance.nodes[owner.offset]!.mutations.get(
    mutationKey,
  );
  if (handle && previous?.release) previous.release(handle);

  // Reinsert so replay order follows the most recent mutation order.
  owner.instance.nodes[owner.offset]!.mutations.delete(mutationKey);
  owner.instance.nodes[owner.offset]!.mutations.set(mutationKey, {
    apply,
    release,
  });

  if (handle) apply(handle);
  return true;
}

export function createListTemplateCell(
  instance: ListTemplateInstance,
): ListTemplateCell {
  const create = getTemplate(instance.templateId);
  if (!create) {
    throw new Error(
      `[vue-lynx] Missing list-item template "${instance.templateId}"`,
    );
  }
  const handles = create(pageUniqueId);
  createdCells++;
  if (handles.length < instance.nodeIds.length) {
    throw new Error(
      `[vue-lynx] List-item template "${instance.templateId}" returned `
      + `${handles.length} handles for ${instance.nodeIds.length} logical nodes`,
    );
  }
  return {
    templateId: instance.templateId,
    handles,
    ownerNodeIds: [],
  };
}

function clearLogicalMappings(cell: ListTemplateCell): void {
  for (let offset = 0; offset < cell.ownerNodeIds.length; offset++) {
    const id = cell.ownerNodeIds[offset]!;
    const handle = cell.handles[offset];
    if (!handle) continue;
    const owner = nodeOwners.get(id);
    if (owner) {
      for (const mutation of owner.instance.nodes[owner.offset]!.mutations
        .values()) {
        mutation.release?.(handle);
      }
    }
    if (elements.get(id) === handle) elements.delete(id);
    __SetAttribute(handle, `vue-ref-${id}`, null);
  }
  cell.ownerNodeIds = [];
}

export function hydrateListTemplateCell(
  cell: ListTemplateCell,
  instance: ListTemplateInstance,
): void {
  if (cell.templateId !== instance.templateId) {
    throw new Error(
      `[vue-lynx] Cannot hydrate template ${instance.templateId} into ${cell.templateId}`,
    );
  }

  clearLogicalMappings(cell);
  hydrationCount++;
  cell.ownerNodeIds = [...instance.nodeIds];
  instance.cell = cell;

  for (let offset = 0; offset < instance.nodeIds.length; offset++) {
    const id = instance.nodeIds[offset]!;
    const handle = cell.handles[offset]!;
    elements.set(id, handle);
    __SetAttribute(handle, `vue-ref-${id}`, 1);
    for (const mutation of instance.nodes[offset]!.mutations.values()) {
      mutation.apply(handle);
    }
  }
}

export function releaseListTemplateCell(
  instance: ListTemplateInstance,
  cell: ListTemplateCell,
): void {
  if (instance.cell === cell) instance.cell = undefined;
  clearLogicalMappings(cell);
}

export function destroyListTemplateInstance(rootId: number): void {
  const instance = instances.get(rootId);
  if (!instance) return;
  instance.destroyed = true;
  if (instance.cell) {
    releaseListTemplateCell(instance, instance.cell);
  }
  for (const id of instance.nodeIds) nodeOwners.delete(id);
  instances.delete(rootId);
}

export function resetListTemplateState(): void {
  for (const instance of instances.values()) {
    if (instance.cell) releaseListTemplateCell(instance, instance.cell);
  }
  instances.clear();
  nodeOwners.clear();
  createdCells = 0;
  hydrationCount = 0;
}

/** Test/benchmark metrics. */
export function getListTemplateMetricsForTest(): {
  logicalItems: number;
  materializedItems: number;
  createdCells: number;
  hydrationCount: number;
} {
  let materializedItems = 0;
  for (const instance of instances.values()) {
    if (instance.cell) materializedItems++;
  }
  return {
    logicalItems: instances.size,
    materializedItems,
    createdCells,
    hydrationCount,
  };
}
