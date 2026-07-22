// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main-thread registries for the vapor build-time-parse cells.
 *
 * Seeded at BUNDLE-EVALUATION time (before renderPage / any ops batch) by
 * registration statements the plugin bakes into the MT bundle:
 *
 *  - `+b!` (#338): `registerVaporStructure(hash, structure)` — the
 *    REGISTER_TREE payload, delivered by the bundle instead of the wire.
 *    REGISTER_TREE_BUNDLE (op 20) resolves its hash here; everything
 *    downstream (CLONE_TREE, the interpreters) is unchanged.
 *  - `+b:c` (#337): `registerVaporTemplate(id, namedParents, create)` — a
 *    compiled straight-line-PAPI create() returning one handle per
 *    ADDRESSED slot (sparse order, `null` for BG-only anchors), plus the
 *    named-parent table driving insert-tracking bookkeeping.
 *
 * Like the element-template registry, these are intentionally NOT cleared by
 * resetMainThreadState(): registration happens once per bundle evaluation
 * while renderPage may run multiple times.
 */

import type { TemplateNode } from 'vue-lynx/internal/ops';

export type VaporCreateFn = (pageUniqueId: number) => (LynxElement | null)[];

export interface VaporTemplateEntry {
  create: VaporCreateFn;
  /**
   * For each addressed index `i`: the addressed index of the DIRECT parent
   * when that parent is itself addressed, else -1 — mirrors the sparse
   * interpreter's trackInsert edges exactly.
   */
  namedParents: number[];
}

const structures = new Map<string, TemplateNode>();
const vaporTemplates = new Map<string, VaporTemplateEntry>();

/** Bundle-eval registration hook for `+b!` structures. */
export function registerVaporStructure(
  hash: string,
  structure: TemplateNode,
): void {
  if (!structures.has(hash)) structures.set(hash, structure);
}

export function getVaporStructure(hash: string): TemplateNode | undefined {
  return structures.get(hash);
}

/** Bundle-eval registration hook for `+b:c` compiled templates. */
export function registerVaporTemplate(
  id: string,
  namedParents: number[],
  create: VaporCreateFn,
): void {
  if (!vaporTemplates.has(id)) {
    vaporTemplates.set(id, {
      create,
      namedParents: Array.isArray(namedParents) ? namedParents : [],
    });
  }
}

export function getVaporTemplate(id: string): VaporTemplateEntry | undefined {
  return vaporTemplates.get(id);
}

/** Test helper — clear both bundle registries (never called in product). */
export function resetVaporTemplateRegistriesForTesting(): void {
  structures.clear();
  vaporTemplates.clear();
}
