# Unified Benchmark Analysis

> Generated 2026-07-23T00:22:51.222Z @ 605d93c
> Host: 4× Intel(R) Xeon(R) Processor @ 2.80GHz

## Why unify?

Three campaigns answered different questions on different harnesses:

| campaign | question | package |
|---|---|---|
| IFR styles | first-frame cost & FCP | `ifr-bench` |
| VDOM vs Vapor | BG/e2e update pipeline | `benchmark` instrumented |
| Vue vs React | black-box user latency | `benchmark` cross/storms |

They shared a *ladder* (1k→30k) but not a *scale*. This document puts every cell in one schema and challenges the published claims.

## Environment rules (non-negotiable)

- **lynx-web**: Lynx for Web in Chromium. Real worker BG + postMessage IPC. Primary product scale.
- **bare-dom**: Plain browser DOM (Preact / Vue / Vapor). Same host, no Lynx. Use to bound framework-only cost.
- **node-jitless**: Node V8 --jitless PAPI stubs. Strategy microbenchmark — NOT comparable to browser FCP.

Never compute `vapor_bg / ifr_fcp`. Same number-of-elements label ≠ same metric.

## Coverage matrix

| architecture | table storms | content-probe FCP | instrumented BG/e2e | node strategy |
|---|---|---|---|---|
| vdom | ✓ | ✓ | ✓ | — |
| vdom-ifr | ✓ | ✓ | — | — |
| vdom-ifr-et | ✓ | ✓ | — | — |
| vapor | ✓ | ✓ | ✓ | — |
| vapor-ifr | ✓ | ✓ | — | — |
| vapor-ifr-dense | ✓ | ✓ | — | — |
| vapor-ifr-sparse | ✓ | ✓ | — | — |
| vdom-et | ✓ | ✓ | — | — |
| vapor-dense | ✓ | ✓ | — | — |
| vapor-code | ✓ | ✓ | — | — |
| vapor-bang | ✓ | ✓ | — | — |
| vapor-engine | ✓ | ✓ | — | — |
| vapor-ifr-engine-et | ✓ | ✓ | — | — |
| react | ✓ | ✓ | — | — |
| react-naive | ✓ | — | — | — |
| react-compiler | ✓ | — | — | — |

## Claim reevaluation

### `vapor-update-bg-5-10x` — **holds-with-caveat**

> Vapor wins update ops 5.8–9.8× on BG thread vs VDOM (instrumented).

Instrumented BG select still ~9.8×. Black-box selectStorm@10k reproduces ~8.3×. One-shot select@10k is near parity (1.19×) — frame-floor masks BG wins. 

### `vapor-create-parity` — **holds-with-caveat**

> Vapor creation is roughly parity with VDOM (slightly slower e2e).

create@10k vapor/vdom=1.00×. React still leads create@10k (react/vdom=0.96×). 

### `ifr-fcp-minus-19` — **holds-locally**

> Default IFR wins median −19% FCP on real threads (content scene).

Holds for ~1k ×1 content probe; fails as a scale/CPU-invariant claim. −19% is a mid-size ×1 content-scene result, not a universal constant. vdom-ifr@1k ×1: -21%. @10k ×1: 33%. @30k ×1: 29%. @1k ×4: 12%. IFR+ET@30k ×1: 36%. 

### `et-is-inflection` — **holds**

> Element Templates are the render-cost inflection; IFR without ET is dangerous at scale.

IFR-sans-ET slower than off at 10k, 20k, 30k. IFR+ET best at 1k, 3k, 5k, 10k, 20k. Caveat: on tiny real examples (hello-world), IFR alone can beat IFR+ET on web FCP — ET tax before win.

### `react-create-vue-update` — **holds**

> React leads creation; Vue/Vapor lead sustained updates (storms).

React leads create@10k. Vapor selectStorm@10k ≪ React (119 vs 2632 ms). vdom-ifr/vdom selectStorm@10k=1.01× (plain IFR ≈ off: OK). vdom-ifr-et/vdom selectStorm@10k=0.98×, create@10k=0.97×. 

### `single-process-flat-fcp` — **holds-as-negative-control**

> Single-process FCP is flat across IFR configs — proves dual-thread necessity.

Keep as methodology proof that single-process harnesses cannot show IFR benefit. Do not cite flat FCP as product evidence. Real-thread (lynx-web) + native are the only win scales.

### `same-scale` — **falsified**

> The three benchmarks are on comparable scales / can be read as one story.

Four distinct scales coexist: (1) instrumented BG/e2e ms, (2) black-box click→composed-DOM, (3) lynx-web FCP/settled, (4) node --jitless warm render. Same ladder labels (1k–30k) do NOT make (1)–(4) interchangeable. Unified schema tags environment+workload; docs must not ratio across environments.

## Same-host campaign findings (lynx-web)

Focused re-run on one host: Vue IFR matrix + React storms at 1k/10k/30k.

### 1. Published absolute ms are host-bound

Playground docs quote React selectStorm@10k ≈ 2544 ms from an earlier machine; this host measures ≈ 2632 ms. **Ratios on one host are the portable claim; absolute ms are not.**

### 2. Vapor's update advantage is real at scale — but only storms show it

selectStorm@10k: VDOM 984 ms → Vapor 119 ms (8.3×). One-shot select stays near the frame floor. Instrumented BG ratios remain the right *micro* story; storms are the right *user* story.

### 3. IFR without ET ≈ off for post-mount table ops

selectStorm@10k vdom-ifr/vdom = 1.01×. Plain IFR is a first-frame / bundle-shape concern for this workload.

### 4. IFR+ET is NOT first-frame-only on this table

selectStorm@10k vdom-ifr-et/vdom = 0.98×; create@10k = 0.97×. Element Templates clone repeated row structure after mount — a coverage hole the old IFR-only FCP campaigns never measured.

### 5. "−19% FCP" is not a constant

On the content-probe ladder, VDOM+IFR (no ET) wins at small N and **loses by ~20% at 10k–30k**. IFR+ET stays ahead across the ladder. CPU×4 further erodes plain-IFR wins. Docs must qualify by scale + CPU + ET.

### 6. React create lead / Vue update lead survives same-host recheck

create@10k react/vdom = 0.96×; selectStorm@10k react/vapor = 22.2×.

## Headline tables (same environment only)

### Table selectStorm (lynx-web, ms median)

| scale | react | vdom | vdom-ifr | vdom-ifr-et | vapor | vapor-ifr |
|---|---|---|---|---|---|---|
| 1k | 225.5 | 70.9 | 67.5 | 65.1 | 20.5 | 19.2 |
| 10k | 2632.4 | 984.1 | 994.6 | 967.9 | 118.6 | 124.7 |
| 30k | 10259.5 | 3569.8 | 3329.1 | 3173.6 | 275.2 | 362.9 |

### Content-probe FCP (lynx-web ×1, ms median)

| scale | react | vdom | vdom-ifr | vdom-ifr-et | vapor | vapor-ifr |
|---|---|---|---|---|---|---|
| 1k | 74 | 128 | 102 | 98 | 174 | 200 |
| 3k | 110 | 205 | 177 | 161 | 269 | 399 |
| 5k | 152 | 259 | 252 | 221 | 380 | 348 |
| 10k | 241 | 452 | 602 | 373 | 626 | 637 |
| 20k | 458 | 839 | 1051 | 708 | 1153 | 1146 |
| 30k | 702 | 1170 | 1514 | 1588 | 1735 | 1662 |

### Graph-eng naming density (#301) — vapor IFR dense A1 vs sparse A2

Same-source sfc-probe (~1004 els). Native ET still stub; sparse still builds the full native skeleton.

| cell | naming | web gzip | FCP ×1 | Δ vs dense | FCP ×4 | Δ vs dense |
|---|---|---:|---:|---:|---:|---:|
| vapor-ifr-dense | dense | 89720 | 152.9 | 0.0% | 596.0 | 0.0% |
| vapor-ifr-sparse | sparse | 90007 | 121.8 | -20.3% | 670.2 | 12.4% |
| vapor-ifr | sparse | 90007 | 200.2 | 30.9% | 564.4 | -5.3% |

×1 sparse/dense = 0.797× (-20.3%). ×4 sparse/dense = 1.124× (12.4%) — treat as noise / inconclusive for scale hedge.

Full write-up: `packages/ifr-bench/GRAPH-ENG-MATRIX.md`.


## Sources ingested

- table-storms: `/home/user/vue-lynx/packages/benchmark/results/cross-storms-scale6.json`
- table-storms: `/home/user/vue-lynx/packages/benchmark/results/cross-storms-latest.json`
- table-storms: `/home/user/vue-lynx/packages/benchmark/results/cross-storms-unified-ifr.json`
- table-storms: `/home/user/vue-lynx/packages/benchmark/results/cross-storms-unified-react.json`
- table-storms: `/home/user/vue-lynx/packages/benchmark/results/cross-storms-graph-eng-4axis.json`
- table-storms: `/home/user/vue-lynx/packages/benchmark/results/cross-storms-graph-eng-4axis-full.json`
- table-storms: `/home/user/vue-lynx/packages/benchmark/results/cross-storms-graph-eng-b2.json`
- instrumented-vdom-vapor: `/home/user/vue-lynx/packages/benchmark/results/latest.json`
- ifr-scale-fcp: `/home/user/vue-lynx/packages/ifr-bench/results/browser-results-scale-x1.json`
- ifr-scale-fcp: `/home/user/vue-lynx/packages/ifr-bench/results/browser-results-scale-x4.json`
- ifr-scale-fcp: `/home/user/vue-lynx/packages/ifr-bench/results/browser-results-scale-react-x1.json`
- ifr-scale-fcp: `/home/user/vue-lynx/packages/ifr-bench/results/browser-results-scale-react-x4.json`
- graph-eng-naming-fcp: `/home/user/vue-lynx/packages/ifr-bench/results/browser-results-graph-eng-dense-sparse.json`
- graph-eng-naming-fcp: `/home/user/vue-lynx/packages/ifr-bench/results/browser-results-graph-eng-dense-sparse-x4.json`
- graph-eng-naming-fcp: `/home/user/vue-lynx/packages/ifr-bench/results/browser-results-graph-eng-4axis.json`
- graph-eng-naming-fcp: `/home/user/vue-lynx/packages/ifr-bench/results/browser-results-graph-eng-4axis-x4.json`
- graph-eng-bundle-sizes: `/home/user/vue-lynx/packages/ifr-bench/results/sfc-probe-sizes-graph-eng.json`
- graph-eng-bundle-sizes: `/home/user/vue-lynx/packages/ifr-bench/results/sfc-probe-sizes-graph-eng-4axis.json`
- unified-content-fcp: `/home/user/vue-lynx/packages/benchmark/results/unified-content-x1.json`
- unified-content-fcp: `/home/user/vue-lynx/packages/benchmark/results/unified-content-x4.json`
- unified-content-fcp: `/home/user/vue-lynx/packages/benchmark/results/unified-content-b2-x1.json`
- unified-content-fcp: `/home/user/vue-lynx/packages/benchmark/results/unified-content-b2-x4.json`
- strategy-node-jitless: `/home/user/vue-lynx/packages/ifr-bench/results/results.json`
- bare-dom: `/home/user/vue-lynx/packages/benchmark/results/web-baseline-latest.json`

## How to reproduce

```bash
pnpm --filter vue-lynx-benchmark run bench:unified
pnpm --filter vue-lynx-benchmark run bench:synthesize
```
