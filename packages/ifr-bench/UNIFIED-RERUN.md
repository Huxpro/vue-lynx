# Unified lineage IFR re-run (post #230 step 3 + #246 harness fixes)

**Date**: 2026-07-17  
**Commit**: `07d9119` (harness) + this results commit  
**Host**: cloud agent, headless Chromium (Playwright 149), Lynx for Web  
**Why**: after merging main IFR/ET into vapor, keep vapor IFR core + flush-once;
prior published matrices either used a broken `ifr`≡`ifr-et` flag inject (#246)
or measured only one lineage.

## Methodology corrections applied first

1. **Flag matrix** — every cell sets both flags explicitly:
   - `off`: `enableIFR: false`, `enableElementTemplates: false`
   - `ifr`: `enableIFR: true`, `enableElementTemplates: false`
   - `ifr-et`: `enableIFR: true`, `enableElementTemplates: true`
2. **ET comment-scan** — `extractTemplateRegistrations` skips JSDoc examples.
3. **HN shell IFR** — always `mount()`; queries gated with `enabled: !isIfrMainThread()`.
4. **sfc-probe** — five cells: VDOM `{off,ifr,ifr-et}` × Vapor `{off,ifr}`
   (Vapor has no ET path).

## 1. Strategy ladder (Node, V8 `--jitless`, large scenes)

Warm median ms from `results/results.json`:

| variant | static-heavy | content | list |
|---|---:|---:|---:|
| bg-baseline | 9.99 | 7.67 | 5.74 |
| ifr-replay (IFR w/o ET) | 7.40 | 5.92 | 4.39 |
| **ifr-block-tpl (ET-like)** | **0.56** | **1.20** | **1.39** |
| ifr-vapor (bound) | 0.33 | 0.35 | 0.32 |
| ifr-vapor-real (shipped) | 2.58 | 2.19 | 3.34 |
| papi-floor | 0.32 | 0.25 | 0.22 |

**Read:** relocating work (replay) helps a little; ET-shaped lowering and the
Vapor bound cut synchronous render cost by ~6–15× on these scenes. Shipped
Vapor IFR sits between replay and the vapor bound.

## 2. Same-source SFC probe (1,004 elements, Lynx for Web)

Artifacts: `results/browser-results-unified-x1.json`,
`results/browser-results-unified-x4.json`,
`results/sfc-probe-sizes-unified.json`.

### FCP medians (7 runs)

| cell | flags | x1 FCP | Δ vs off | x4 FCP | Δ vs off |
|---|---|---:|---:|---:|---:|
| content-vdom | off | 95.3 ms | — | 269.5 ms | — |
| content-vdom-ifr | IFR, ET=false | 77.4 ms | **−19%** | 287.3 ms | **+7%** |
| content-vdom-ifr-et | IFR+ET | 71.9 ms | **−24%** | 254.1 ms | **−6%** |
| content-vapor | off | 97.0 ms | — | 304.2 ms | — |
| content-vapor-ifr | IFR | 88.7 ms | **−9%** | 318.2 ms | **+5%** |

### Bundle size (web gzip / MT section gzip)

| cell | web gz | MT gz |
|---|---:|---:|
| content-vdom | 35.9 KB | 7.2 KB |
| content-vdom-ifr | 64.4 KB | 34.6 KB |
| content-vdom-ifr-et | 107.1 KB | 55.4 KB |
| content-vapor | 45.6 KB | 7.2 KB |
| content-vapor-ifr | 87.9 KB | 44.3 KB |

**Read:**

- At 1×, VDOM IFR alone recovers the classic ~−19% FCP; adding ET is a further
  small win on this dense content scene (−24% total).
- At 4×, IFR **without** ET regresses on this host (parse/eval of the larger MT
  bundle dominates). IFR+ET still nets slightly ahead of off (−6%).
- Vapor IFR wins at 1× (−9%) and regresses at 4× (+5%), matching the earlier
  vapor-lineage caveat on slow CPUs.
- ET bakes create() into both threads — MT gzip jumps hard on a 1k-element
  scene. That is expected; it is the render-cost hedge, not a size win.

## 3. Focused examples (hello-world, todomvc-day1, hackernews-css)

Corrected `off / ifr / ifr-et` builds. Artifacts:
`results/browser-results-examples-unified.json`,
`results/browser-results-examples-unified-x4.json`.

### x1 FCP

| example | off | ifr | ifr-et |
|---|---:|---:|---:|
| hello-world | 59.3 | **48.7 (−18%)** | 52.8 (−11%) |
| todomvc-day1 | 61.1 | **45.1 (−26%)** | 55.7 (−9%) |
| hackernews-css | 71.4 | **63.4 (−11%)** | 66.9 (−6%) |

### x4 FCP

| example | off | ifr | ifr-et |
|---|---:|---:|---:|
| hello-world | 156.2 | **141.2 (−10%)** | 155.6 (−0%) |
| todomvc-day1 | 151.4 | **137.2 (−9%)** | **135.8 (−10%)** |
| hackernews-css | **168.8** | 177.0 (+5%) | 188.0 (+11%) |

**Read:** on tiny content-first screens, IFR alone often beats IFR+ET on web
FCP (ET's create() tax shows up before its render-cost win matters). On HN
with shell IFR, FCP improves at 1× but **settled** time grows (early shell +
later fetch/hydration); at 4× FCP regresses — bundle cost dominates.

## 4. Scale trends (playground-style log-log)

Same five architectures, same generated SFC, scaled to ~1k / 3k / 5k / 10k
elements (`nCards = 125/375/625/1250`). Charts reuse the benchmark-playground
pattern: **log-log polylines** + least-squares `α` in `cost ~ N^α`.

Interactive HTML (committed under `results/`, also served from the site):

- [scale-trends x1](./results/scale-trends-scale-x1.html)
- [scale-trends x4](./results/scale-trends-scale-x4.html)

### FCP vs N (CPU ×1)

| architecture | 1k | 3k | 5k | 10k | α |
|---|---:|---:|---:|---:|---:|
| VDOM | 87.1 | 136.3 | 187.2 | 315.0 | 0.55 |
| VDOM+IFR | 73.7 | 120.5 | 156.1 | **375.1** | **0.67** |
| **VDOM+IFR+ET** | **70.0** | **114.3** | 159.6 | **280.4** | 0.59 |
| Vapor | 95.3 | 153.9 | 211.0 | 372.8 | 0.58 |
| Vapor+IFR | 83.4 | 136.7 | 195.2 | 338.9 | 0.60 |

### MT gzip growth with N

| architecture | 1k | 10k | α |
|---|---:|---:|---:|
| VDOM / Vapor (no IFR) | 7.1 KB | 7.1 KB | **0.00** (fixed stub) |
| VDOM+IFR | 33.8 | 37.1 | 0.04 (almost fixed — Vue on MT) |
| Vapor+IFR | 43.3 | 90.5 | 0.31 |
| VDOM+IFR+ET | 54.1 | **233.9** | **0.63** (create() scales with content) |

### Architecture read

1. **IFR without ET is the dangerous curve.** At 10k ×1 it is *slower than
   plain VDOM* (375 vs 315 ms) and has the steepest FCP α (0.67). You paid the
   MT Vue copy and still interpret the tree.
2. **ET is the scale hedge for VDOM IFR.** It wins every ×1 point through 10k
   and is the only IFR config whose MT gzip honestly tracks content (α≈0.63)
   while still delivering the best FCP.
3. **Vapor+IFR beats Vapor-off at ×1 across the range**, but never catches
   VDOM+IFR+ET on web FCP. Its MT growth is milder than ET (α=0.31).
4. **At ×4, Vapor+IFR loses to Vapor-off at every scale** — parse/eval of the
   larger MT program dominates. VDOM+IFR+ET remains the least-bad IFR option.

```bash
node packages/ifr-bench/sfc-probe/build-scale-matrix.mjs \
  packages/ifr-bench/web-bundles-scale
PLAYWRIGHT_CHROMIUM_PATH=… node packages/ifr-bench/web-harness/run-browser.mjs \
  packages/ifr-bench/web-bundles-scale 5 1 scale-x1
PLAYWRIGHT_CHROMIUM_PATH=… node packages/ifr-bench/web-harness/run-browser.mjs \
  packages/ifr-bench/web-bundles-scale 5 4 scale-x4
node packages/ifr-bench/report-scale-trends.mjs \
  packages/ifr-bench/web-bundles-scale \
  packages/ifr-bench/results/browser-results-scale-x1.json scale-x1
```

## Recommendations (unified lineage)

| Profile | Recommendation |
|---|---|
| Content-first, sync data, mid/large tree | `enableIFR: true` (brings ET on VDOM) — **required at ≥5–10k** |
| Tiny screens / web-FCP-only | Measure `ifr` vs `ifr-et` — ET is not free on gzip |
| Slow CPU / large MT bundle | Prefer IFR+ET over IFR alone; measure x4 |
| Fetch-driven | Shell IFR OK if queries are gated; don't skip mount |
| Vapor | `vapor: true, enableIFR: true`; expect 1× win, measure 4× |
| Never ship | VDOM `enableIFR` with `enableElementTemplates: false` on large trees |

## Reproduce

```bash
pnpm --filter vue-lynx run build
pnpm --filter vue-lynx-ifr-bench run check
pnpm --filter vue-lynx-ifr-bench run bench
node packages/ifr-bench/sfc-probe/build-matrix.mjs packages/ifr-bench/web-bundles-unified 125
PLAYWRIGHT_CHROMIUM_PATH=… node packages/ifr-bench/web-harness/run-browser.mjs \
  packages/ifr-bench/web-bundles-unified 7 1 unified-x1
PLAYWRIGHT_CHROMIUM_PATH=… node packages/ifr-bench/web-harness/run-browser.mjs \
  packages/ifr-bench/web-bundles-unified 7 4 unified-x4
```
