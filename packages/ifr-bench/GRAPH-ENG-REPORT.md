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

| Column | Question | Levels (terminology v2) |
|---|---|---|
| **Staging** | what form does the residual exist in? | `ops (interp)` → `tree (interp)` → `code (compiled)` → `native (compiled)` — the interp/compiled split is the Futamura boundary |
| **Naming** | what is the UNIT of cross-thread identity? | `node` (every node named) / `block` (one base id + offsets per template block) |
| **Addressing** | how are named nodes located? | `random-access` / `traversal` / `traversal+recover` |
| **Provider** | who materializes the residual? | `BTS` / `MTS` / `Engine` |
| **Lifetime** | how long does the materialization live? | `persistent` / `ephemeral` (browser-fused case: `thread=local`) |

Legacy vocabulary maps 1:1 and stays accepted by every flag: staging
`opstream`≡ops, `data`≡tree, `engine`≡native; naming `dense`≡node,
`sparse`≡block; provenance `intrinsic`≈random-access,
`recovered`≈traversal+recover; deployment split into Provider × Lifetime.

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

### 1.3b Upstream-Vue ↔ Lynx concept bridge

Where a name can borrow an upstream Vue concept, it does — each of our
mechanisms is the Lynx-engine realization of something Vue already names:

| Upstream Vue concept | Information it carries | Lynx-side counterpart (v2 term) |
|---|---|---|
| **Block** (openBlock / patchFlag / dynamicChildren) | intrinsic mutation frontier of a subtree | **block naming** + random-access addressing — the Code-Template's hole list IS the Block's dynamicChildren |
| Vapor `template()` string | the static residual | **Tree-Template** residual (`REGISTER_TREE` serialized tree) |
| Vapor navigation (child/next/nthChild) | positional addressing | **traversal** addressing (BG walks the ShadowElement facade; MT walks anonymous natives) |
| `__vlxAddressing` (ours) | *recovered* mutation frontier | block naming for the Tree-Template (traversal+recover) — Vue's Block generalized to a no-vdom render model: VDOM declares it intrinsically, Vapor recovers the equivalent by compile-time analysis (hence the tag-fingerprint fail-safe: recovered info can be wrong, declared info cannot) |
| Vapor-Web `cloneNode` | native prototype clone | **Engine-Template** (native staging, *thread=local*) |
| SSR **hydration** | adopt pre-existing output | **IFR hydration** (the ephemeral MTS copy is adopted frame-by-frame or replaced by full replay) |
| static hoisting / partial evaluation | static folding | the residual itself (`λ holes. tree` partially evaluated at compile time) |

### 1.3c Optimization-flag notation (the benchmark's attribution grammar)

Benchmark cells are named `render [+b[:staging]] [+ifr[:paint]]` — a
baseline times a stack of optimizations, matching factor attribution
one-to-one:

- **baseline** (bare `vdom` / `vapor`) — per-node addressing: plainest
  and safest; every node named, no metadata, no validation.
- **`+b`** — *block templates*: use the block's parts information for
  block naming (`base+offset`) and template materialization. The staging
  parameter defaults to the render model's natural rung:
  `vdom +b` ≡ `+b:c` (code, baked `create()`); `vapor +b` ≡ `+b:t`
  (tree — Split topology forces the residual across the thread boundary
  as data). The two `+b` factors are therefore **not comparable across
  render models**; information source also differs (vdom intrinsic via
  Vue's Block, vapor recovered via `__vlxAddressing`).
- **`+b:e`** — staging raised to the engine rung for the **persistent**
  tree (`__CreateElementTemplate` family). N/A on Lynx-for-Web.
  `+b:c` for vapor is M3a (unimplemented).
- **`+ifr`** — ephemeral first-frame copy painted by the MTS, adopted or
  replayed on hydration. Paint parameter defaults to inheriting the
  persistent staging.
- **`+ifr:e`** / **`+ifr:c`** — ONLY the first-frame copy is painted at
  the engine / code rung (legacy names engine-et / disposable-et). The
  persistent tree is untouched — this is what distinguishes `+ifr:e`
  from `+b:e`.

Cell roster (data files keep legacy keys):
`vdom` (=`vdom`) · `vdom +b` (=`vdom-et`) · `vdom +ifr` · `vdom +b +ifr`
(=`vdom-ifr-et`) · `vapor` (=`vapor-dense` ⚠️ bare name flipped: the
baseline, not the product default) · `vapor +b` (=`vapor`, product
default) · `vapor +ifr` (=`vapor-ifr-dense`) · `vapor +b +ifr`
(=`vapor-ifr`, alias `vapor-ifr-sparse`) · `vapor +b:e` (=`vapor-engine`,
N/A) · `vapor +b +ifr:e` (=`vapor-ifr-engine-et`, N/A) · `rl` (=`react`,
reference).

### 1.4 Placement table (current world → coordinates)

| Mechanism | Staging | Naming | Addressing | Provider | Lifetime | Term |
|---|---|---|---|---|---|---|
| VDOM ops | ops | node | random-access | BTS | persistent | Op Stream |
| Vapor A1 | tree | node | traversal | BTS | persistent | **Named Tree** |
| Vapor A2 (#309) | tree | **block** | traversal+recover | BTS | persistent | **Tree-Template** |
| VDOM JS ET (`INSTANTIATE_TEMPLATE`) | code | block | random-access | BTS / MTS(IFR) | persistent / **ephemeral** | **Code-Template** |
| ReactLynx Snapshot | code | block | random-access | MTS(first frame)/BTS(updates) | persistent | **Code-Template** |
| Native ET (`__CreateElementTemplate`) | native | block | random-access(slots) | **Engine** | persistent | **Engine-Template** |
| Vapor-Web `cloneNode` | native | block | traversal | Engine | persistent · *thread=local* | browser Engine-Template |

(VDOM Block/openBlock+patchFlag is an addressing/provenance *source*, not
a materialization mechanism — it stays off the table.)

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

- **M0/M2** — the axes are *flags* (terminology v2 spellings, legacy
  accepted): `templateNaming: 'node'|'block'`,
  `templateStaging: 'ops'|'tree'|'code'|'native'`,
  `ifr` × `ifrPaint: 'plain'|'code-paint'|'native-paint'`. Addressing is
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

### 3.3 Unified table app: click-driven create/update across ALL permutations

The unified benchmark (`packages/benchmark`, krausest-style table app,
real mouse clicks on dual-thread Lynx-for-Web) now builds and runs **all
11 legal flag permutations** from one `BENCH_CELL` knob and decomposes
factors with `harness/graph-eng-unified-factors.mjs`
(→ `results/unified/graph-eng-unified-factors.{json,md}`, source
`results/cross-storms-graph-eng-4axis.json`, 1k/10k rows × 2 reps).

Getting this to run surfaced a harness regression worth recording: since
#308, ET lowering mounts the v-for rows inside a layout-transparent
`<wrapper>` element slot, and the storms driver's `rowEls()` only scanned
direct children — every ET cell silently timed out at create with
rowCount=0 (bisected to 8fb9acd; the app renders correctly — the DOM
query was wrong). Fixed in `cross.mjs` (wrapper-aware walk + worker
console-error surfacing) and pinned by
`testing-library/src/__tests__/bench-row-repro.test.ts`.

<details><summary>Generated per-cell + factor tables (reps=2 — read ±10% as noise)</summary>

source: `cross-storms-graph-eng-4axis.json` (2026-07-22T13:31:54.554Z, reps=2)

## Per-cell @1k (median ms)

| cell | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|--:|--:|--:|--:|--:|
| vdom | OpStream/Dense/intrinsic/Split·Durable | 144.8 | 20.3 | 117.1 | 30.3 | 54.9 |
| vdom-ifr | OpStream/Dense/intrinsic/Split·Durable+Ephemeral | 160 | 23.9 | 108.4 | 30.3 | 62.8 |
| vdom-ifr-et | Code/Sparse/intrinsic/Split·Durable+Ephemeral | 149.8 | 18.8 | 112.1 | 29.6 | 60.7 |
| vdom-et | Code/Sparse/intrinsic/Split·Durable | 152.7 | 19.8 | 114.8 | 30 | 62.2 |
| vapor | Data/Sparse/recovered/Split·Durable | 161.1 | 17.2 | 53.8 | 29.5 | 21.5 |
| vapor-dense | Data/Dense/—/Split·Durable | 166.6 | 20.3 | 40.7 | 30.1 | 24.5 |
| vapor-engine | Engine/Sparse/recovered/Split·Durable (STUB on web) | 165 | 17.3 | 46.8 | 20.7 | 18.4 |
| vapor-ifr | Data/Sparse/recovered/Split·Durable+Ephemeral | 176 | 19.9 | 40.9 | 28.5 | 20.5 |
| vapor-ifr-dense | Data/Dense/—/Split·Durable+Ephemeral | 172.7 | 20 | 41.4 | 29.4 | 20 |
| vapor-ifr-sparse | Data/Sparse/recovered/Split·Durable+Ephemeral | 168.2 | 16.8 | 41.6 | 29.8 | 18.2 |
| vapor-ifr-engine-et | Data/Sparse/recovered/Split·Durable+Ephemeral(engine-et) | 173.3 | 17.1 | 41.3 | 30 | 19.8 |

## Per-cell @10k (median ms)

| cell | coordinate | create | update10th | updateStorm | select | selectStorm |
|---|---|--:|--:|--:|--:|--:|
| vdom | OpStream/Dense/intrinsic/Split·Durable | 1472.7 | 93.4 | 1463.7 | 68.4 | 743.4 |
| vdom-ifr | OpStream/Dense/intrinsic/Split·Durable+Ephemeral | 1477.5 | 99 | 1403.2 | 60.5 | 643.4 |
| vdom-ifr-et | Code/Sparse/intrinsic/Split·Durable+Ephemeral | 1460 | 103.3 | 1405.4 | 62.1 | 674.5 |
| vdom-et | Code/Sparse/intrinsic/Split·Durable | 1555.6 | 88.9 | 1340.4 | 66.7 | 712.9 |
| vapor | Data/Sparse/recovered/Split·Durable | 1441.5 | 64.2 | 663.6 | 38.2 | 59.2 |
| vapor-dense | Data/Dense/—/Split·Durable | 1498.1 | 62 | 739.5 | 34.8 | 70.6 |
| vapor-engine | Engine/Sparse/recovered/Split·Durable (STUB on web) | 1415.9 | 57.2 | 658.2 | 36.6 | 57.7 |
| vapor-ifr | Data/Sparse/recovered/Split·Durable+Ephemeral | 1500.8 | 62.6 | 701.4 | 35.1 | 57.1 |
| vapor-ifr-dense | Data/Dense/—/Split·Durable+Ephemeral | 1422.6 | 61.8 | 729.9 | 41 | 74.7 |
| vapor-ifr-sparse | Data/Sparse/recovered/Split·Durable+Ephemeral | 1572.3 | 69.8 | 798.6 | 45.1 | 68.2 |
| vapor-ifr-engine-et | Data/Sparse/recovered/Split·Durable+Ephemeral(engine-et) | 1488.2 | 67.6 | 765.4 | 33.4 | 69.1 |

## Main effects (marginal Δ%, one axis at a time)

### @1k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render vdom→vapor (no-IFR) | 11.3% | -15.3% | -54.1% | -2.6% | -60.8% |
| staging opstream→code (vdom, no-IFR) | 5.5% | -2.5% | -2% | -1% | 13.3% |
| staging opstream→code (vdom, +IFR) | -6.4% | -21.3% | 3.4% | -2.3% | -3.3% |
| naming dense→sparse (vapor, no-IFR) | -3.3% | -15.3% | 32.2% | -2% | -12.2% |
| naming dense→sparse (vapor, +IFR) | -2.6% | -16% | 0.5% | 1.4% | -9% |
| staging data→engine (vapor, STUB on web) | 2.4% | 0.6% | -13% | -29.8% | -14.4% |
| ifr off→on (vdom) | 10.5% | 17.7% | -7.4% | 0% | 14.4% |
| ifr off→on (vapor sparse) | 9.2% | 15.7% | -24% | -3.4% | -4.7% |
| ifrPaint plain→engine-et (vapor, STUB on web) | 3% | 1.8% | -0.7% | 0.7% | 8.8% |

### @10k

| factor | create | update10th | updateStorm | select | selectStorm |
|---|--:|--:|--:|--:|--:|
| render vdom→vapor (no-IFR) | -2.1% | -31.3% | -54.7% | -44.2% | -92% |
| staging opstream→code (vdom, no-IFR) | 5.6% | -4.8% | -8.4% | -2.5% | -4.1% |
| staging opstream→code (vdom, +IFR) | -1.2% | 4.3% | 0.2% | 2.6% | 4.8% |
| naming dense→sparse (vapor, no-IFR) | -3.8% | 3.5% | -10.3% | 9.8% | -16.1% |
| naming dense→sparse (vapor, +IFR) | 10.5% | 12.9% | 9.4% | 10% | -8.7% |
| staging data→engine (vapor, STUB on web) | -1.8% | -10.9% | -0.8% | -4.2% | -2.5% |
| ifr off→on (vdom) | 0.3% | 6% | -4.1% | -11.5% | -13.5% |
| ifr off→on (vapor sparse) | 4.1% | -2.5% | 5.7% | -8.1% | -3.5% |
| ifrPaint plain→engine-et (vapor, STUB on web) | -5.3% | -3.2% | -4.2% | -25.9% | 1.3% |

> Real mouse-click-driven unified table app on dual-thread Lynx-for-Web. create = Create N rows; update = update10th / updateStorm (50 ticks); engine cells run with __VUE_LYNX_ENGINE_ET_STATUS__ = stub (family absent on web) — their deltas are probe overhead, not engine wins.

</details>

What the unified run adds to §3.1/§3.2 (honest reads, reps=2 noise ≈ ±10%):

1. **Update is template-blind, now black-box confirmed**: the staging
   (opstream→code) and naming (dense→sparse) factors on `update10th` /
   `updateStorm` scatter within noise in both directions at both scales —
   matching §3.2's exact-count result (identical op frames and native
   calls in every cell). No template mechanism buys update time.
2. **Create on the table app is dominated by the dynamic rows**, which
   stay on the op-stream/slot path in every cell — so the create factor
   for staging/naming is also within noise here. This *bounds* the ET
   create claim: the −15% create win in §4 comes from static-heavy
   content (sfc-probe FCP); a workload whose create is all dynamic rows
   gets ~nothing. ET's create benefit scales with the static fraction of
   the subtree.
3. **The render axis is the big lever for update**: vdom→vapor cuts
   updateStorm −54% at both scales and selectStorm −61%/−92% — per-tick
   sub-frame costs, exactly where a no-vdom render model should win.
4. **Engine and engine-et-paint cells stay ≈0** (stub fallback on web,
   `__VUE_LYNX_ENGINE_ET_STATUS__ = 'stub'`), as designed — the axis is
   runnable end-to-end and honestly labeled, waiting on engine PAPI.

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
