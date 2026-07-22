# Graph-eng flag matrix (#301)

**Issue:** [#301](https://github.com/Huxpro/vue-lynx/issues/301)  
**Depends on:** [#298](https://github.com/Huxpro/vue-lynx/issues/298) / PR sparse A2, [#297](https://github.com/Huxpro/vue-lynx/issues/297) addressing, [#296](https://github.com/Huxpro/vue-lynx/issues/296) slots  
**Native column:** stub until [#299](https://github.com/Huxpro/vue-lynx/issues/299) / [#300](https://github.com/Huxpro/vue-lynx/issues/300)

## Three orthogonal axes

| Axis | Values | Flag / knob | Status |
|------|--------|-------------|--------|
| **Element slots** | off → on | `enableElementTemplates` (VDOM); vapor uses named insert-host holes + ops 18/19 | shipped (#296 / #308) |
| **Naming density** | dense → sparse | `enableSparseNaming` + `__vlxAddressing` | shipped A1→A2 (#297/#298 / #309) |
| **Tree base** | JS → native | engine native ET emission | **stub** (#299/#300) |

Each axis is independently switchable for A/B measurement. Sparse naming defaults **on**; set `enableSparseNaming: false` (or `SFC_PROBE_SPARSE=0` / `BENCH_CELL=ifr-dense`) to force dense A1.

## Matrix coordinates (where we sit)

```
                    slots-off          slots-on
                 ┌─────────────────┬─────────────────┐
  JS tree        │ vue-lynx VDOM   │ vue-lynx VDOM   │
  + dense        │ baseline        │ +ET (ifr-et)    │
                 │ vapor dense A1  │ (vapor N/A*)    │
                 ├─────────────────┼─────────────────┤
  JS tree        │ vapor sparse A2 │ vapor sparse +  │
  + sparse       │ (product IFR)   │ slots holes*    │
                 ├─────────────────┼─────────────────┤
  native tree    │                 │ ReactLynx       │
  + slots        │     (empty)     │ Snapshot        │
                 │                 │ (default)       │
                 ├─────────────────┼─────────────────┤
  native +       │                 │ ReactLynx       │
  experimental   │     (empty)     │ native ET stub  │
                 │                 │ (engine flag)   │
                 └─────────────────┴─────────────────┘

  * Vapor "slots" today = named insert-host holes in the sparse tree
    (INSERT still works). Ops 18/19 are the VDOM ET slot protocol;
    vapor does not run VDOM element templates.
```

### Positioning table

| Seat | slots | naming | native ET | Notes |
|------|-------|--------|-----------|-------|
| **vue-lynx VDOM baseline** | off | n/a (no CLONE_TREE) | off | `content-vdom` / `vdom` |
| **vue-lynx VDOM + ET** | on | already sparse holes | off | `content-vdom-ifr-et` / `vdom-ifr-et` |
| **vue-lynx Vapor dense A1** | holes only | dense | off | `content-vapor-ifr-dense` / `vapor-ifr-dense` |
| **vue-lynx Vapor sparse A2** | holes ⊆ addressed | sparse | off | `content-vapor-ifr-sparse` / product `vapor-ifr` |
| **ReactLynx Snapshot** | on | Snapshot IDs (not our dense/sparse) | off | default RL; IFR always-on |
| **ReactLynx native ET** | on | Snapshot | on (exp.) | engine flag — not measured here |
| **Frontier (vue-lynx)** | on + sparse holes | sparse A2 | **native** | needs #299/#300 |

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
| dense A1 | 49 | 25 | ~0.06 |
| sparse A2 | 1 | 1 | ~0.006 |
| savings | −98% | −96% | — |

Native skeleton still fully built either way.

### Bundle sizes (nCards=125, web gzip)

| cell | slots | naming | web gz |
|--|--|--|--:|
| content-vdom | off | n/a | 36 855 |
| content-vdom-ifr | off | n/a | 65 931 |
| content-vdom-ifr-et | on | n/a | 108 592 |
| content-vapor | off | sparse | 46 851 |
| content-vapor-ifr | off | sparse | 90 007 |
| content-vapor-ifr-dense | off | dense | 89 720 |
| content-vapor-ifr-sparse | off | sparse | 90 007 |

Dense is slightly smaller (no `__vlxAddressing` stamp in prod script). Sparse ≈ product `vapor-ifr`.

### Browser FCP (1 004 nodes, median of 5 runs)

| cell | ×1 FCP | Δ vs dense | ×4 FCP | Δ vs dense |
|--|--:|--:|--:|--:|
| content-vapor-ifr-dense | 102.2 ms | — | 302.9 ms | — |
| content-vapor-ifr-sparse | 91.5 ms | **−10.5%** | 310.7 ms | +2.6% |
| content-vapor-ifr (sparse alias) | 95.8 ms | −6.3% | 306.6 ms | +1.2% |

Read carefully: ×1 shows a real sparse win on this host; ×4 is within noise / slightly worse — **not** a consistent scale hedge. Native ET (#300) and/or #290 IFR×ET paint remain the FCP levers at throttle.

## What sparse A2 saves today

Sparse A2 still builds the **full native skeleton** on MT (`instantiateTemplateSparse`). Savings are:

1. **BG** — fewer `ShadowElement` shells (only addressed slots)
2. **MT** — smaller `elements` map + fewer selector attrs for named nodes

Do not equate microbench % with FCP. The ×1 FCP delta above is encouraging but host-specific; treat ×4 as inconclusive.

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
# cells: content-vdom | content-vdom-ifr | content-vdom-ifr-et
#        content-vapor | content-vapor-ifr
#        content-vapor-ifr-dense | content-vapor-ifr-sparse
# flags in sfc-probe-sizes.json: slots / naming / nativeEt:'stub'
```

Then run the existing web harness against the emitted bundles (see `packages/ifr-bench/README.md`).

### Unified table app (opt-in dense/sparse)

```bash
cd packages/benchmark
node harness/build-unified.mjs --only=vapor-ifr-dense,vapor-ifr-sparse --skip-react
```

`BENCH_CELL=ifr-dense|ifr-sparse` maps to `enableSparseNaming` in `apps/ui-vapor/lynx.config.ts`.

## Reverse inspiration for ReactLynx

ReactLynx already occupies **slots × native on/off**. It has not walked the **dense → sparse navigable tree** axis that Vapor needs because Snapshot IDs are compile-time sparse by construction.

What Vue Lynx can feed back:

1. **Start from a dense, navigable preorder tree** (every clone slot addressable) so runtime INSERT / hydration stay simple.
2. **Compile-time addressing analysis** (`__vlxAddressing`: `holes`, `addressed`, `slotCount`, `tags[]`) — discover which slots are ever touched.
3. **Fail-safe sparse** — tag fingerprints + slotCount must match runtime structure; otherwise fall back to dense.
4. **Kill-switch for matrix science** — `enableSparseNaming` / `__VUE_LYNX_SPARSE_NAMING__` so A1 vs A2 is measurable without two codepaths.
5. **Unified report schema** — every cell publishes `{ slots, naming, nativeEt }` so RL and vue-lynx sit on the same axes.

Sparse-without-native is **necessary but not sufficient** for FCP; the interesting empty cell for both stacks is **sparse + slots + native**.

## Plugin / runtime knobs (quick ref)

| Knob | Where | Effect |
|------|-------|--------|
| `enableSparseNaming` | `pluginVueLynx({…})` | define `__VUE_LYNX_SPARSE_NAMING__`; prod script loader stamps `__vlxAddressing` when on |
| `SFC_PROBE_SPARSE` | sfc-probe | `0` → dense A1 |
| `BENCH_CELL=ifr-dense` | ui-vapor | dense A1 IFR cell |
| `nativeEt` | report JSON only | always `'stub'` until #300 |

## Out of scope this PR

- Engine native ET emission / FCP claim for sparse×native
- Changing ReactLynx itself
- Replacing product default (`enableSparseNaming: true`)
