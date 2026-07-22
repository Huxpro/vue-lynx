# Unified Benchmark Analysis

> Generated 2026-07-22T10:41:49.687Z @ 08bc6d71
> Host: 4× Intel(R) Xeon(R) Processor

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
| vapor-ifr-dense | — | ✓ | — | — |
| vapor-ifr-sparse | — | ✓ | — | — |
| react | ✓ | ✓ | — | — |
| react-naive | ✓ | — | — | — |
| react-compiler | ✓ | — | — | — |

## Claim reevaluation

### `vapor-update-bg-5-10x` — **holds-with-caveat**

> Vapor wins update ops 5.8–9.8× on BG thread vs VDOM (instrumented).

Instrumented BG select still ~9.8×. Black-box selectStorm@10k reproduces ~8.2×. One-shot select@10k is near parity (1.51×) — frame-floor masks BG wins. 

### `vapor-create-parity` — **holds-with-caveat**

> Vapor creation is roughly parity with VDOM (slightly slower e2e).

create@10k vapor/vdom=1.07×. React still leads create@10k (react/vdom=0.86×). 

### `ifr-fcp-minus-19` — **falsified-as-universal**

> Default IFR wins median −19% FCP on real threads (content scene).

−19% is a mid-size ×1 content-scene result, not a universal constant. vdom-ifr@1k ×1: -10%. @10k ×1: 22%. @30k ×1: 20%. @1k ×4: -2%. IFR+ET@30k ×1: -8%. 

### `et-is-inflection` — **holds**

> Element Templates are the render-cost inflection; IFR without ET is dangerous at scale.

IFR-sans-ET slower than off at 10k, 20k, 30k. IFR+ET best at 1k, 3k, 5k, 10k, 20k, 30k. Caveat: on tiny real examples (hello-world), IFR alone can beat IFR+ET on web FCP — ET tax before win.

### `react-create-vue-update` — **holds-with-caveat**

> React leads creation; Vue/Vapor lead sustained updates (storms).

React leads create@10k. Vapor selectStorm@10k ≪ React (45 vs 1018 ms). vdom-ifr/vdom selectStorm@10k=1.01× (plain IFR ≈ off: OK). vdom-ifr-et/vdom selectStorm@10k=0.72×, create@10k=0.91×. CHALLENGE: ET is not first-frame-only — template clone accelerates post-mount create/update throughput on this table. 

### `single-process-flat-fcp` — **holds-as-negative-control**

> Single-process FCP is flat across IFR configs — proves dual-thread necessity.

Keep as methodology proof that single-process harnesses cannot show IFR benefit. Do not cite flat FCP as product evidence. Real-thread (lynx-web) + native are the only win scales.

### `same-scale` — **falsified**

> The three benchmarks are on comparable scales / can be read as one story.

Four distinct scales coexist: (1) instrumented BG/e2e ms, (2) black-box click→composed-DOM, (3) lynx-web FCP/settled, (4) node --jitless warm render. Same ladder labels (1k–30k) do NOT make (1)–(4) interchangeable. Unified schema tags environment+workload; docs must not ratio across environments.

## Same-host campaign findings (lynx-web)

Focused re-run on one host: Vue IFR matrix + React storms at 1k/10k/30k.

### 1. Published absolute ms are host-bound

Playground docs quote React selectStorm@10k ≈ 2544 ms from an earlier machine; this host measures ≈ 1018 ms. **Ratios on one host are the portable claim; absolute ms are not.**

### 2. Vapor's update advantage is real at scale — but only storms show it

selectStorm@10k: VDOM 367 ms → Vapor 45 ms (8.2×). One-shot select stays near the frame floor. Instrumented BG ratios remain the right *micro* story; storms are the right *user* story.

### 3. IFR without ET ≈ off for post-mount table ops

selectStorm@10k vdom-ifr/vdom = 1.01×. Plain IFR is a first-frame / bundle-shape concern for this workload.

### 4. IFR+ET is NOT first-frame-only on this table

selectStorm@10k vdom-ifr-et/vdom = 0.72×; create@10k = 0.91×. Element Templates clone repeated row structure after mount — a coverage hole the old IFR-only FCP campaigns never measured.

### 5. "−19% FCP" is not a constant

On the content-probe ladder, VDOM+IFR (no ET) wins at small N and **loses by ~20% at 10k–30k**. IFR+ET stays ahead across the ladder. CPU×4 further erodes plain-IFR wins. Docs must qualify by scale + CPU + ET.

### 6. React create lead / Vue update lead survives same-host recheck

create@10k react/vdom = 0.86×; selectStorm@10k react/vapor = 22.9×.

## Headline tables (same environment only)

### Table selectStorm (lynx-web, ms median)

| scale | react | vdom | vdom-ifr | vdom-ifr-et | vapor | vapor-ifr |
|---|---|---|---|---|---|---|
| 1k | 92.1 | 42.9 | 27.0 | 25.7 | 25.8 | 25.4 |
| 10k | 1018.0 | 367.2 | 371.9 | 263.9 | 44.6 | 36.3 |
| 30k | 3744.4 | 1458.9 | 1456.3 | 1118.4 | 128.5 | 132.0 |

### Content-probe FCP (lynx-web ×1, ms median)

| scale | react | vdom | vdom-ifr | vdom-ifr-et | vapor | vapor-ifr |
|---|---|---|---|---|---|---|
| 1k | 61 | 87 | 78 | 70 | 93 | 87 |
| 3k | 99 | 143 | 120 | 119 | 156 | 141 |
| 5k | 141 | 188 | 163 | 161 | 210 | 193 |
| 10k | 228 | 310 | 379 | 278 | 365 | 338 |
| 20k | 434 | 587 | 695 | 526 | 692 | 637 |
| 30k | 631 | 842 | 1010 | 771 | 1010 | 906 |

### Graph-eng naming density (#301) — vapor IFR dense A1 vs sparse A2

Same-source sfc-probe (~1004 els). Native ET still stub; sparse still builds the full native skeleton.

| cell | naming | web gzip | FCP ×1 | Δ vs dense | FCP ×4 | Δ vs dense |
|---|---|---:|---:|---:|---:|---:|
| vapor-ifr-dense | dense | 89720 | 102.2 | 0.0% | 302.9 | 0.0% |
| vapor-ifr-sparse | sparse | 90007 | 91.5 | -10.5% | 310.7 | 2.6% |
| vapor-ifr | sparse | 90007 | 86.9 | -15.0% | 289.6 | -4.4% |

×1 sparse/dense = 0.895× (-10.5%). ×4 sparse/dense = 1.026× (2.6%) — treat as noise / inconclusive for scale hedge.

Full write-up: `packages/ifr-bench/GRAPH-ENG-MATRIX.md`.


## Sources ingested

- table-storms: `/workspace/packages/benchmark/results/cross-storms-scale6.json`
- table-storms: `/workspace/packages/benchmark/results/cross-storms-latest.json`
- table-storms: `/workspace/packages/benchmark/results/cross-storms-unified-ifr.json`
- table-storms: `/workspace/packages/benchmark/results/cross-storms-unified-react.json`
- instrumented-vdom-vapor: `/workspace/packages/benchmark/results/latest.json`
- ifr-scale-fcp: `/workspace/packages/ifr-bench/results/browser-results-scale-x1.json`
- ifr-scale-fcp: `/workspace/packages/ifr-bench/results/browser-results-scale-x4.json`
- ifr-scale-fcp: `/workspace/packages/ifr-bench/results/browser-results-scale-react-x1.json`
- ifr-scale-fcp: `/workspace/packages/ifr-bench/results/browser-results-scale-react-x4.json`
- graph-eng-naming-fcp: `/workspace/packages/ifr-bench/results/browser-results-graph-eng-dense-sparse.json`
- graph-eng-naming-fcp: `/workspace/packages/ifr-bench/results/browser-results-graph-eng-dense-sparse-x4.json`
- graph-eng-bundle-sizes: `/workspace/packages/ifr-bench/results/sfc-probe-sizes-graph-eng.json`
- strategy-node-jitless: `/workspace/packages/ifr-bench/results/results.json`
- bare-dom: `/workspace/packages/benchmark/results/web-baseline-latest.json`

## How to reproduce

```bash
pnpm --filter vue-lynx-benchmark run bench:unified
pnpm --filter vue-lynx-benchmark run bench:synthesize
```
