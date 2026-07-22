# Graph-eng template matrix — five-axis edition, terminology v2 (#301 / #321)

**Issues:** [#301](https://github.com/Huxpro/vue-lynx/issues/301) matrix ·
[#321](https://github.com/Huxpro/vue-lynx/issues/321) terminology ·
[#323](https://github.com/Huxpro/vue-lynx/issues/323) Engine-Template ·
[#325](https://github.com/Huxpro/vue-lynx/issues/325) benchmark
**Formalization + report:** see `GRAPH-ENG-REPORT.md` (M5).

## Ground truth: four orthogonal axes

A UI subtree with dynamic parts is a function **`λ holes. tree`**. The
compiler partially evaluates it: static parts fold into a **residual**
(skeleton), dynamic parts remain parameters (**holes**). Every
materialization mechanism is a point on four axes
(`vue-lynx/internal/matrix` is the code authority):

| Column | Meaning | Levels (terminology v2) |
|------|---------|--------|
| **Staging** | what form the residual exists in | `ops (interp)` → `tree (interp)` → `code (compiled)` → `native (compiled)` |
| **Naming** | the UNIT of cross-thread identity | `node` (per-node) / `block` (base id + offsets per template block) |
| **Addressing** | how named nodes are located | `random-access` / `traversal` / `traversal+recover` |
| **Provider** | who materializes the residual | `BTS` / `MTS` / `Engine` |
| **Lifetime** | materialization lifetime | `persistent` / `ephemeral` |

Legacy flag spellings remain accepted (`opstream|data|engine` ≡
`ops|tree|native`; `dense|sparse` ≡ `node|block`).

**Terminology** (the only names code and report use):

- node-named tree mechanism → **Named Tree**; block-named mechanisms →
  **Template**, qualified by staging: **Tree-Template / Code-Template /
  Engine-Template** (axis level `native`, mechanism name Engine-Template).
- `Data → Code` is the first Futamura projection (specialize the
  interpreter to one template); `Code → Engine` compiles away JS itself.
- Legacy aliases: "dense tree"/"A1" ≡ Named Tree; "sparse A2"/"Data-Template" ≡ Tree-Template; "JS ET" ≡ Code-Template;
  "disposable" is not a mechanism — it is the lifetime value `ephemeral`.

## Placement table (current mechanisms → coordinates)

| Mechanism | Staging | Naming | Addressing | Provider | Lifetime | Term |
|---|---|---|---|---|---|---|
| VDOM ops | ops | node | random-access | BTS | persistent | Op Stream |
| Vapor A1 | tree | node | traversal | BTS | persistent | **Named Tree** |
| Vapor A2 (#309) | tree | **block** | traversal+recover | BTS | persistent | **Tree-Template** |
| VDOM `INSTANTIATE_TEMPLATE` | code | block | random-access | BTS / MTS(IFR) | persistent / ephemeral | **Code-Template** |
| ReactLynx Snapshot | code | block | random-access | MTS(first frame)/BTS(updates) | persistent | **Code-Template** |
| Native ET (`__CreateElementTemplate`) | native | block | random-access(slots) | **Engine** | persistent | **Engine-Template** |
| Vapor-Web `cloneNode` | native | block | traversal | Engine | persistent · *thread=local* | browser Engine-Template |

(VDOM Block/openBlock+patchFlag is the intrinsic SOURCE of block-naming
information, not a materialization mechanism — the Code-Template's hole
list is its dynamicChildren. Vapor's `__vlxAddressing` recovers the
equivalent information by compile-time analysis.)

## Terminology ↔ file/symbol index

| Term / axis value | File · symbol |
|---|---|
| Axis types + legal cells | `packages/vue-lynx/internal/src/matrix.ts` · `TemplateStaging`, `TemplateNaming`, `legalCells()` |
| Named Tree (BG) | `runtime/src/shadow-element.ts` · `buildShadowClone` |
| recovered Data-Template (BG) | `runtime/src/shadow-element.ts` · `buildShadowCloneSparse`, `cloneTemplatePrototype` |
| recovered provenance (compiler) | `plugin/src/compiler/vapor-addressing.ts` · `analyzeVaporAddressing`, `__vlxAddressing` |
| fail-safe naming validation | `runtime/src/shadow-element.ts` · `isValidAddressing` (per-slot tag fingerprints) |
| Data residual wire format | `internal/src/ops.ts` · `REGISTER_TREE` / `CLONE_TREE`, `TemplateNode` |
| Named Tree interpreter (MT) | `main-thread/src/ops-apply.ts` · `instantiateTemplateDense` |
| Data-Template interpreter (MT) | `main-thread/src/ops-apply.ts` · `instantiateTemplateSparse` |
| intrinsic Code-Template | `internal/src/ops.ts` · `INSTANTIATE_TEMPLATE`; `main-thread/src/element-templates.ts` · `registerTemplate` |
| Engine-Template (M3b) | `main-thread/src/engine-template.ts` · `probeEngineTemplates`, `EngineTemplateDescriptor` |
| Naming flag | `plugin/src/index.ts` · `templateNaming: 'node' \| 'block'` (legacy `dense\|sparse`, deprecated alias `enableSparseNaming`) |
| Staging flag | `plugin/src/index.ts` · `templateStaging: 'ops' \| 'tree' \| 'code' \| 'native'` (legacy `opstream\|data\|engine`) |
| Provider/Lifetime flags | `plugin/src/index.ts` · `enableIFR`, `ifrPaint: 'plain' \| 'code-paint' \| 'native-paint'` (legacy `disposable-et\|engine-et`) |
| ephemeral paint (IFR) | `main-thread/src/ifr.ts` · `runIfrRender` / `interceptPatchUpdate` |

## Measured results (2026-07-22, #313)

Artifacts under `packages/ifr-bench/results/`:

| Artifact | What |
|--|--|
| `graph-eng-sparse-microbench.json` | ShadowElement + MT named counts |
| `graph-eng-web-bundles/sfc-probe-sizes.json` | 7-cell bundle sizes + flag tags |
| `browser-results-graph-eng-dense-sparse.json` | Lynx-for-Web FCP ×1 (5 runs) |
| `browser-results-graph-eng-dense-sparse-x4.json` | same ×4 CPU |

### Microbench (`static-heavy-24-leaves`, root-only sparse)

| | shadows | mtNamed | cloneMs |
|--|--------:|--------:|--------:|
| Named Tree (dense) | 49 | 25 | ~0.06 |
| Data-Template (sparse) | 1 | 1 | ~0.006 |
| savings | −98% | −96% | — |

Native skeleton still fully built either way (Data staging interprets every
node; only **Engine** staging removes the per-node JS walk).

### Bundle sizes (nCards=125, web gzip)

| cell (legacy id) | naming | web gz |
|--|--|--:|
| content-vdom | — (op stream) | 36 855 |
| content-vdom-ifr | — | 65 931 |
| content-vdom-ifr-et | sparse (Code-Template) | 108 592 |
| content-vapor | sparse | 46 851 |
| content-vapor-ifr | sparse | 90 007 |
| content-vapor-ifr-dense | dense (Named Tree) | 89 720 |
| content-vapor-ifr-sparse | sparse (Data-Template) | 90 007 |

### Browser FCP (1 004 nodes, median of 5 runs)

| cell | ×1 FCP | Δ vs dense | ×4 FCP | Δ vs dense |
|--|--:|--:|--:|--:|
| Named Tree + IFR (dense) | 102.2 ms | — | 302.9 ms | — |
| Data-Template + IFR (sparse) | 91.5 ms | **−10.5%** | 310.7 ms | +2.6% |
| product `vapor-ifr` (sparse alias) | 95.8 ms | −6.3% | 306.6 ms | +1.2% |

Read carefully: ×1 shows a real sparse win on this host; ×4 is within noise
— **not** a consistent scale hedge. Engine staging and/or ephemeral ET paint
remain the FCP levers at throttle.

## What sparse naming saves today

The Data-Template still builds the **full native skeleton** on MT
(`instantiateTemplateSparse`). Savings are:

1. **BG** — fewer `ShadowElement` shells (only the addressed closure)
2. **MT** — smaller `elements` map + fewer selector attrs for named nodes

Do not equate microbench % with FCP.

### Microbench command

```bash
pnpm --filter vue-lynx-testing-library exec vitest run src/__tests__/graph-eng-sparse-microbench.test.ts
# → packages/ifr-bench/results/graph-eng-sparse-microbench.json
```

## How to run the flag matrix

### Same-source content probe (bundle sizes + browser FCP)

```bash
cd packages/ifr-bench/sfc-probe
node build-matrix.mjs ../web-bundles 125
# legacy cell ids preserved for continuity; each maps to a four-axis
# coordinate via vue-lynx/internal/matrix legalCells()
```

Then run the existing web harness against the emitted bundles (see
`packages/ifr-bench/README.md`).

### Unified table app (opt-in dense/sparse)

```bash
cd packages/benchmark
node harness/build-unified.mjs --only=vapor-ifr-dense,vapor-ifr-sparse --skip-react
```

`BENCH_CELL=ifr-dense|ifr-sparse` maps to `templateNaming` in
`apps/ui-vapor/lynx.config.ts`.

## Reverse inspiration for ReactLynx

ReactLynx already occupies **Code staging × intrinsic provenance** (Snapshot
≡ our VDOM Code-Template) and experiments with **Engine** (native ET). It
has not walked the **dense → sparse** naming axis because Snapshot IDs are
compile-time sparse by construction. What Vue Lynx can feed back:

1. **Start from a dense, navigable preorder tree** (every clone slot
   addressable) so runtime INSERT / hydration stay simple.
2. **Recovered provenance** (`__vlxAddressing`: `holes`, `addressed`,
   `slotCount`, `tags[]`) — compile-time analysis discovers the mutation
   frontier without changing the render model.
3. **Fail-safe sparse** — per-slot tag fingerprints + slotCount must match
   the runtime structure; otherwise fall back to dense.
4. **Kill-switch for matrix science** — `templateNaming` /
   `__VUE_LYNX_SPARSE_NAMING__` so Named-Tree vs Data-Template is
   measurable without two codepaths.
5. **Unified report schema** — every cell publishes its four-axis
   coordinate so RL and vue-lynx sit on the same axes.

Sparse-without-engine is **necessary but not sufficient** for FCP; the
interesting cell for both stacks is **sparse × slots × Engine staging**.

## Plugin / runtime knobs (quick ref)

| Knob | Where | Effect |
|------|-------|--------|
| `templateNaming: 'dense'\|'sparse'` | `pluginVueLynx({…})` | axis B; defines `__VUE_LYNX_SPARSE_NAMING__`; prod script loader stamps `__vlxAddressing` when sparse. Deprecated alias: `enableSparseNaming` |
| `templateStaging: 'opstream'\|'data'\|'code'\|'engine'` | `pluginVueLynx({…})` | axis A; `'engine'` routes MT instantiation through the native ET family (stub fallback) |
| `ifrPaint: 'plain'\|'disposable-et'\|'engine-et'` | `pluginVueLynx({…})` | axis D ephemeral paint mode |
| `SFC_PROBE_SPARSE` | sfc-probe | `0` → dense (Named Tree) |
| `BENCH_CELL=ifr-dense` | ui-vapor | dense Named-Tree IFR cell |
| `__VUE_LYNX_ENGINE_ET_STATUS__` | MT global | `'native'` or `'stub'` — benchmark honesty marker |

## Out of scope

- Faking Engine wins: cells run with `__VUE_LYNX_ENGINE_ET_STATUS__ = 'stub'`
  are labeled stub in every report.
- Changing ReactLynx itself.
- Changing product defaults (`templateNaming: 'sparse'`, staging per render
  model, `ifrPaint: 'plain'`).
