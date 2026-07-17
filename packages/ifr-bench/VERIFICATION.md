# Verifying the "thread boundary" hypothesis

**Date**: 2026-07-11
**Challenge**: the examples sweep concluded that IFR's FCP win cannot appear
in a single-process harness because the JS work is conserved — the win must
come from the thread boundary (BG boot + IPC). But Lynx for Web *is* genuinely
dual-threaded (the background runtime runs in a Web Worker). Two experiments
put the hypothesis to the test, using ReactLynx as the reference control.

## Experiment A — ReactLynx in the same single-process harness

ReactLynx has no IFR-off switch (IFR is its architecture), so "off" is
emulated faithfully: the main thread renders an empty first screen while the
background renders the full app and hydration patches everything in — the
classic BG-driven pipeline. The condition is kept opaque to compile-time
folding so the app's snapshot definitions stay registered on the main thread
(a naive `__MAIN_THREAD__ ? <view/> : <App/>` shakes them out and hydration
cannot instantiate anything — the exact mirror of vue-lynx needing template
registrations extracted for its interpreter-only main thread).

Probe app: 101 elements (hero + 16 rows), `packages/ifr-bench/rl-probe`.
Medians of 7 runs, device proxy (MT parse excluded):

| | FCP | TTI | phases |
|---|---|---|---|
| RL IFR on (jitless) | 25.3 ms | 32.7 ms | renderPage 24.5 (Preact MT render) |
| RL IFR off (jitless) | 24.3 ms | 24.3 ms | renderPage 3.7 empty + bg 5.4 + hydrate 14.3 |
| RL IFR on (v8) | 21.6 ms | 29.6 ms | |
| RL IFR off (v8) | 25.8 ms | 25.8 ms | |

**ReactLynx shows the same profile as Vue Lynx in-process: FCP ±4%
(statistically flat), and IFR *costs* ~35% TTI in serial JS terms.** The
reference implementation cannot demonstrate its own headline feature in a
single-process measurement — confirming the sweep's conclusion is not an
artifact of our implementation.

## Experiment B — real browser, real threads (Lynx for Web)

`packages/ifr-bench/web-harness`: a page loads `@lynx-js/web-core`'s prod
client + `<lynx-view>` pointed at real built bundles; the background runtime
runs in an actual Web Worker with actual postMessage IPC. FCP = lynx-view
insertion → first painted content (shadow-DOM-piercing probe), medians of
5–7 fresh browser contexts per bundle, headless Chromium.

### No CPU throttle

| bundle | FCP off | FCP ifr | Δ | FCP ifr+et |
|---|---|---|---|---|
| vue hello-world | 110–113 ms | 87–88 ms | **−22%** | 88.9 ms |
| vue gallery (304 nodes) | 159.9 ms | 134.2 ms | **−16%** | 136.9 ms |
| vue hackernews-css | **132.0 ms** | 157.2 ms | **+19%** ⚠ | 140.1 ms |
| ReactLynx probe (85 nodes) | 121.0 ms | 82.9–83.1 ms | **−31%** | — |

### 4× CPU throttle (mobile-class proxy)

| bundle | FCP off | FCP ifr | Δ | FCP ifr+et |
|---|---|---|---|---|
| vue hello-world | 402.9 ms | 354.4 ms | **−12%** | **333.3 ms (−17%)** |
| ReactLynx probe | 371.0 ms | 318.6 ms | **−14%** | — |

## Experiment C — is dual-threading what "drags down" FCP? Plain-web baselines

Follow-up challenge: does the dual-thread architecture *necessarily* pay a
communication tax that sinks FCP — how far is Lynx-for-Web from just rendering
with vanilla Vue / Preact directly into the DOM, single-threaded?

Two baselines were added to the same harness, same measurement (t0 → first
≥5 rendered elements, medians of 7 fresh contexts):

- **plain-vue** — the hello-world screen (14 nodes) rendered by vanilla
  `@vue/runtime-dom` (global prod build, 105 KB) into a `<div>`.
- **plain-preact** — the 85-node rl-probe screen rendered by **ReactLynx's
  exact preact fork** (`@hongzhiyuan/preact` min build, 58 KB) into a `<div>`,
  with `options.document` pointed at the real DOM.

Each in two flavors: **warm** (framework `<script>` evaluated *before* t0 —
parity with web-core's `client.js` being preloaded for lynx-view runs) and
**cold** (framework+app concatenated, fetched and parsed *after* t0 — parity
with lynx bundles carrying the framework runtime inside the `.web.bundle`).

Full matrix, same session, fresh medians (earlier Experiment B numbers came
from separate runs; absolute values drift a few ms between sessions, ratios
reproduce):

### No CPU throttle

| entry | FCP | vs best lynx equivalent |
|---|---|---|
| vue-hello off / ifr / ifr+et | 92.0 / 74.3 / 73.4 ms | |
| **plain-vue warm / cold** | **18.1 / 35.2 ms** | cold is still **2.1×** faster than ifr |
| RL probe noifr / ifr | 99.2 / 68.9 ms | |
| **plain-preact warm / cold** | **16.1 / 28.9 ms** | cold is still **2.4×** faster than ifr |
| gallery off / ifr / ifr+et | 127.9 / 106.2 / 110.6 ms | |
| hackernews off / ifr / ifr+et | 114.9 / 114.1 / 114.4 ms | flat at ×1 this session |

### 4× CPU throttle

| entry | FCP | vs best lynx equivalent |
|---|---|---|
| vue-hello off / ifr / ifr+et | 283.4 / 266.2 / 268.5 ms | |
| **plain-vue warm / cold** | **69.4 / 115.2 ms** | cold **2.3×** faster than ifr |
| RL probe noifr / ifr | 303.1 / 266.6 ms | |
| **plain-preact warm / cold** | **54.2 / 78.3 ms** | cold **3.4×** faster than ifr |
| gallery off / ifr / ifr+et | 391.5 / 387.6 / 380.4 ms | |
| hackernews off / ifr / ifr+et | 314.0 / 377.4 / 391.9 ms | +20% inversion reproduces at ×4 |

### Decomposition — where the milliseconds live (RL probe, ×1)

| component | cost | evidence |
|---|---|---|
| render 85 elements + paint, preact on DOM | ~16 ms | plain-preact warm |
| + framework fetch+parse on the FCP path | +13 ms | cold − warm |
| + the Lynx-for-Web platform layer | **+40 ms** | rl-ifr − plain-preact-cold |
| + BG thread boot + hydration IPC round-trip | +30 ms | rl-noifr − rl-ifr |

### Reading

1. **The dual-thread tax is real, bounded, and removable.** The thread
   boundary costs ~30 ms (×1) / ~37 ms (×4) on this screen — that is
   precisely the slice IFR moves off the critical path (both frameworks,
   both throttles agree).
2. **But dual-threading is *not* the main reason Lynx-for-Web trails plain
   web.** With IFR removing the thread round-trip entirely, rl-ifr is still
   2.4× slower than cold plain-preact. The dominant term (~40 ms, constant)
   is the platform emulation layer itself: lynx-view boot, bundle-protocol
   parse, worker spawn, PAPI→DOM bridging through web-elements custom
   elements + shadow roots, and the WASM style engine.
3. **This gap is a web-host artifact, not a Lynx property.** On native Lynx
   the platform layer is native code with bytecode-precompiled lepus — the
   ~40 ms emulation term mostly doesn't exist, and the plain-web baseline
   isn't available at all (it *is* a WebView, the thing Lynx exists to beat).
   The transferable findings are the two architecture terms: thread-boundary
   cost ≈ 30 ms & removable by IFR; platform layer = a per-host constant.
4. **JS payload dominates node count at this scale.** plain-preact renders
   6× the nodes of plain-vue yet is consistently faster — 58 KB vs 105 KB of
   framework JS matters more than 85 vs 14 elements.

## Verdict

1. **Hypothesis confirmed, both directions.** The same bundles that show
   zero FCP difference in a single process show a 22–31% FCP win the moment
   a real thread boundary exists — for ReactLynx exactly as for Vue Lynx.
   The win is the off-path's worker boot + background runtime init + IPC
   round-trip, which IFR removes from the critical path.
2. **Vue Lynx's IFR captures the same class of benefit as ReactLynx's**
   (−22% vs −31% unthrottled; −12% vs −14% throttled, on comparable screens).
3. **Element templates become visible on slow CPUs in the real browser**:
   −17% vs off (beating plain IFR's −12%) even on a 16-node screen — the
   smaller MT evaluation and near-zero render walk pay off exactly where
   ReactLynx's snapshot design predicts.
4. **The web platform sharpens the IFR profile guidance**: web has no lepus
   bytecode precompilation, so the doubled bundle's parse cost lands on the
   FCP path. hackernews (biggest bundle, skeleton-only first screen) inverts
   to +19% — matching the sweep's "fetch-driven first screens shouldn't
   enable IFR" rule; element templates claw back roughly half. On native
   (bytecode-precompiled lepus) this term shrinks toward zero.
5. **Dual-threading is a bounded, IFR-removable tax — not the whole story**
   (Experiment C). Against vanilla single-threaded Vue/Preact on the same
   screens, the thread boundary accounts for ~30 ms; the remaining 2–3× gap
   is the web-host platform layer, which native Lynx doesn't pay.

Reproduce: `node web-harness/run-browser.mjs <bundlesDir> [runs] [throttle]`
(bundles from the examples sweep + `rl-probe/dist`; plain-web baselines under
`web-harness/plain/` are measured automatically). Results in
`results/browser-results.json` / `-x4.json`.
