# IFR Across All Examples — Performance Report

**Date**: 2026-07-11
**Question**: What actually happens to FCP, TTI, and code size when IFR (and
element templates) are enabled on every real example in this repo?

## TL;DR — the user-visible hypothesis, tested

| hypothesis | verdict from data |
|---|---|
| "FCP 提升" | **In pure JS-work terms FCP is ~neutral (median ×1.04 jitless / ×0.96 v8 device-proxy)** — IFR does the *same* render work, just on the other thread. The device FCP win comes from what a single-process harness cannot exhibit: the off path's first frame waits for **BG thread startup + runtime init + bundle load + IPC round-trip**, all of which IFR removes from the critical path (frame paints inside `loadTemplate`). Our numbers bound the JS-side delta at ±10%; the structural win must be confirmed on-device. |
| "code size 变大" | **Confirmed, and it is the headline cost**: `main.lynx.bundle` gzip grows ×2.26 (median), from e.g. 34.5→76.3 KiB (hello-world) up to 72.6→179.1 KiB (hackernews). The MT section grows ~17 KiB → 78–195 KiB (Vue runtime + app copy). |
| "TTI depends" | **Confirmed**: in serial JS-work terms TTI regresses +14…+76% (median ×1.36) because the app+runtime now evaluate on BOTH threads. On devices this overlaps with BG thread startup (the MT render runs while the BG boots), so the serial number is an upper bound — but the double-evaluation cost is real and is the second headline cost. |

Element templates on top of IFR (`ifr+et`) are ~free or better on time
(median FCP ×1.02, best case −21% vs plain ifr on template-heavy screens like
tailwindcss/todomvc-day1) — their protocol/mount win is partially masked here
because these example first screens are small; see `REPORT.md` for the
1000-node synthetic scaling where the gap is 7–15×.

> **Update — hypothesis verified**: see [VERIFICATION.md](./VERIFICATION.md).
> ReactLynx in the same single-process harness also shows a flat FCP
> (±4%) and the same TTI regression; in a **real browser** (Lynx for Web,
> genuine worker + IPC) the IFR win appears for both frameworks:
> Vue −22%/−16% FCP (hello-world/gallery), ReactLynx −31% — and the
> big-bundle/skeleton-first hackernews case inverts (+19%), confirming the
> profile guidance below.

## Per-shape findings

- **Content-first screens** (hello-world, hackernews skeleton, gallery,
  swiper, keep-alive, transition…): FCP-neutral in JS terms, full first frame
  painted at `renderPage` — these are the IFR target profile. 22/23 examples
  render **byte-identical final documents** across off/ifr/ifr+et
  (attr-order-insensitive comparison, real bundles).
- **Fetch-driven screens** (networking): nothing to paint at renderPage
  (0 nodes — content depends on a network response), so IFR pays MT eval for
  no FCP benefit (+23…44%). This is the documented "IFR cannot help
  async-first-screen apps" case, now quantified.
- **Thread-incompatible app code** (todomvc-codex): reads `location` during
  render → crashes the lepus-side render. IFR requires thread-agnostic
  first-screen code; such apps need fixes before enabling.

## Bugs found and fixed by this sweep

Running every real example through the dual-thread pipeline surfaced three
real defects (all now fixed + regression-tested):

1. **`SystemInfo` clobbering** (entry-main): the MT bootstrap overwrote an
   engine-provided `SystemInfo` global with `{}` when `lynx.SystemInfo` was
   absent — breaking screen-dimension-dependent first screens (gallery's
   waterfall item sizing).
2. **Numeric `:style` baking** (element-template transform): constant
   object-literal styles (`:style="{ fontSize: 12 }"`) were baked into
   skeletons, bypassing the runtime's numeric auto-px normalization — now
   only strict-JSON string-valued styles (static `style="…"` attrs) bake;
   everything else stays a hole on the normalizeStyle path.
3. **CSS Modules × IFR** (worklet-loader-mt): `<style module>` connectors
   reference the stripped style import's default binding (`style0`) —
   the MT bundle crashed at evaluation. The import is now replaced with a
   placeholder binding (first frame renders un-hashed class names; hydration
   patches the real ones — full CSS-Modules-on-MT support is a follow-up).

## Methodology & caveats

- Real `.web.bundle` halves executed headlessly in a PAPI-over-jsdom env,
  fresh subprocess per sample (5 × per config), medians reported. Two engine
  modes: V8 and `--jitless` (interpreter ≈ PrimJS proxy).
- `Device proxy` tables exclude MT **parse** time (lepus ships as precompiled
  bytecode); `raw` tables include it (web-platform-like). BG parse is always
  included (BG JS is parsed at runtime on devices).
- The harness's cross-thread call is synchronous and both "threads" share one
  process: **BG thread startup, IPC latency, and parallelism are absent** —
  this systematically *understates* IFR's device FCP advantage and
  *overstates* its TTI penalty. On-device traces are the required next step
  for absolute numbers; these tables are for JS-cost structure and ratios.
- FCP proxy = first moment content exists (renderPage for ifr configs, first
  applied batch otherwise). TTI proxy = BG fully booted + hydration done.
- Entry per example: tutorials use their completed state (GalleryComplete,
  Swiper, cells); `event-modifiers` is excluded (pre-existing compile error
  on the base branch).

## Recommendation matrix

| app profile | enable IFR? |
|---|---|
| static/content-first screen, size-tolerant | **yes** — full first frame at loadTemplate; combine with element templates |
| data-driven first screen with sync initData | yes (pending initData API follow-up) |
| fetch-driven first screen | no — pay size for no FCP; or restructure to render a real skeleton |
| bundle-size-critical | measure: gzip roughly doubles today; the MT-DCE lever (route #1) and Vapor (route c) both attack this |

Reproduce: `node examples-sweep/orchestrate.mjs <dir> && node examples-sweep/sweep.mjs <dir> && node examples-sweep/report.mjs`

---

**Medians across examples (jitless, device proxy):** FCP ×1.04 (ifr) / ×1.02 (ifr+et), TTI ×1.36 (ifr) / ×1.35 (ifr+et), lynx.bundle gz ×2.26

<!-- generated by examples-sweep/report.mjs -->

### First-frame timings (ms) — jitless, bytecode-precompile proxy (MT parse excluded, as on devices)

| example | FCP off | FCP ifr | ΔFCP | FCP ifr+et | TTI off | TTI ifr | ΔTTI | TTI ifr+et | nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7guis | 65.6 | 63.1 | -4% | 64.3 | 65.6 | 76.0 | 16% | 77.5 | 169 |
| basic | 32.0 | 34.3 | 7% | 33.7 | 32.0 | 44.0 | 38% | 43.0 | 9 |
| css-features | 43.3 | 50.0 | 15% | 44.2 | 43.3 | 63.3 | 46% | 56.5 | 51 |
| gallery | 66.6 | 65.0 | -2% | 69.5 | 66.6 | 89.4 | 34% | 94.2 | 4 |
| hackernews-css | 40.0 | 35.4 | -11% | 38.9 | 40.0 | 58.8 | 47% | 63.8 | 14 |
| hackernews-tailwind | 55.9 | 53.0 | -5% | 52.2 | 55.9 | 76.1 | 36% | 76.4 | 20 |
| hello-world | 33.5 | 35.6 | 6% | 36.0 | 33.5 | 45.7 | 36% | 45.6 | 16 |
| keep-alive | 47.7 | 44.5 | -7% | 46.5 | 47.7 | 57.0 | 19% | 59.8 | 56 |
| main-thread | 26.7 | 24.3 | -9% | 24.5 | 26.7 | 33.0 | 24% | 32.9 | 3 |
| networking | 24.9 | 30.5 | 23% | 35.1 | 24.9 | 30.5 | 23% | 35.1 | 0 |
| option-api | 53.8 | 57.1 | 6% | 59.7 | 53.8 | 68.8 | 28% | 71.7 | 9 |
| pinia | 40.1 | 38.7 | -4% | 39.4 | 40.1 | 50.0 | 25% | 50.8 | 19 |
| provide-inject | 32.2 | 34.3 | 6% | 37.9 | 32.2 | 43.7 | 36% | 47.7 | 13 |
| reactivity | 33.6 | 36.1 | 7% | 36.0 | 33.6 | 46.1 | 37% | 45.6 | 19 |
| slots | 40.1 | 43.8 | 9% | 39.0 | 40.1 | 54.3 | 35% | 49.5 | 47 |
| suspense | 42.3 | 38.4 | -9% | 38.3 | 42.3 | 51.1 | 21% | 51.2 | 16 |
| swiper | 30.3 | 28.5 | -6% | 29.8 | 30.3 | 41.1 | 36% | 42.6 | 47 |
| tailwindcss | 22.5 | 25.8 | 15% | 20.9 | 22.5 | 36.9 | 64% | 30.3 | 71 |
| todomvc | 17.9 | 21.6 | 21% | 20.7 | 17.9 | 31.4 | 76% | 30.3 | 11 |
| todomvc-codex | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |  |
| todomvc-day1 | 20.4 | 20.1 | -2% | 15.9 | 20.4 | 29.4 | 44% | 25.2 | 7 |
| transition | 45.9 | 45.2 | -1% | 47.7 | 45.9 | 59.7 | 30% | 63.2 | 56 |
| v-model | 39.1 | 40.9 | 4% | 40.7 | 39.1 | 52.3 | 34% | 52.4 | 26 |
| vue-router | 43.2 | 45.4 | 5% | 45.0 | 43.2 | 60.3 | 40% | 60.5 | 6 |

### First-frame timings (ms) — v8, bytecode-precompile proxy (MT parse excluded, as on devices)

| example | FCP off | FCP ifr | ΔFCP | FCP ifr+et | TTI off | TTI ifr | ΔTTI | TTI ifr+et | nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7guis | 69.7 | 64.5 | -8% | 67.3 | 69.7 | 77.1 | 11% | 81.1 | 169 |
| basic | 39.9 | 36.6 | -8% | 36.3 | 39.9 | 46.5 | 17% | 46.3 | 9 |
| css-features | 48.9 | 45.3 | -7% | 44.3 | 48.9 | 63.5 | 30% | 57.5 | 51 |
| gallery | 59.6 | 56.6 | -5% | 58.3 | 59.6 | 78.1 | 31% | 80.1 | 4 |
| hackernews-css | 37.0 | 38.5 | 4% | 40.5 | 37.0 | 64.3 | 74% | 67.0 | 14 |
| hackernews-tailwind | 63.6 | 55.6 | -13% | 58.6 | 63.6 | 80.7 | 27% | 84.7 | 20 |
| hello-world | 36.7 | 33.8 | -8% | 31.1 | 36.7 | 44.9 | 22% | 40.7 | 16 |
| keep-alive | 48.0 | 45.9 | -4% | 45.5 | 48.0 | 63.5 | 32% | 63.7 | 56 |
| main-thread | 31.5 | 29.8 | -5% | 28.7 | 31.5 | 38.7 | 23% | 37.4 | 3 |
| networking | 21.3 | 30.7 | 44% | 31.6 | 21.3 | 30.7 | 44% | 31.6 | 0 |
| option-api | 56.9 | 57.0 | 0% | 58.2 | 56.9 | 69.1 | 22% | 71.1 | 9 |
| pinia | 42.2 | 40.4 | -4% | 40.6 | 42.2 | 52.2 | 24% | 52.9 | 19 |
| provide-inject | 39.1 | 37.1 | -5% | 39.1 | 39.1 | 46.7 | 19% | 49.7 | 13 |
| reactivity | 41.1 | 39.4 | -4% | 36.2 | 41.1 | 49.8 | 21% | 46.1 | 19 |
| slots | 47.6 | 43.5 | -9% | 45.3 | 47.6 | 54.4 | 14% | 56.9 | 47 |
| suspense | 42.3 | 39.7 | -6% | 40.4 | 42.3 | 52.5 | 24% | 53.3 | 16 |
| swiper | 30.8 | 28.4 | -8% | 27.1 | 30.8 | 42.8 | 39% | 41.3 | 47 |
| tailwindcss | 24.8 | 25.0 | 1% | 22.0 | 24.8 | 40.7 | 64% | 32.2 | 71 |
| todomvc | 19.8 | 18.9 | -4% | 18.8 | 19.8 | 28.8 | 46% | 28.8 | 11 |
| todomvc-codex | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |  |
| todomvc-day1 | 19.8 | 16.9 | -15% | 16.9 | 19.8 | 26.0 | 31% | 26.0 | 7 |
| transition | 55.3 | 50.5 | -9% | 50.6 | 55.3 | 66.6 | 20% | 67.4 | 56 |
| v-model | 43.9 | 42.8 | -2% | 42.2 | 43.9 | 55.2 | 26% | 54.1 | 26 |
| vue-router | 45.3 | 50.0 | 11% | 52.7 | 45.3 | 66.9 | 48% | 70.9 | 6 |

### First-frame timings (ms) — jitless, raw (includes MT parse — web-platform-like)

| example | FCP off | FCP ifr | ΔFCP | FCP ifr+et | TTI off | TTI ifr | ΔTTI | TTI ifr+et | nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7guis | 66.3 | 66.4 | 0% | 67.9 | 66.3 | 79.2 | 20% | 81.0 | 169 |
| basic | 32.6 | 37.8 | 16% | 37.0 | 32.6 | 47.5 | 46% | 46.4 | 9 |
| css-features | 44.0 | 54.3 | 23% | 47.9 | 44.0 | 67.6 | 54% | 60.2 | 51 |
| gallery | 67.3 | 68.2 | 1% | 74.8 | 67.3 | 92.6 | 38% | 99.6 | 4 |
| hackernews-css | 40.7 | 42.8 | 5% | 45.8 | 40.7 | 66.2 | 63% | 70.7 | 14 |
| hackernews-tailwind | 56.6 | 59.8 | 6% | 59.8 | 56.6 | 82.9 | 47% | 84.1 | 20 |
| hello-world | 34.2 | 39.3 | 15% | 39.5 | 34.2 | 49.4 | 44% | 49.1 | 16 |
| keep-alive | 48.5 | 48.0 | -1% | 50.2 | 48.5 | 60.5 | 25% | 63.5 | 56 |
| main-thread | 27.3 | 31.6 | 16% | 27.7 | 27.3 | 40.2 | 47% | 36.2 | 3 |
| networking | 25.6 | 36.2 | 42% | 41.1 | 25.6 | 36.2 | 42% | 41.1 | 0 |
| option-api | 54.5 | 60.9 | 12% | 63.6 | 54.5 | 72.7 | 33% | 75.6 | 9 |
| pinia | 40.8 | 42.6 | 4% | 43.2 | 40.8 | 53.8 | 32% | 54.7 | 19 |
| provide-inject | 32.9 | 37.5 | 14% | 41.4 | 32.9 | 46.9 | 43% | 51.2 | 13 |
| reactivity | 34.4 | 39.3 | 14% | 39.6 | 34.4 | 49.3 | 43% | 49.2 | 19 |
| slots | 40.8 | 49.8 | 22% | 46.1 | 40.8 | 60.3 | 48% | 56.6 | 47 |
| suspense | 43.0 | 42.6 | -1% | 42.4 | 43.0 | 55.4 | 29% | 55.2 | 16 |
| swiper | 31.0 | 32.0 | 3% | 33.3 | 31.0 | 44.6 | 44% | 46.1 | 47 |
| tailwindcss | 23.1 | 31.2 | 35% | 28.1 | 23.1 | 42.3 | 83% | 37.5 | 71 |
| todomvc | 18.5 | 25.0 | 35% | 24.2 | 18.5 | 34.7 | 87% | 33.9 | 11 |
| todomvc-codex | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |  |
| todomvc-day1 | 21.1 | 23.7 | 12% | 19.4 | 21.1 | 33.0 | 56% | 28.7 | 7 |
| transition | 46.6 | 48.9 | 5% | 51.4 | 46.6 | 63.4 | 36% | 66.8 | 56 |
| v-model | 39.8 | 44.4 | 11% | 44.3 | 39.8 | 55.8 | 40% | 56.0 | 26 |
| vue-router | 43.9 | 50.3 | 14% | 49.1 | 43.9 | 65.2 | 48% | 64.6 | 6 |

### First-frame timings (ms) — v8, raw (includes MT parse — web-platform-like)

| example | FCP off | FCP ifr | ΔFCP | FCP ifr+et | TTI off | TTI ifr | ΔTTI | TTI ifr+et | nodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7guis | 70.5 | 67.3 | -4% | 70.5 | 70.5 | 80.0 | 14% | 84.3 | 169 |
| basic | 40.6 | 39.6 | -3% | 39.5 | 40.6 | 49.5 | 22% | 49.4 | 9 |
| css-features | 49.6 | 48.5 | -2% | 47.6 | 49.6 | 66.7 | 35% | 60.9 | 51 |
| gallery | 60.3 | 59.7 | -1% | 61.5 | 60.3 | 81.1 | 35% | 83.3 | 4 |
| hackernews-css | 37.7 | 45.9 | 22% | 47.4 | 37.7 | 71.6 | 90% | 73.9 | 14 |
| hackernews-tailwind | 64.4 | 62.3 | -3% | 65.2 | 64.4 | 87.4 | 36% | 91.3 | 20 |
| hello-world | 37.6 | 36.7 | -2% | 34.0 | 37.6 | 47.7 | 27% | 43.6 | 16 |
| keep-alive | 48.7 | 49.2 | 1% | 48.8 | 48.7 | 66.8 | 37% | 66.9 | 56 |
| main-thread | 32.2 | 32.8 | 2% | 31.6 | 32.2 | 41.7 | 30% | 40.3 | 3 |
| networking | 22.0 | 36.4 | 65% | 37.3 | 22.0 | 36.4 | 65% | 37.3 | 0 |
| option-api | 57.5 | 60.6 | 5% | 62.1 | 57.5 | 72.7 | 27% | 74.9 | 9 |
| pinia | 42.8 | 44.0 | 3% | 44.1 | 42.8 | 55.8 | 30% | 56.3 | 19 |
| provide-inject | 39.7 | 40.1 | 1% | 42.4 | 39.7 | 49.7 | 25% | 52.9 | 13 |
| reactivity | 41.8 | 42.5 | 2% | 39.1 | 41.8 | 52.9 | 27% | 49.1 | 19 |
| slots | 48.3 | 46.4 | -4% | 48.6 | 48.3 | 57.3 | 19% | 60.1 | 47 |
| suspense | 43.0 | 43.3 | 1% | 44.2 | 43.0 | 56.1 | 30% | 57.1 | 16 |
| swiper | 31.6 | 31.6 | 0% | 30.3 | 31.6 | 46.0 | 46% | 44.5 | 47 |
| tailwindcss | 25.5 | 28.4 | 11% | 25.2 | 25.5 | 44.0 | 73% | 35.3 | 71 |
| todomvc | 20.5 | 22.2 | 9% | 21.9 | 20.5 | 32.1 | 57% | 31.9 | 11 |
| todomvc-codex | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |  |
| todomvc-day1 | 20.5 | 20.0 | -3% | 20.0 | 20.5 | 29.1 | 42% | 29.1 | 7 |
| transition | 56.0 | 53.5 | -4% | 53.8 | 56.0 | 69.6 | 24% | 70.6 | 56 |
| v-model | 44.5 | 46.0 | 3% | 45.2 | 44.5 | 58.4 | 31% | 57.2 | 26 |
| vue-router | 46.0 | 54.7 | 19% | 57.1 | 46.0 | 71.5 | 55% | 75.3 | 6 |

### Bundle size (main.lynx.bundle, KiB) and protocol payload

| example | raw off | raw ifr | Δraw | gz off | gz ifr | Δgz | gz ifr+et | MT off→ifr (KiB) | 1st batch off (KiB) | doc ✓ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 7guis | 81.3 | 166.9 | 105% | 33.6 | 75.9 | 126% | 76.2 | 16.7→78.9 | 16.4 | ✓✓ |
| basic | 82.0 | 168.5 | 105% | 34.1 | 76.8 | 126% | 77.2 | 16.7→79.6 | 1.0 | ✓✓ |
| css-features | 93.9 | 190.4 | 103% | 37.8 | 84.9 | 124% | 86.5 | 17.0→87.5 | 5.9 | ✓✓ |
| gallery | 87.1 | 175.6 | 102% | 37.2 | 80.0 | 115% | 80.1 | 17.3→82.5 | 129.2 | ✓✓ |
| hackernews-css | 204.0 | 431.5 | 112% | 72.6 | 179.1 | 147% | 180.7 | 16.7→191.8 | 2.3 | ✓✓ |
| hackernews-tailwind | 201.1 | 430.0 | 114% | 72.2 | 179.1 | 148% | 181.1 | 16.7→194.6 | 4.0 | ✓✓ |
| hello-world | 83.0 | 167.5 | 102% | 34.5 | 76.3 | 121% | 77.0 | 16.7→77.8 | 0.9 | ✓✓ |
| keep-alive | 87.8 | 182.6 | 108% | 36.0 | 82.7 | 130% | 83.3 | 16.7→85.3 | 5.2 | ✓✓ |
| main-thread | 83.6 | 172.4 | 106% | 34.8 | 78.9 | 127% | 79.1 | 17.0→81.0 | 0.6 | ✓✓ |
| networking | 161.5 | 348.5 | 116% | 57.5 | 145.5 | 153% | 146.1 | 16.7→158.7 | 0.0 | ✓✓ |
| option-api | 90.1 | 188.4 | 109% | 37.3 | 86.3 | 131% | 86.6 | 16.7→87.5 | 1.1 | ✓✓ |
| pinia | 91.9 | 194.5 | 112% | 38.2 | 89.2 | 133% | 90.0 | 16.7→89.7 | 2.0 | ✓✓ |
| provide-inject | 81.3 | 166.7 | 105% | 33.7 | 75.9 | 125% | 76.3 | 16.7→78.8 | 1.7 | ✓✓ |
| reactivity | 82.3 | 168.4 | 105% | 34.0 | 76.4 | 125% | 77.5 | 16.7→79.6 | 2.0 | ✓✓ |
| slots | 82.4 | 169.1 | 105% | 34.0 | 76.7 | 125% | 77.0 | 16.7→80.0 | 3.4 | ✓✓ |
| suspense | 96.9 | 204.8 | 111% | 39.8 | 92.9 | 134% | 93.4 | 16.7→93.9 | 1.8 | ✓✓ |
| swiper | 91.9 | 181.6 | 98% | 37.8 | 81.8 | 116% | 82.3 | 19.6→85.8 | 5.7 | ✓✓ |
| tailwindcss | 92.8 | 181.2 | 95% | 36.2 | 79.0 | 118% | 81.0 | 16.7→82.5 | 5.5 | ✓✓ |
| todomvc | 90.3 | 180.2 | 99% | 36.3 | 80.5 | 122% | 81.4 | 16.7→82.4 | 0.7 | ✓✓ |
| todomvc-codex | 118.4 | 246.9 | 109% | 47.1 | 109.9 | 133% | 110.6 | 16.7→110.9 | 0.0 | ✗✗ |
| todomvc-day1 | 88.0 | 176.5 | 101% | 35.5 | 79.2 | 123% | 80.1 | 16.7→81.1 | 0.5 | ✓✓ |
| transition | 89.1 | 181.7 | 104% | 35.4 | 80.0 | 126% | 81.3 | 16.7→85.5 | 5.1 | ✓✓ |
| v-model | 87.3 | 180.5 | 107% | 35.8 | 81.8 | 128% | 82.7 | 16.7→84.6 | 3.2 | ✓✓ |
| vue-router | 108.9 | 231.5 | 113% | 44.4 | 104.4 | 135% | 105.3 | 16.7→106.6 | 1.0 | ✓✓ |
