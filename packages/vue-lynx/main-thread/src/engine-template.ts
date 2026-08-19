// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Engine-Template executor (M3b, #323) — axis-A staging value `engine`.
 *
 * Four-axis coordinate: Engine / Sparse / (render model's provenance) /
 * Split·Durable-or-Ephemeral. The template residual becomes host-resident:
 * the engine holds a native prototype and clones it without running any JS
 * per node — the last rung of the staging ladder
 * (`OpStream → Data → Code → Engine`, each rung compiling away another
 * layer of runtime work).
 *
 * The native PAPI family is probed at first use; when absent, callers fall
 * back to the `data`/`code` interpretation path and this module reports the
 * cell as **stub** via `__VUE_LYNX_ENGINE_ET_STATUS__` — benchmark cells
 * must never fake an engine win.
 *
 * Probe contract (family named by #323; exact native signatures are
 * unconfirmed upstream, so every call is typeof-guarded and any throw
 * downgrades to stub):
 *  - `__CreateElementTemplate(tag, slot)` /
 *    `__CreateTypedElementTemplate(tag, slot)` — create a detached template
 *    node; `slot` is the structure-preorder index (anchors included).
 *  - `__SetAttributeOfElementTemplate(node, key, value)` — static props.
 *  - `__InsertNodeToElementTemplate(parent, child)` — assemble skeleton.
 *  - `__InstantiateElementTemplate(handle, pageUniqueId, namedSlots)` —
 *    clone the prototype into the live tree; returns element handles
 *    parallel to `namedSlots` (preorder slot indices needing identities).
 *
 * The descriptor is shared by BOTH render models: Vapor builds it from the
 * REGISTER_TREE structure + recovered `addressed`/`holes`; VDOM would build
 * it from the lowered element-template structure + intrinsic hole list
 * (attr slots / `#slot` element slots). Only the provenance label differs.
 */

import type { TemplateNode } from 'vue-lynx/internal/ops';

/** Engine ET availability/status for diagnostics + benchmark honesty. */
export type EngineTemplateStatus = 'unprobed' | 'native' | 'stub';

export const ENGINE_ET_STATUS_GLOBAL = '__VUE_LYNX_ENGINE_ET_STATUS__';

/**
 * Render-model-agnostic Engine-Template descriptor.
 *
 * `structure` is the same serialized residual REGISTER_TREE ships;
 * `namedSlots` the preorder slots receiving cross-thread identities
 * (Vapor: recovered `addressed`; VDOM: root + intrinsic holes);
 * `attrSlots`/`elementSlots` split the hole set by write kind.
 */
export interface EngineTemplateDescriptor {
  structure: TemplateNode;
  namedSlots: number[];
  attrSlots: number[];
  elementSlots: number[];
}

interface EngineFamily {
  /** `slot` is the structure-preorder index (anchors included) so the
   * engine can hand back named handles by slot at instantiation time. */
  create: (tag: string, slot: number) => unknown;
  createTyped?: (tag: string, slot: number) => unknown;
  setAttribute?: (node: unknown, key: string, value: unknown) => void;
  insertNode: (parent: unknown, child: unknown) => void;
  instantiate: (
    handle: unknown,
    pageUniqueId: number,
    namedSlots: number[],
  ) => LynxElement[];
}

let status: EngineTemplateStatus = 'unprobed';
let family: EngineFamily | null = null;

/** Engine template handles by treeId (Vapor) or template id (VDOM). */
const engineTemplates = new Map<number | string, unknown>();

function publishStatus(next: EngineTemplateStatus): void {
  status = next;
  (globalThis as Record<string, unknown>)[ENGINE_ET_STATUS_GLOBAL] = next;
}

/**
 * Probe the native `__CreateElementTemplate` family once. Absence of any
 * required member ⇒ stub (interpretation fallback), never a throw.
 */
export function probeEngineTemplates(): EngineTemplateStatus {
  if (status !== 'unprobed') return status;
  const g = globalThis as Record<string, unknown>;
  const create = g['__CreateElementTemplate'];
  const createTyped = g['__CreateTypedElementTemplate'];
  const setAttribute = g['__SetAttributeOfElementTemplate'];
  const insertNode = g['__InsertNodeToElementTemplate'];
  const instantiate = g['__InstantiateElementTemplate'];

  if (
    typeof create === 'function'
    && typeof insertNode === 'function'
    && typeof instantiate === 'function'
  ) {
    family = {
      create: create as EngineFamily['create'],
      createTyped: typeof createTyped === 'function'
        ? (createTyped as EngineFamily['createTyped'])
        : undefined,
      setAttribute: typeof setAttribute === 'function'
        ? (setAttribute as EngineFamily['setAttribute'])
        : undefined,
      insertNode: insertNode as EngineFamily['insertNode'],
      instantiate: instantiate as EngineFamily['instantiate'],
    };
    publishStatus('native');
  } else {
    publishStatus('stub');
  }
  return status;
}

export function getEngineTemplateStatus(): EngineTemplateStatus {
  return status;
}

/**
 * Build the shared descriptor from a REGISTER_TREE-shaped residual.
 * Vapor: `named` = recovered addressed closure, `holes` = mutation frontier.
 * VDOM: `named` = [0, …holes], `holes` split by the caller into attr vs
 * element slots. Element slots (dynamic-subtree insert hosts) are the
 * subset of holes the caller marks; the rest are attr/text write targets.
 */
export function buildEngineTemplateDescriptor(
  structure: TemplateNode,
  named: readonly number[],
  holes: readonly number[],
  elementSlots: readonly number[] = [],
): EngineTemplateDescriptor {
  const elementSlotSet = new Set(elementSlots);
  return {
    structure,
    namedSlots: [...named].sort((a, b) => a - b),
    attrSlots: holes.filter((h) => !elementSlotSet.has(h)).sort((a, b) => a - b),
    elementSlots: [...elementSlots].sort((a, b) => a - b),
  };
}

function buildEngineNode(
  node: TemplateNode,
  fam: EngineFamily,
  counter: { value: number },
): unknown | null {
  const slot = counter.value++;
  const [tag, props, children] = node;
  // BG-only anchors never materialize natively (same rule as the data
  // interpreter): comments and empty text consume a preorder slot (the
  // counter advanced) but create no engine node.
  if (tag === '#comment') return null;
  if (tag === '#text' && (!props || props.t === undefined || props.t === '')) {
    return null;
  }
  const handle = fam.createTyped
    ? fam.createTyped(tag, slot)
    : fam.create(tag, slot);
  if (props && fam.setAttribute) {
    if (props.c !== undefined) fam.setAttribute(handle, 'class', props.c);
    if (props.s !== undefined) fam.setAttribute(handle, 'style', props.s);
    if (props.a) {
      for (const [key, value] of props.a) fam.setAttribute(handle, key, value);
    }
    if (props.i !== undefined) fam.setAttribute(handle, 'id', props.i);
    if (props.t !== undefined) fam.setAttribute(handle, 'text', props.t);
  }
  for (const child of children) {
    const childHandle = buildEngineNode(child, fam, counter);
    if (childHandle !== null) fam.insertNode(handle, childHandle);
  }
  return handle;
}

/**
 * Register a template with the engine (build the native prototype once).
 * Returns false (→ caller keeps the interpretation path) when the engine
 * family is unavailable or the build throws.
 */
export function registerEngineTemplate(
  id: number | string,
  descriptor: EngineTemplateDescriptor,
): boolean {
  if (probeEngineTemplates() !== 'native' || !family) return false;
  if (engineTemplates.has(id)) return true;
  try {
    const proto = buildEngineNode(descriptor.structure, family, { value: 0 });
    if (proto === null) return false;
    engineTemplates.set(id, proto);
    return true;
  } catch (error) {
    console.error(
      '[vue-lynx] engine template build failed — falling back to '
        + 'interpretation (stub).',
      error,
    );
    publishStatus('stub');
    return false;
  }
}

/**
 * Instantiate a registered engine template. Returns handles parallel to
 * `namedSlots`, or null (→ caller interprets) on stub/failure — the same
 * fail-safe shape as sparse naming's dense fallback.
 */
export function instantiateEngineTemplate(
  id: number | string,
  namedSlots: number[],
  pageUniqueId: number,
): LynxElement[] | null {
  if (status !== 'native' || !family) return null;
  const handle = engineTemplates.get(id);
  if (handle === undefined) return null;
  try {
    const handles = family.instantiate(handle, pageUniqueId, namedSlots);
    if (!Array.isArray(handles) || handles.length !== namedSlots.length) {
      publishStatus('stub');
      return null;
    }
    return handles;
  } catch (error) {
    console.error(
      '[vue-lynx] engine template instantiation failed — falling back to '
        + 'interpretation (stub).',
      error,
    );
    publishStatus('stub');
    return null;
  }
}

/** Reset module state — for testing only. */
export function resetEngineTemplatesForTesting(): void {
  status = 'unprobed';
  family = null;
  engineTemplates.clear();
  delete (globalThis as Record<string, unknown>)[ENGINE_ET_STATUS_GLOBAL];
}
