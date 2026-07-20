# Unified lineage IFR re-run (post #230 step 3 + #246 harness fixes)

**Date**: 2026-07-20 (vapor `{off,ifr,ifr-et}` re-measure)  
**Commit**: `cursor/vapor-ifr-element-templates-4121`  
**Host**: cloud agent, headless Chromium, Lynx for Web  
**Why**: after Vapor IFR×ET milestones 1–3 (sparse CLONE, nav facades,
paint-registry densify), re-measure the same-source sfc-probe with a real
`content-vapor-ifr-et` cell.

## Methodology corrections applied first

1. **Flag matrix** — every cell sets both flags explicitly:
   - `off`: `enableIFR: false`, `enableElementTemplates: false`
   - `ifr`: `enableIFR: true`, `enableElementTemplates: false`
   - `ifr-et`: `enableIFR: true`, `enableElementTemplates: true`
2. **ET comment-scan** — `extractTemplateRegistrations` skips JSDoc examples.
3. **HN shell IFR** — always `mount()`; queries gated with `enabled: !isIfrMainThread()`.
4. **sfc-probe** — six cells: VDOM `{off,ifr,ifr-et}` × Vapor `{off,ifr,ifr-et}`.
   Under `vapor: true`, `enableElementTemplates` drives `__VUE_LYNX_VAPOR_IFR_ET__`
   (sparse IFR first-frame paint), not the VDOM `elementTemplateTransform`.

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
| content-vdom | off | 93.7 ms | — | 280.3 ms | — |
| content-vdom-ifr | IFR, ET=false | 78.3 ms | **−16%** | 266.6 ms | **−5%** |
| content-vdom-ifr-et | IFR+ET | 74.9 ms | **−20%** | 264.8 ms | **−6%** |
| content-vapor | off | 102.6 ms | — | 289.6 ms | — |
| content-vapor-ifr | IFR, ET=false | 88.8 ms | **−13%** | 326.1 ms | **+13%** |
| content-vapor-ifr-et | IFR+ET (sparse) | 92.2 ms | **−10%** | 293.1 ms | **+1%** |

### Bundle size (web gzip / MT section gzip)

| cell | web gz | MT gz |
|---|---:|---:|
| content-vdom | 36.7 KB | 8.1 KB |
| content-vdom-ifr | 65.1 KB | 35.3 KB |
| content-vdom-ifr-et | 107.0 KB | 55.7 KB |
| content-vapor | 46.4 KB | 8.1 KB |
| content-vapor-ifr | 89.5 KB | 46.1 KB |
| content-vapor-ifr-et | 89.5 KB | 46.1 KB |

**Read:**

- At 1×, VDOM IFR alone recovers ~−16% FCP; adding ET is a further small win
  (−20% total). Vapor IFR wins at 1× (−13%); sparse IFR×ET is close (−10%).
- At 4×, dense Vapor IFR **regresses** (+13%) — MT bundle cost dominates.
  Sparse IFR×ET nearly flat (+1% vs off), recovering the ×4 regression that
  motivated this work. VDOM IFR/ET stay slightly ahead of off on this host.
- Vapor ifr vs ifr-et share essentially the same bundle size (runtime switch);
  VDOM ET still bakes create() into both threads (MT gzip jump).

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

## 4. Scale trends (linear + log-log, 1k → 30k)

Same five architectures, same generated SFC, scaled to ~1k / 3k / 5k / 10k /
20k / 30k elements (`nCards = 125/375/625/1250/2500/3750`) — the same ladder as
the framework playground. Charts:

1. **Paint vs MT load cost** (playground-style cost space: MT gzip × FCP)
2. **FCP vs N**

Linear (zero baseline) first for absolute gaps; log-log for α shape.

Also fixed the web harness settle heuristic: it used to arm a 400ms idle timer
while the tree was still empty, which falsely DNFed slow large mounts
(notably `vapor@30k`). Settle now waits for FCP first; hard timeout is 120s.

Interactive HTML (committed under `results/`, also served from the site):

- [scale-trends x1](./results/scale-trends-scale-x1.html)
- [scale-trends x4](./results/scale-trends-scale-x4.html) (still 1k→10k)

### FCP vs N (CPU ×1)

| architecture | 1k | 3k | 5k | 10k | 20k | 30k | α |
|---|---:|---:|---:|---:|---:|---:|---:|
| VDOM | 87 | 143 | 188 | 310 | 587 | 842 | 0.68 |
| VDOM+IFR | 78 | 120 | 163 | **379** | **695** | **1010** | **0.80** |
| **VDOM+IFR+ET** | **70** | **119** | **161** | **278** | **526** | **771** | 0.72 |
| Vapor | 93 | 156 | 210 | 365 | 692 | 1010 | 0.71 |
| Vapor+IFR | 87 | 141 | 193 | 338 | 637 | 906 | 0.71 |

### Architecture read

1. **IFR without ET is the dangerous curve.** By 10k it is already slower than
   plain VDOM; at 20k/30k the gap is ~+18–20%. On 30k it also hit a real MT
   stack overflow during IFR mount (falls back to BG — late FCP).
2. **ET is the scale hedge.** Lowest FCP at every point through 30k, and the
   only IFR config whose MT gzip honestly tracks content (~54 KB → ~628 KB).
3. **Cost-space chart** matches the playground vibe: no-IFR climbs the left
   wall (fixed ~7 KB MT stub); ET sweeps right while staying lowest; IFR-sans-ET
   climbs without buying much x-axis room.
4. **Vapor+IFR** beats Vapor-off across the range at ×1, but never catches
   VDOM+IFR+ET on web FCP.

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
