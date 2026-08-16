// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Graph-eng template matrix, terminology v2 (#321 / #325, revised).
 *
 * Ground truth: a UI subtree with dynamic parts is a function
 * `λ holes. tree`. The compiler partially evaluates it — static parts fold
 * into a residual (skeleton), dynamic parts stay as parameters (holes).
 * Five columns locate every materialization mechanism:
 *
 *  - **Staging** — what form the residual exists in, grouped by whether an
 *    interpreter is present at runtime (the Futamura split):
 *      `ops (interp)`  — per-instruction stream, replayed per instance;
 *      `tree (interp)` — serialized tree + one generic interpreter;
 *      `code (compiled)` — per-template compiled `create()`, interpreter
 *        specialized away (first Futamura projection);
 *      `native (compiled)` — host-resident prototype, engine clone, no JS
 *        per node.
 *  - **Naming** — the UNIT of cross-thread identity:
 *      `node`  — every node named independently;
 *      `block` — the template block is the unit: one base id + offsets
 *        (`base + indexInAddressed` / `rootId + holeOffset`).
 *  - **Addressing** — how named nodes are located:
 *      `random-access` (flat id map declared by the render output),
 *      `traversal` (child/next navigation),
 *      `traversal+recover` (navigation + compile-time recovered closure).
 *  - **Provider** — who materializes the residual: `bts` / `mts` / `engine`.
 *  - **Lifetime** — `persistent` vs `ephemeral` (IFR scout copy;
 *    browser-fused case additionally `thread=local`).
 *
 * Mechanism terms (unchanged): **Op Stream / Named Tree / Data-Template /
 * Code-Template / Engine-Template** — the axis level is `native`, the
 * mechanism name stays Engine-Template.
 *
 * Legacy vocabulary (accepted everywhere, normalized here):
 * staging `opstream`≡ops, `data`≡tree, `engine`≡native; naming
 * `dense`≡node, `sparse`≡block. "Data-Template" ≡ Data-Template;
 * "JS ET" ≡ Code-Template; "disposable" is the lifetime value ephemeral.
 */

/** Staging: ops | data (interpreted) → code | native (compiled). */
export type TemplateStaging = 'ops' | 'data' | 'code' | 'native';
/** Legacy staging spellings still accepted by flags/tools. */
export type LegacyTemplateStaging = 'opstream' | 'tree' | 'engine';

/** Naming unit: per-node identities vs per-block (base + offset). */
export type TemplateNaming = 'node' | 'block';
export type LegacyTemplateNaming = 'dense' | 'sparse';

export type TemplateAddressing =
  | 'random-access'
  | 'traversal'
  | 'traversal+recover';

export type TemplateProvider = 'bts' | 'mts' | 'engine';

export type TemplateLifetime = 'persistent' | 'ephemeral';

/**
 * Delivery: when the residual reaches the main thread.
 *  - `runtime`: shipped over the wire at runtime (Vapor `REGISTER_TREE`,
 *    once per template; also our current engine path, which builds the
 *    native prototype from the wire payload — proof that `native` staging
 *    does NOT require build-time delivery).
 *  - `bundle`: carried by the MT bundle at build time (VDOM `create()`,
 *    RL Snapshot; the natural optimum for `native`).
 *  - `null`: no residual (ops staging streams per instance).
 */
export type TemplateDelivery = 'runtime' | 'bundle';

/** IFR paint mode — how the ephemeral first frame materializes templates. */
export type IfrPaintMode = 'plain' | 'code-paint' | 'native-paint';
/** Legacy paint spellings. */
export type LegacyIfrPaintMode = 'disposable-et' | 'engine-et';

/**
 * Driver — WHO executes the first-frame render, in what shape. Orthogonal to
 * the six residual columns above: those say how a template materializes, this
 * says who calls the materializer (see
 * `plans/0731-1-rl-render-to-opcodes-insights.md` §2).
 *  - `bts`: no IFR — the Background renders and ships ops.
 *  - `mts-runtime`: the MT bundle carries the complete framework (today's IFR).
 *  - `mts-oneshot`: the MT runs a stripped one-pass renderer (D2).
 *  - `build`: the frame is rendered off-device and replayed (D6).
 */
export type IfrDriver = 'bts' | 'mts-runtime' | 'mts-oneshot' | 'build';

/**
 * Handover — how the main-thread frame and the background render are
 * reconciled.
 *  - `none`: no IFR.
 *  - `stream`: frame-by-frame equality against a recorded op stream; any
 *    deviation tears the page down and replays (the original IFR).
 *  - `tree`: painted elements are adopted through a structural match and the
 *    background id is aliased onto them; divergence costs the diverging nodes
 *    (D1 — ReactLynx's `hydrate()` + `swap`, built MT-side).
 */
export type IfrHandover = 'none' | 'stream' | 'tree';

export type RenderModel = 'vdom' | 'vapor';

export function normalizeStaging(
  v: TemplateStaging | LegacyTemplateStaging,
): TemplateStaging {
  switch (v) {
    case 'opstream':
      return 'ops';
    case 'tree':
      return 'data';
    case 'engine':
      return 'native';
    default:
      return v;
  }
}

export function normalizeNaming(
  v: TemplateNaming | LegacyTemplateNaming,
): TemplateNaming {
  if (v === 'dense') return 'node';
  if (v === 'sparse') return 'block';
  return v;
}

export function normalizeIfrPaint(
  v: IfrPaintMode | LegacyIfrPaintMode,
): IfrPaintMode {
  if (v === 'disposable-et') return 'code-paint';
  if (v === 'engine-et') return 'native-paint';
  return v;
}

/**
 * Build-time define carrying the staging request into both bundles.
 * NOTE: for compatibility with already-built bundles the define VALUE keeps
 * the legacy spelling (`'opstream'|'data'|'code'|'engine'`); runtime checks
 * accept both spellings.
 */
export const TEMPLATE_STAGING_GLOBAL = '__VUE_LYNX_TEMPLATE_STAGING__';

/**
 * Build-time define carrying the delivery request (`templateDelivery`,
 * #338): `'runtime'` (default — structure ships over the wire) or
 * `'bundle'` (structure baked into the MT bundle; BG sends only the
 * fingerprint hash via REGISTER_TREE_BUNDLE, guarded by the hash fail-safe).
 */
export const TEMPLATE_DELIVERY_GLOBAL = '__VUE_LYNX_TEMPLATE_DELIVERY__';

/** Build-time define carrying the IFR paint mode (legacy value spelling). */
export const IFR_PAINT_GLOBAL = '__VUE_LYNX_IFR_PAINT__';

/**
 * Build-time define carrying the IFR handover (`ifrHandover`, D1):
 * `'stream'` (default — recorded op stream, teardown on divergence) or
 * `'tree'` (paint tree + adopting hydration).
 */
export const IFR_HANDOVER_GLOBAL = '__VUE_LYNX_IFR_HANDOVER__';

/**
 * Cell lifecycle status — the retirement lever (one enum edit per cell):
 *  - `product`: shipping configuration; benches keep it measured, flag
 *    combinations resolve without warnings.
 *  - `probe`: measurement-only cell (factor decomposition, N/A probes,
 *    pending productization decisions). Not a supported product config.
 *  - `retired`: combination rejected by data. Harnesses skip it, the
 *    plugin warns when the option combination is requested, report rows go
 *    historical. Once every cell touching an axis value is retired, the
 *    runtime branches behind it (see runtime/src/flags.ts and
 *    main-thread/src/flags.ts — one accessor per axis) are dead and
 *    deletable.
 */
export type CellStatus = 'product' | 'probe' | 'retired';

/** One legal cell (a "Vue mode") of the benchmark matrix. */
export interface MatrixCell {
  /** Canonical id, e.g. `vapor-data-block-ifr`. */
  id: string;
  /** Legacy bench id kept for data-file continuity, e.g. `vapor-ifr`. */
  legacyId: string;
  render: RenderModel;
  staging: TemplateStaging;
  naming: TemplateNaming;
  addressing: TemplateAddressing;
  /** Who materializes the durable tree (+ MTS when an IFR first frame exists). */
  providers: TemplateProvider[];
  lifetimes: TemplateLifetime[];
  ifr: boolean;
  ifrPaint: IfrPaintMode | null;
  /** Who executes the first-frame render (Driver column). */
  driver: IfrDriver;
  /** How the two renders are reconciled (Handover column). */
  handover: IfrHandover;
  /** When the residual reaches the MT; null for ops staging. */
  delivery: TemplateDelivery | null;
  /** Lifecycle status; new cells default to `probe` until promoted. */
  status: CellStatus;
  /**
   * Six-column RESIDUAL coordinate, e.g.
   * `data/block/traversal+recover/BTS/persistent/runtime`. Driver and
   * handover are deliberately NOT part of it: they describe who runs the
   * first-frame render and how it is reconciled, which is orthogonal to how
   * a template's residual materializes.
   */
  coordinate: string;
  /** Mechanism name in the unified terminology. */
  term: string;
  /** Canonical-duplicate marker (e.g. legacy vapor-ifr-sparse ≡ vapor-ifr). */
  aliasOf?: string;
  /** True when the cell cannot measure its staging on hosts without the engine ET PAPI. */
  engineNaOnWeb?: boolean;
}

function term(staging: TemplateStaging, naming: TemplateNaming): string {
  if (staging === 'ops') return 'Op Stream';
  if (naming === 'node') {
    return staging === 'data' ? 'Named Tree' : `${cap(staging)}-Template (node)`;
  }
  switch (staging) {
    case 'data':
      return 'Data-Template';
    case 'code':
      return 'Code-Template';
    case 'native':
      return 'Engine-Template';
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function addressingOf(
  render: RenderModel,
  staging: TemplateStaging,
  naming: TemplateNaming,
): TemplateAddressing {
  if (render === 'vdom') return 'random-access';
  // Vapor navigates; block naming requires the recovered closure.
  return naming === 'block' ? 'traversal+recover' : 'traversal';
}

interface CellSpec {
  id: string;
  legacyId: string;
  render: RenderModel;
  staging: TemplateStaging;
  naming: TemplateNaming;
  ifr?: boolean;
  ifrPaint?: IfrPaintMode;
  /** Driver override; defaults to `mts-runtime` under IFR, `bts` without. */
  driver?: IfrDriver;
  /** Handover override; defaults to `stream` under IFR, `none` without. */
  handover?: IfrHandover;
  aliasOf?: string;
  /**
   * Delivery override: `data` staging defaults to `runtime` delivery, but
   * the `+b!` cell (#338) bakes the same data residual into the MT bundle.
   */
  delivery?: TemplateDelivery;
  /** Lifecycle status; omitted = `probe` (promotion is an explicit act). */
  status?: CellStatus;
}

function makeCell(spec: CellSpec): MatrixCell {
  const {
    id,
    legacyId,
    render,
    staging,
    naming,
    ifr = false,
    ifrPaint,
    driver: driverOverride,
    handover: handoverOverride,
    aliasOf,
    delivery: deliveryOverride,
    status = 'probe',
  } = spec;
  const driver: IfrDriver = driverOverride ?? (ifr ? 'mts-runtime' : 'bts');
  const handover: IfrHandover = handoverOverride ?? (ifr ? 'stream' : 'none');
  const addressing = addressingOf(render, staging, naming);
  const providers: TemplateProvider[] =
    staging === 'native' ? ['engine'] : ['bts'];
  if (ifr) providers.push('mts');
  const lifetimes: TemplateLifetime[] = ifr
    ? ['persistent', 'ephemeral']
    : ['persistent'];
  const provLabel = providers
    .map((p) => (p === 'engine' ? 'Engine' : p.toUpperCase()))
    .join('+');
  // Delivery: code always rides the bundle; data/native ship over the wire
  // by default — the `+b!` cell (#338) overrides data staging to bundle
  // delivery; ops has no residual.
  const delivery: TemplateDelivery | null = staging === 'ops'
    ? null
    : staging === 'code'
    ? 'bundle'
    : (deliveryOverride ?? 'runtime');
  const cell: MatrixCell = {
    id,
    legacyId,
    render,
    staging,
    naming,
    addressing,
    providers,
    lifetimes,
    ifr,
    ifrPaint: ifr ? (ifrPaint ?? 'plain') : null,
    driver,
    handover,
    status,
    delivery,
    coordinate: `${staging}/${naming}/${addressing}/${provLabel}/${lifetimes.join('+')}/${delivery ?? '—'}${
      ifr && ifrPaint && ifrPaint !== 'plain' ? `(${ifrPaint})` : ''
    }`,
    term: term(staging, naming),
  };
  if (aliasOf) cell.aliasOf = aliasOf;
  if (staging === 'native' || ifrPaint === 'native-paint') {
    cell.engineNaOnWeb = true;
  }
  return cell;
}

/**
 * The legal cell set ("Vue modes"), canonical ids, legacy ids preserved.
 * Pruning rules:
 *  - VDOM has no `tree` staging (no CLONE_TREE); Vapor no `ops`.
 *  - `code`/`native` staging is definitionally block-named.
 *  - `ifrPaint` varies only under IFR.
 *  - `delivery: 'bundle'` on data staging (`+b!`, #338) varies only the
 *    Delivery column — one cell, no IFR variant needed (the wire saving is
 *    identical under IFR).
 */
export function legalCells(): MatrixCell[] {
  const C = (spec: CellSpec) => makeCell(spec);
  return [
    // --- VDOM ---------------------------------------------------------------
    C({ id: 'vdom-ops-node', legacyId: 'vdom', render: 'vdom', staging: 'ops', naming: 'node', status: 'product' }),
    C({ id: 'vdom-ops-node-ifr', legacyId: 'vdom-ifr', render: 'vdom', staging: 'ops', naming: 'node', ifr: true, status: 'product' }),
    // `+ifr:h` (D1): Handover column moved alone — the durable tree, the
    // paint staging and the driver are untouched; only the reconciliation
    // changes from stream equality to structural adoption.
    C({
      id: 'vdom-ops-node-ifr-tree',
      legacyId: 'vdom-ifr-tree',
      render: 'vdom',
      staging: 'ops',
      naming: 'node',
      ifr: true,
      handover: 'tree',
    }),
    C({ id: 'vdom-code-block', legacyId: 'vdom-et', render: 'vdom', staging: 'code', naming: 'block', status: 'product' }),
    // First-class now (was only reachable as a paint variant before):
    // Code staging on BOTH the durable tree and the ephemeral first frame.
    C({ id: 'vdom-code-block-ifr', legacyId: 'vdom-ifr-et', render: 'vdom', staging: 'code', naming: 'block', ifr: true, status: 'product' }),
    // Engine rung: N/A on Lynx for Web (stub probe); real read needs the
    // native `__CreateElementTemplate` family.
    C({ id: 'vdom-native-block', legacyId: 'vdom-engine', render: 'vdom', staging: 'native', naming: 'block' }),

    // --- Vapor --------------------------------------------------------------
    C({ id: 'vapor-data-block', legacyId: 'vapor', render: 'vapor', staging: 'data', naming: 'block', status: 'product' }),
    // Naming main-effect anchor (dense A1) — measurement-only.
    C({ id: 'vapor-data-node', legacyId: 'vapor-dense', render: 'vapor', staging: 'data', naming: 'node' }),
    C({ id: 'vapor-data-block-ifr', legacyId: 'vapor-ifr', render: 'vapor', staging: 'data', naming: 'block', ifr: true, status: 'product' }),
    C({ id: 'vapor-data-node-ifr', legacyId: 'vapor-ifr-dense', render: 'vapor', staging: 'data', naming: 'node', ifr: true }),
    // `+ifr:h` (D1) on the product-default Vapor cell.
    C({
      id: 'vapor-data-block-ifr-tree',
      legacyId: 'vapor-ifr-tree',
      render: 'vapor',
      staging: 'data',
      naming: 'block',
      ifr: true,
      handover: 'tree',
    }),
    C({
      id: 'vapor-data-block-ifr-native-paint',
      legacyId: 'vapor-ifr-engine-et',
      render: 'vapor',
      staging: 'data',
      naming: 'block',
      ifr: true,
      ifrPaint: 'native-paint',
    }),
    // `+ifr:c` code-paint (#340): durable tree stays data/block, but the
    // ephemeral IFR first frame is painted via a runtime-compiled
    // Code-Template create() — the web-MEASURABLE sibling of native-paint
    // (NOT engineNaOnWeb). Probe: educational negative result expected on
    // web (create is PAPI-bound, not interpretation-bound).
    C({
      id: 'vapor-data-block-ifr-code-paint',
      legacyId: 'vapor-ifr-code-paint',
      render: 'vapor',
      staging: 'data',
      naming: 'block',
      ifr: true,
      ifrPaint: 'code-paint',
    }),
    // `+b!` (#338): identical to vapor-data-block except the Delivery column
    // — the structure AST is baked into the MT bundle (REGISTER_TREE_BUNDLE).
    // Probe pending a productization decision (b2 sweep: create −5.8…+2.1%,
    // structure wire −100%; candidate for template-size-gated default).
    C({
      id: 'vapor-data-block-bundle',
      legacyId: 'vapor-bang',
      render: 'vapor',
      staging: 'data',
      naming: 'block',
      delivery: 'bundle',
    }),
    // `+b:c` (#337): build-time-compiled create() in both bundles,
    // INSTANTIATE_BOUND_TEMPLATE on the wire, hash fail-safe to the data
    // path. Probe on web (b2 sweep: latency-neutral on the table app, FCP
    // regression + large MTS growth on mega-templates); kept as the
    // descriptor source for the future engine rung.
    C({ id: 'vapor-code-block', legacyId: 'vapor-code', render: 'vapor', staging: 'code', naming: 'block' }),
    C({ id: 'vapor-code-block-ifr', legacyId: 'vapor-ifr-code', render: 'vapor', staging: 'code', naming: 'block', ifr: true }),
    C({ id: 'vapor-native-block', legacyId: 'vapor-engine', render: 'vapor', staging: 'native', naming: 'block' }),
  ];
}

/** Look up a cell by canonical id, legacy id, or known alias. */
export function getCell(id: string): MatrixCell | undefined {
  const cells = legalCells();
  const direct = cells.find((c) => c.id === id || c.legacyId === id);
  if (direct) return direct;
  // Known alias: explicit-coordinate duplicate of the product default.
  if (id === 'vapor-ifr-sparse') {
    const base = cells.find((c) => c.id === 'vapor-data-block-ifr');
    return base ? { ...base, aliasOf: base.id, legacyId: id } : undefined;
  }
  return undefined;
}
