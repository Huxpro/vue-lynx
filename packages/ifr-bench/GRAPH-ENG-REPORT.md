# Element Templates, Formally: the Four-Axis Report (GE-M5, #326)

> Milestones #321–#326 · branch history #296–#301, #304, #308, #309, #313.
> Benchmark artifacts: `results/graph-eng-*.json`, `web-bundles/sfc-probe-sizes.json`.
> Generated factor tables: `results/graph-eng-factors.md` (rebuild with `node graph-eng-factors.mjs`).

## 1. Formalization

### 1.1 `λ holes. tree`

A UI subtree with dynamic parts **is a function**: `λ holes. tree`. The
compiler partially evaluates the render function against the static parts
of the template; what remains is a **residual** — the static skeleton —
plus a parameter list, the **holes** (the free variables / mutation
frontier of the subtree). Every "template mechanism" in every framework is
just a choice of *representation* for that residual and a choice of *which
sub-terms get names*. That gives four orthogonal axes:

| Axis | Question | Levels |
|---|---|---|
| **A. Staging** | what form does the residual exist in? | `OpStream` → `Data` → `Code` → `Engine` |
| **B. Naming** | which sub-terms are let-named for cross-thread mutation? | `Dense` / `Sparse` |
| **C. Provenance** | how is the hole set known? | `intrinsic` / `recovered` / `—` |
| **D. Deployment** | thread topology × lifetime | `Split`/`Fused` × `Durable`/`Ephemeral` |

### 1.2 Data vs Code vs Engine — the Futamura reading

- **Data**: the residual is a lazy AST; one **generic interpreter** on the
  main thread materializes any template:
  `materialize = interp(⟨tree⟩, holes)`.
- **Code**: the compiler emits a **per-template closure** — no interpreter
  at runtime: `materialize = create(holes)`. Code is exactly the *first
  Futamura projection*: the interpreter specialized to one program (the
  template).
- **Engine**: the residual becomes **host-resident** — the engine keeps a
  native prototype and clones it without running any JS per node.

The staging ladder `Data → Code → Engine` compiles away one layer of
runtime work per rung: first the JS *interpretation*, then JS *itself*.

### 1.3 Terminology (used exclusively in code and this report)

- Dense mechanism → **Named Tree**. Sparse mechanism → **Template**,
  qualified by staging: **Data-Template / Code-Template /
  Engine-Template**.
- Provenance qualifies the template: *intrinsic* Code-Template (the render
  output declares its holes) vs *recovered* Data-Template (compile-time
  analysis reconstructs them).
- `disposable` is **not a mechanism** — it is the axis-D value
  `ephemeral` (the IFR scout copy, discarded on hydration).
- Legacy aliases retired to comments: "dense tree"/"A1" ≡ Named Tree;
  "sparse A2" ≡ recovered Data-Template; "JS ET" ≡ intrinsic
  Code-Template.

### 1.4 Placement table (current world → coordinates)

| Mechanism | A / B / C / D | Term |
|---|---|---|
| VDOM ops | OpStream / Dense / intrinsic / Split·Durable | Op Stream |
| VDOM Block (openBlock/patchFlag) | — provenance source, not a materialization | — |
| Vapor A1 dense `CLONE_TREE` | Data / Dense / — / Split·Durable | **Named Tree** |
| Vapor A2 (#309) | Data / Sparse / recovered / Split·Durable | **recovered Data-Template** |
| VDOM JS ET (`INSTANTIATE_TEMPLATE`) | Code / Sparse / intrinsic / Split·Durable or Ephemeral | **intrinsic Code-Template** |
| ReactLynx Snapshot | Code / Sparse / intrinsic / Split·Durable | **intrinsic Code-Template** |
| Native ET (`__CreateElementTemplate`) | Engine / Sparse / intrinsic(slots) / Split·Durable | **Engine-Template** |
| Vapor-Web `cloneNode` | Engine / Sparse / navigated / Fused·Durable | browser Engine-Template |

Three hard conclusions the table forces:

1. **ReactLynx Snapshot ≡ our VDOM JS ET.** Identical coordinates
   (Code / Sparse / intrinsic); they differ only in deployment defaults
   (RL is always-IFR). Neither is "more native" than the other.
2. **Sparse Tree, JS ET, Snapshot, and Native ET are one family** — the
   same `λ holes. tree` residual at different stagings. Arguing "ET vs
   sparse naming" is a category error; the real axis is staging.
3. **Vapor-Web was already an Engine-Template** (`cloneNode` is the
   browser's native clone). Lynx's Split topology forced Vapor down to
   Data staging (the residual must cross a thread boundary as data);
   Native ET is precisely the project of pushing staging back up to
   Engine *under Split*.

### 1.5 Terminology ↔ code index

| Term / axis value | File · symbol |
|---|---|
| Axis types, `legalCells()` | `packages/vue-lynx/internal/src/matrix.ts` |
| Named Tree (BG / MT) | `runtime/src/shadow-element.ts` `buildShadowClone` · `main-thread/src/ops-apply.ts` `instantiateTemplateDense` |
| recovered Data-Template (BG / MT) | `buildShadowCloneSparse`, `cloneTemplatePrototype` · `instantiateTemplateSparse` |
| recovered provenance | `plugin/src/compiler/vapor-addressing.ts` (`__vlxAddressing`: holes/addressed/slotCount/tags) |
| fail-safe validation | `runtime/src/shadow-element.ts` `isValidAddressing` (per-slot tag fingerprints → dense fallback) |
| Data residual wire form | `internal/src/ops.ts` `REGISTER_TREE`/`CLONE_TREE`, `TemplateNode` |
| intrinsic Code-Template | `internal/src/ops.ts` `INSTANTIATE_TEMPLATE` · `main-thread/src/element-templates.ts` |
| Engine-Template | `main-thread/src/engine-template.ts` (`probeEngineTemplates`, `EngineTemplateDescriptor`, `__VUE_LYNX_ENGINE_ET_STATUS__`) |
| Axis flags | `plugin/src/index.ts` `templateNaming` / `templateStaging` / `ifrPaint` (+ deprecated `enableSparseNaming`) |
| ephemeral deployment | `main-thread/src/ifr.ts` (record → hydrate → adopt-or-replay) |

## 2. What was built (M0–M3)

- **M0/M2** — the axes are *flags*: `templateNaming: 'dense'|'sparse'`,
  `templateStaging: 'opstream'|'data'|'code'|'engine'`,
  `ifr` × `ifrPaint: 'plain'|'disposable-et'|'engine-et'`. Provenance is
  derived per render model and recorded as a cell label.
  `legalCells()` (internal/matrix) generates the §4 cell set from one
  config object. All defaults reproduce pre-existing behavior — the
  matrix is measurement infrastructure, not a product change.
- **M1** — the sparse contract is guarded: the compiler emits **per-slot
  tag fingerprints** (`tags[i] = structure[addressed[i]].tag`), the
  runtime validates them against its own `buildStructure` and falls back
  to dense on any mismatch (same-count structural skew included, test-
  pinned). 40-seed randomized BG↔MT parity tests use the REGISTER_TREE
  payload itself as the fold-rule oracle, so IR↔runtime drift cannot be
  silently replicated into the test. All suites: testing-library 310,
  upstream 917 / dom 72 / vapor 545 / local 130 — green.
- **M3b (Engine-Template)** — `main-thread/src/engine-template.ts` probes
  the `__CreateElementTemplate` family
  (`__CreateElementTemplate` / `__CreateTypedElementTemplate` /
  `__SetAttributeOfElementTemplate` / `__InsertNodeToElementTemplate` /
  `__InstantiateElementTemplate`), builds a **render-model-agnostic
  descriptor** (serialized structure + namedSlots + attrSlots +
  elementSlots — Vapor fills it from recovered addressing, VDOM from its
  intrinsic hole list), and routes `CLONE_TREE` through the engine when
  available. Every failure path downgrades to interpretation and
  publishes `__VUE_LYNX_ENGINE_ET_STATUS__ = 'stub'`.
  **Status on every host measured here: `stub`** — the engine PAPI family
  is not exposed by Lynx-for-Web. The engine *path* is exercised by tests
  against a mocked family over real PAPI (correct tree, uid parity with
  the interpreter); no engine *speed* is claimed anywhere in this report.
- **M3c (IFR × sparse)** — the #290 worry ("does IFR hydration assume
  dense contiguous uids?") dissolves under the #309 contract: hydration
  (`interceptPatchUpdate`) compares op *frames* structurally, and the
  sparse `addressedOr0` list plus `CLONE_TREE baseUid` ride ordinary
  frame arguments. Both realms run the same deterministic code ⇒ the
  sparse uid block matches frame-for-frame. No densify pass exists or is
  needed; divergent addressing falls back to the full background replay.
  Test-pinned in `ifr-sparse-hydration.test.ts` (adopt, value-patch,
  divergence-fallback, dense-equivalence). The #290 IFR-paint layer
  (`disposable-et`, one-shot renderEffect) is *represented* in the axis-D
  flag (`ifrPaint`) and cell set; its compiler-direct realization (MT
  builds the first frame from Code/Engine-Templates + initial values,
  without running the full runtime) remains the follow-up direction.
- **M3a (Vapor Code-Template)** — **skipped**, as the goal doc allows.
  `templateStaging: 'code'` under vapor warns and falls back to `data`;
  the cell is labeled stub in the matrix. The cost (a second vapor
  codegen path) was not justified by the expected read: Code's win over
  Data is interpretation removal, which the VDOM Code-Template cells
  already quantify on the same harness.

## 3. Benchmark method (M4)

Same-source sfc-probe app (~1004 elements, 125 cards), built per cell by
`sfc-probe/build-matrix.mjs`; real dual-thread Lynx-for-Web runs
(`web-harness/run-browser.mjs`, BG in a Web Worker), 5 runs per cell,
medians, CPU ×1 and ×4. Ops-level factorial
(`graph-eng-create-update-bench.test.ts`) measures the same axes with
exact counts: ShadowElement allocations, op frames, native PAPI calls, MT
`elements` table size — for **create** (mount 50 instances) and
**update** (200 hole writes) separately.

### 3.1 Per-cell results

See `results/graph-eng-factors.md` (generated) — reproduced at
publication time:

<!-- FACTORS:BEGIN (regenerate: node graph-eng-factors.mjs, then re-embed) -->
## Per-cell

| cell | coordinate | web gz | FCP ×1 | FCP ×4 |
|---|---|--:|--:|--:|
| content-vdom | OpStream/Dense/intrinsic/Split·Durable | 36943 | 249.7 | 955.9 |
| content-vdom-ifr | OpStream/Dense/intrinsic/Split·Durable+Ephemeral | 66010 | 212.1 | 825.2 |
| content-vdom-ifr-et | Code/Sparse/intrinsic/Split·Durable+Ephemeral | 108660 | 173.3 | 793.3 |
| content-vdom-et | Code/Sparse/intrinsic/Split·Durable | 77535 | 213.5 | 808.9 |
| content-vapor | Data/Sparse/recovered/Split·Durable | 46933 | 239.3 | 876.0 |
| content-vapor-dense | Data/Dense/—/Split·Durable | 46794 | 313.3 | 863.4 |
| content-vapor-ifr | Data/Sparse/recovered/Split·Durable+Ephemeral | 90079 | 208.3 | 941.0 |
| content-vapor-ifr-dense | Data/Dense/—/Split·Durable+Ephemeral | 89791 | 211.7 | 967.9 |
| content-vapor-ifr-sparse | Data/Sparse/recovered/Split·Durable+Ephemeral | 90079 | 209.4 | 894.0 |
| content-vapor-engine | Engine/Sparse/recovered/Split·Durable (stub-capable) | 47641 | 261.3 | 831.1 |
| content-vapor-ifr-engine-et | Data/Sparse/recovered/Split·Durable+Ephemeral(engine-et paint) | 90813 | 222.3 | 909.0 |

## Main effects (marginal Δ, one axis at a time)

| factor | ×1 Δms | ×1 Δ% | ×4 Δms | ×4 Δ% |
|---|--:|--:|--:|--:|
| render vdom→vapor (no-IFR) | -10.4 | -4.2 | -79.9 | -8.4 |
| naming dense→sparse (vapor+IFR) | -2.3 | -1.1 | -73.9 | -7.6 |
| naming dense→sparse (vapor no-IFR) | -74 | -23.6 | 12.6 | 1.5 |
| staging opstream→code (vdom no-IFR) | -36.2 | -14.5 | -147 | -15.4 |
| staging opstream→code (vdom+IFR) | -38.8 | -18.3 | -31.9 | -3.9 |
| staging data→engine (vapor, STUB on web) | 22 | 9.2 | -44.9 | -5.1 |
| ifr off→on (vdom) | -37.6 | -15.1 | -130.7 | -13.7 |
| ifr off→on (vapor sparse) | -31 | -13 | 65 | 7.4 |
| ifrPaint plain→engine-et (vapor, STUB on web) | 12.9 | 6.2 | 15 | 1.7 |

> Engine/engine-et cells run with the native ET PAPI family ABSENT on Lynx-for-Web: __VUE_LYNX_ENGINE_ET_STATUS__ = stub, interpretation fallback. Their deltas measure probe/flag overhead only — NOT an engine win. Ops-level create/update factorial: see graph-eng-create-update.json.
<!-- FACTORS:END -->

### 3.2 Ops-level factorial (exact counts, create vs update)

From `results/graph-eng-create-update.json`
(card fixture: 24 static leaves + 1 text hole, 50 instances / 200 writes):

| cell | create: shadows/inst | create: MT named | create: native calls | update: op frames | update: native calls |
|---|--:|--:|--:|--:|--:|
| vapor-data-dense (Named Tree) | 51 | 1300 | 7600 | 200 | 200 |
| vapor-data-sparse (Data-Template) | 3 | 100 | 6400 | 200 | 200 |
| vapor-engine-dense (mock family) | 51 | 1300 | 6300 | 200 | 200 |
| vapor-engine-sparse (mock family) | 3 | 100 | 5100 | 200 | 200 |

Native-call deltas decompose exactly: dense→sparse saves the 1 200
selector-attribute installs of no-longer-named slots
(`nativeCallsCreate: −1200`, `mtNamed: −1200`); the mock engine family
skips per-node `__SetCSSId` (−1300) — an accounting artifact of the mock,
not an engine claim. Wall-clock in a vitest process is not stable enough
to quote; use the browser FCP runs for time.

Two structural facts the factorial *proves* rather than suggests:

1. **Naming is a bookkeeping axis**: dense→sparse cuts BG shells −93%
   (27→2) and MT named entries −92% (1300→100) at identical op-frame and
   native-call counts — the native skeleton is built either way.
2. **Update is template-blind**: op frames and native calls are *equal in
   every cell*. Templates change who builds the first frame, not how
   holes are written afterwards. This is the goal-doc anchor "ET benefits
   create, not update", now measured.

## 4. Per-factor conclusions

Data: `results/graph-eng-factors.{json,md}`; microbench
`results/graph-eng-sparse-microbench.json`; #313 history retained in
`GRAPH-ENG-MATRIX.md`.

- **Naming (dense→sparse)** — big, *exact* constant-factor wins in JS
  bookkeeping: −98% BG shells / −96% MT named entries on the static-heavy
  microbench; on the factorial card, 51→3 shells per instance and
  1300→100 `elements` entries at **identical op-frame counts** — the
  native skeleton is built either way. FCP is host-dependent and
  noise-bounded: this host shows −23.6% ×1 without IFR but +1.5% ×4, the
  #313 host showed −10.5% ×1 with IFR; under IFR here the pair is −1.1%
  ×1 / −7.6% ×4. Read: sparse is necessary hygiene for the ladder (it
  makes the addressed closure explicit and shrinks constants) but **not
  a reliable FCP lever** — Data staging still walks every node.
- **Staging (opstream→code, VDOM)** — the one factor negative in every
  scenario and throttle measured: −14.5% ×1 / −15.4% ×4 without IFR,
  −18.3% ×1 / −3.9% ×4 with IFR. The Code-Template pays for itself at
  create — the MT runs one baked `create()` per subtree instead of
  interpreting per-node frames. Its price is bundle size (ET create code
  ships in the MT section: content-vdom-et ≈ +41 KB gz over content-vdom).
  This is the "**create benefits from ET**" verification the goal doc
  asked for; the update half is in §3.2 (update identical in all cells).
- **Staging (data→engine, Vapor)** — **stub everywhere measured**
  (`__VUE_LYNX_ENGINE_ET_STATUS__ = 'stub'` on Lynx-for-Web). The
  measured deltas scatter both signs (+9.2% ×1, −5.1% ×4) — consistent
  with ≈0 probe overhead plus run noise. The engine claim is
  deliberately absent: it becomes measurable the day a Lynx engine
  exposes the ET family, with zero further plumbing.
- **IFR (off→on)** — the dominant ×1 FCP factor on both render models
  (−15.1% vdom, −13.0% vapor: the first frame paints during
  `loadTemplate`, before BG boot), at the price of the MT bundle
  carrying the runtime (+~43 KB gz vapor). At ×4 the two models diverge
  (vdom −13.7%, vapor +7.4%): under throttle the vapor MT pays for
  evaluating the full runtime before painting. **This reproduces #290's
  reading**: the ×4 IFR penalty for vapor is +12.1% under dense naming
  (967.9 vs 863.4 ms) and shrinks to +2.1% under sparse (894.0 vs
  876.0 ms) — the "dense-IFR ×4 +13% → sparse +1%" recovery, on the
  durable A2 contract instead of #290's ad-hoc one.
- **ifrPaint (plain→engine-et)** — stub fallback ⇒ Δ≈0 by construction
  (+6.2% ×1 / +1.7% ×4 = noise + the extra define); recorded to keep the
  axis complete.
- **Render (vdom→vapor)** — vapor's no-vdom BG plus `CLONE_TREE` batches
  beat the VDOM op stream at create on the same source (−4.2% ×1 /
  −8.4% ×4 without IFR).

## 5. ReactLynx positioning & reverse inspiration

**Positioning.** Snapshot ≡ intrinsic Code-Template — same coordinates as
our VDOM ET, differing only in deployment defaults. RL's native-ET
experiment is exactly our M3b: pushing Code → Engine under Split.
Our path differs on axis C: Vapor's holes are **recovered** by compiler
analysis (`__vlxAddressing`) instead of intrinsic to the render output —
that is what lets a no-vdom render model join the same template family
without changing its codegen.

**What RL can take from this line** (things Snapshot doesn't have):

1. The **dense→sparse recovery method**: start from a fully navigable
   preorder tree, let compile-time analysis *recover* the mutation
   frontier, and guard the sparse contract with per-slot tag fingerprints
   + a dense fail-safe. This retrofits sparse naming onto any
   runtime-navigated tree — no Snapshot-style codegen rewrite required.
2. The **unified four-axis matrix** itself: publishing every mechanism's
   coordinate (and its stub status) makes "native ET vs snapshot vs
   sparse" a measurement, not a debate. RL's Snapshot and our ET land on
   the same cell; the interesting empty cell for both stacks is
   **Engine × Sparse × slots**.

## 6. Non-claims (read before quoting numbers)

- **No Engine-Template speed claim.** Every engine cell in this report
  ran with `__VUE_LYNX_ENGINE_ET_STATUS__ = 'stub'` (family absent on
  Lynx-for-Web). The engine path is correctness-tested against a mock
  family only.
- **Sparse naming is not an FCP feature.** The Data-Template still builds
  the full native skeleton; its wins are JS memory/table constants and
  the *enablement* of everything above it on the ladder.
- **Vapor Code-Template (M3a) is unimplemented** (flag warns + falls back
  to data; cell labeled stub).
- **×4 CPU results are noise-dominated** on this host for the naming
  axis; do not quote the #313 ×1 −10.5% as scale-robust.
- The `disposable-et` paint cell for VDOM coincides with the existing
  IFR+ET pipeline (ET create() runs during the ephemeral paint); a
  distinct one-shot-renderEffect paint layer for Vapor (#290's
  prototype) is direction, not shipped code.
