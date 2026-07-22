# Unified Benchmark Matrix

One measurement system for Vue Lynx architecture variants — replacing the
ad-hoc split across **IFR benchmarks**, **VDOM vs Vapor**, and the
**Vue vs React playground**.

## The problem

| campaign | package | what it measured | what it missed |
|---|---|---|---|
| IFR styles | `packages/ifr-bench` | FCP / settled / Node render cost × IFR flags | interaction ops, React, storms |
| VDOM vs Vapor | `packages/benchmark` `run.mjs` | instrumented BG / e2e / ops bytes | IFR flags, React, FCP, scale ladder |
| Vue vs React | `packages/benchmark` `cross.mjs` | black-box click→DOM, storms 1k→30k | IFR flags, FCP, BG split |

They reused the **1k→30k ladder labels** but not the same **metric scale**.
Docs that ratioed across campaigns were comparing different instruments.

## Axes

```
architecture × environment × workload × scale × cpu → metrics
```

Defined in [`harness/matrix.mjs`](./harness/matrix.mjs).

### Architectures (V4 flag notation; legacy data keys in parens)

`vdom` · `vdom +ifr` (`vdom-ifr`) · `vdom +b` (`vdom-et`) ·
`vdom +b +ifr` (`vdom-ifr-et`) · `vapor +b` (`vapor`) · `vapor` baseline
(`vapor-dense`) · `vapor +b:e` (`vapor-engine`, N/A on web) ·
`vapor +b +ifr` (`vapor-ifr`; alias `vapor-ifr-sparse`) ·
`vapor +ifr` (`vapor-ifr-dense`) · `vapor +b +ifr:e`
(`vapor-ifr-engine-et`, N/A) · `rl` (`react`)

Notation: `render [+b[:t|c|e]] [+ifr[:c|e]]` — baseline (per-node,
plainest/safest) × stacked optimizations; `+b` = block templates (staging
defaults per model: vdom→:c, vapor→:t), `+b:e` = engine staging
(persistent tree), `+ifr:e` = engine-painted first frame only. Legend in
the unified report page and `ifr-bench/GRAPH-ENG-REPORT.md` §1.3c.

The 11 Vue cells are the complete legal flag-permutation set of the
four-axis template matrix (#321/#325 — `templateNaming` ×
`templateStaging` × `enableIFR` × `ifrPaint`; see
`vue-lynx/internal/matrix` and `ifr-bench/GRAPH-ENG-REPORT.md`):
`vdom-et` = intrinsic Code-Template without IFR (the create-benefit
cell), `vapor-dense` = Named Tree without IFR, `vapor-engine` =
engine-staging probe (honest `stub` on web —
`__VUE_LYNX_ENGINE_ET_STATUS__`), `vapor-ifr-engine-et` = engine-et
ephemeral paint. (`react` = ReactLynx Snapshot+IFR + manual memo;
`react-naive` / `react-compiler` are not part of the published matrix.)

Run the all-permutation create/update sweep + factor decomposition:

```bash
node harness/build-unified.mjs --skip-react \
  --only=vdom,vdom-ifr,vdom-ifr-et,vdom-et,vapor,vapor-dense,vapor-engine,vapor-ifr,vapor-ifr-dense,vapor-ifr-sparse,vapor-ifr-engine-et
node harness/cross.mjs --skip-build --storms --modes <same list> \
  --storm-sizes 1k,10k --storm-reps 2 --label graph-eng-4axis
node harness/graph-eng-unified-factors.mjs   # per-cell + per-factor tables
node harness/synthesize.mjs && node harness/report-unified.mjs
```

### Environments (not interchangeable)

| env | meaning | comparable with |
|---|---|---|
| `lynx-web` | Playwright + `<lynx-view>` + web-core | itself only |
| `bare-dom` | plain DOM baseline | itself only |
| `node-jitless` | strategy microbenchmark | itself only |

### Workloads

| workload | primary metrics |
|---|---|
| `table` | create / update / select / storms / startup / bundles |
| `content-probe` | FCP / settled / MT gzip (from `ifr-bench` sfc-probe) |
| `strategy-scenes` | warm/cold render ms, ops payload (`node-jitless`) |

### Scale ladder

`1k · 3k · 5k · 10k · 20k · 30k` — same labels everywhere; tagged with
`environment` + `workload` so they cannot be silently mixed.

## Commands

```bash
# Focused reevaluation campaign (IFR × table storms + synthesize)
pnpm --filter vue-lynx-benchmark run bench:unified

# Smoke IFR table builds
pnpm --filter vue-lynx-benchmark run bench:unified:smoke

# Rebuild synthesis from committed JSON only
pnpm --filter vue-lynx-benchmark run bench:synthesize

# Full storms matrix (all architectures, all scales)
pnpm --filter vue-lynx-benchmark run bench:unified:full
```

Outputs land in `results/unified/{latest.json,ANALYSIS.md,report.html,report.zh.html}`.

**Human-facing report** (playground-style tinted tables + charts):

```bash
pnpm --filter vue-lynx-benchmark run bench:report
# → results/unified/report.html
# docs embed: /benchmark/unified.html  (via website/scripts/prepare-benchmark.mjs)
```

Docs page: [`/guide/benchmark-unified`](../../website/docs/guide/benchmark-unified.mdx).

## Claim reevaluation

`harness/synthesize.mjs` ingests all committed + fresh results and grades
the claims in `matrix.CLAIMS`. See **[results/unified/ANALYSIS.md](./results/unified/ANALYSIS.md)**
after each run.

## What stays where

- **Orchestration + table apps + synthesis** → `packages/benchmark`
- **Content-probe builds + Node strategy ladder** → `packages/ifr-bench`
  (ingested, not duplicated)
- **Website playground** → still serves table bundles; docs should link
  here for the full matrix story
