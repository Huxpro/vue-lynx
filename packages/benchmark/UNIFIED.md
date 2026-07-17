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

### Architectures

`vdom` · `vdom-ifr` · `vdom-ifr-et` · `vapor` · `vapor-ifr` ·
`react` · `react-naive` · `react-compiler`

(Vapor has no Element Templates path.)

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
