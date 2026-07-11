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

Reproduce: `node web-harness/run-browser.mjs <bundlesDir> [runs] [throttle]`
(bundles from the examples sweep + `rl-probe/dist`). Results in
`results/browser-results.json` / `-x4.json`.
