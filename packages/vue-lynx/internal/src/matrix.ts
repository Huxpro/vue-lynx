// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Graph-eng four-axis template matrix (#321 / #325).
 *
 * Ground truth: a UI subtree with dynamic parts is a function
 * `λ holes. tree`. The compiler partially evaluates it — static parts fold
 * into a residual (skeleton), dynamic parts stay as parameters (holes).
 * Four orthogonal axes describe every materialization mechanism:
 *
 *  - **A. Staging** — what form the residual exists in:
 *    `opstream` (per-instruction) → `data` (lazy AST + one generic
 *    interpreter) → `code` (per-template compiled closure, no interpreter)
 *    → `engine` (host-resident, native clone). `code` is the first Futamura
 *    projection of the `data` interpreter specialized to one template.
 *  - **B. Naming** — which sub-nodes are let-named for cross-thread
 *    mutation: `dense` (every preorder slot) / `sparse` (only holes =
 *    free variables / the mutation frontier, plus their nav closure).
 *  - **C. Provenance** — how the free-variable set is known: `intrinsic`
 *    (self-describing render/vnode declares it) / `recovered`
 *    (compile-time analysis reconstructs it) / `none` (dense — n/a).
 *  - **D. Deployment** — thread topology × lifetime: `split` (BG=reducer /
 *    MT=store) vs `fused`; `durable` (the authoritative materialization)
 *    vs `ephemeral` (an IFR scout copy, discarded on hydration).
 *
 * Terminology (code and report use ONLY these):
 *  - dense mechanism → **Named Tree**; sparse mechanism → **Template**,
 *    qualified by staging: **Data-Template / Code-Template /
 *    Engine-Template**.
 *  - "disposable" is NOT a mechanism name — it is axis D value `ephemeral`.
 *  - "JS ET" is a legacy alias for the VDOM intrinsic **Code-Template**
 *    (INSTANTIATE_TEMPLATE); "dense tree" for the vapor **Named Tree**.
 */

/** Axis A — staging: what form the residual (static skeleton) exists in. */
export type TemplateStaging = 'opstream' | 'data' | 'code' | 'engine';

/** Axis B — naming: which subtree slots receive cross-thread identities. */
export type TemplateNaming = 'dense' | 'sparse';

/** Axis C — provenance: how the hole (free-variable) set is known. */
export type TemplateProvenance = 'intrinsic' | 'recovered' | 'none';

/** Axis D (lifetime half) — durable authoritative tree vs IFR scout copy. */
export type TemplateLifetime = 'durable' | 'ephemeral';

/** IFR paint mode — how the ephemeral first frame materializes templates. */
export type IfrPaintMode = 'plain' | 'disposable-et' | 'engine-et';

/** Render model whose compiler/runtime produces the residual. */
export type RenderModel = 'vdom' | 'vapor';

/**
 * Build-time define carrying the axis-A staging request into both bundles.
 * `'engine'` asks the MT executor to route template instantiation through
 * the native `__CreateElementTemplate` family when the engine provides it
 * (fail-safe: falls back to `data`/`code` interpretation and reports stub).
 */
export const TEMPLATE_STAGING_GLOBAL = '__VUE_LYNX_TEMPLATE_STAGING__';

/** Build-time define carrying the IFR paint mode (axis D, ephemeral copy). */
export const IFR_PAINT_GLOBAL = '__VUE_LYNX_IFR_PAINT__';

/**
 * One legal cell of the benchmark matrix: a point in
 * `render × naming × staging × ifr × ifrPaint` with derived axis-C label.
 */
export interface MatrixCell {
  /** Stable cell id, e.g. `vapor-data-sparse-ifr-plain`. */
  id: string;
  render: RenderModel;
  staging: TemplateStaging;
  naming: TemplateNaming;
  /** Derived from render model — recorded as a label, not a flag. */
  provenance: TemplateProvenance;
  ifr: boolean;
  ifrPaint: IfrPaintMode | null;
  /** Four-axis coordinate string for the report, e.g. `Data/Sparse/recovered/Split·Durable(+Ephemeral IFR)`. */
  coordinate: string;
  /** Mechanism name in the unified terminology. */
  term: string;
}

function term(staging: TemplateStaging, naming: TemplateNaming): string {
  if (naming === 'dense') {
    return staging === 'opstream' ? 'Op Stream' : 'Named Tree';
  }
  switch (staging) {
    case 'opstream':
      return 'Op Stream (sparse ids)';
    case 'data':
      return 'Data-Template';
    case 'code':
      return 'Code-Template';
    case 'engine':
      return 'Engine-Template';
  }
}

function provenanceOf(
  render: RenderModel,
  naming: TemplateNaming,
): TemplateProvenance {
  if (naming === 'dense') return 'none';
  // VDOM's compiler block analysis declares holes on the vnode (intrinsic);
  // Vapor's addressing pass reconstructs them from IR + HTML (recovered).
  return render === 'vdom' ? 'intrinsic' : 'recovered';
}

function cellIdOf(
  render: RenderModel,
  staging: TemplateStaging,
  naming: TemplateNaming,
  ifr: boolean,
  ifrPaint: IfrPaintMode | null,
): string {
  const parts: string[] = [render, staging, naming];
  if (ifr) {
    parts.push('ifr');
    if (ifrPaint && ifrPaint !== 'plain') parts.push(ifrPaint);
  }
  return parts.join('-');
}

function coordinateOf(
  staging: TemplateStaging,
  naming: TemplateNaming,
  provenance: TemplateProvenance,
  ifr: boolean,
): string {
  const a = staging.charAt(0).toUpperCase() + staging.slice(1);
  const b = naming.charAt(0).toUpperCase() + naming.slice(1);
  const c = provenance === 'none' ? '—' : provenance;
  const d = ifr ? 'Split·Durable+Ephemeral(IFR)' : 'Split·Durable';
  return `${a}/${b}/${c}/${d}`;
}

function makeCell(
  render: RenderModel,
  staging: TemplateStaging,
  naming: TemplateNaming,
  ifr: boolean,
  ifrPaint: IfrPaintMode | null,
): MatrixCell {
  const provenance = provenanceOf(render, naming);
  return {
    id: cellIdOf(render, staging, naming, ifr, ifrPaint),
    render,
    staging,
    naming,
    provenance,
    ifr,
    ifrPaint: ifr ? (ifrPaint ?? 'plain') : null,
    coordinate: coordinateOf(staging, naming, provenance, ifr),
    term: term(staging, naming),
  };
}

/**
 * Enumerate the legal cells of the matrix (goal doc §6). One config object
 * (this function) generates every cell; harnesses map `id` → build flags.
 *
 * Pruning rules (meaningless combinations removed):
 *  - VDOM `data` staging does not exist (no CLONE_TREE protocol on VDOM).
 *  - VDOM naming is intrinsic-sparse whenever templates are in play
 *    (`code`/`engine`); the dense point is the plain op stream.
 *  - Vapor `opstream` staging does not exist (template() always registers).
 *  - `naming: dense` × `staging: code|engine` is meaningless — templates
 *    are definitionally sparse (only holes named).
 *  - `ifrPaint` varies only when `ifr` is on.
 *  - Vapor `code` staging (M3a) is optional and currently unimplemented —
 *    included with `stub` expectation, honestly labeled by the harness.
 */
export function legalCells(): MatrixCell[] {
  const cells: MatrixCell[] = [];

  // --- VDOM ---------------------------------------------------------------
  // Op Stream baseline (dense identities, no template mechanism).
  cells.push(makeCell('vdom', 'opstream', 'dense', false, null));
  for (const paint of ['plain', 'disposable-et', 'engine-et'] as const) {
    cells.push(makeCell('vdom', 'opstream', 'dense', true, paint));
  }
  // Intrinsic Code-Template (legacy alias "JS ET"), the create-benefit cell.
  cells.push(makeCell('vdom', 'code', 'sparse', false, null));
  // Engine-Template for VDOM (native __CreateElementTemplate; stub-capable).
  cells.push(makeCell('vdom', 'engine', 'sparse', false, null));

  // --- Vapor --------------------------------------------------------------
  // Named Tree (dense CLONE_TREE, legacy alias "dense tree" / A1).
  cells.push(makeCell('vapor', 'data', 'dense', false, null));
  for (const paint of ['plain', 'disposable-et'] as const) {
    cells.push(makeCell('vapor', 'data', 'dense', true, paint));
  }
  // Recovered Data-Template (sparse A2) — the A1→A2 upgrade itself.
  cells.push(makeCell('vapor', 'data', 'sparse', false, null));
  for (const paint of ['plain', 'engine-et'] as const) {
    cells.push(makeCell('vapor', 'data', 'sparse', true, paint));
  }
  // Optional ladder cells: Code-Template (M3a, unimplemented → stub) and
  // Engine-Template (M3b, probe + stub fallback).
  cells.push(makeCell('vapor', 'code', 'sparse', false, null));
  cells.push(makeCell('vapor', 'engine', 'sparse', false, null));

  return cells;
}

/** Look up one legal cell by id; undefined for illegal/unknown ids. */
export function getCell(id: string): MatrixCell | undefined {
  return legalCells().find((c) => c.id === id);
}
