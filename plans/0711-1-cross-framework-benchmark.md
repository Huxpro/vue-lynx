# Cross-framework black-box benchmark: ReactLynx vs Vue VDOM vs Vue Vapor

Date: 2026-07-11. Follow-up to `0709-2-vdom-vapor-benchmark.md` /
`0709-3-vdom-vapor-benchmark-results.md`.

## Goal

Compare **ReactLynx** (`@lynx-js/react`), **Vue Lynx VDOM**, and **Vue Lynx
Vapor** on outcomes only — user-observable latency, startup, memory,
bundle size — with a protocol that cannot favor any framework's internals.

## Why a separate harness

The vdom-vs-vapor harness (`harness/run.mjs`) measures `bg`/`e2e` through
vue-lynx-internal instrumentation (`nextTick` semantics, flush hook, ops
telemetry). None of that exists for ReactLynx, and porting it would measure
our instrumentation, not the framework. So `harness/cross.mjs` treats every
app as a black box:

- **Drive**: real mouse clicks (Playwright → Chromium input pipeline →
  Lynx tap events) on rendered buttons and row cells.
- **Observe**: poll the composed DOM (piercing shadow roots) once per
  animation frame until the operation's end state holds
  (row count / label text / selection class).
- **Latency** = the `pointerdown` reaching the page → the first animation
  frame at which the end-state predicate is true. Resolution is therefore
  one frame (~17 ms) — identical for all frameworks.

## Apps

`apps/ui-react`, `apps/ui-vdom`, `apps/ui-vapor` — the krausest
js-framework-benchmark table app with a button toolbar, no instrumentation.
Same UI structure, same CSS, same operation semantics; each framework uses
its idiomatic state management:

- React: immutable updates + `memo`ized row component + `useCallback`
  (the keyed react-hooks reference implementation).
- Vue vdom / vapor: `shallowRef` rows with per-row label refs (the
  vuejs/core official benchmark implementation); vapor App.vue generated
  from the vdom source (only the `vapor` attribute differs).

`apps/ui-react` is a nested workspace package with its own
`@lynx-js/rspeedy` 0.15 toolchain — ReactLynx 0.122 targets a newer rsbuild
generation than the Vue apps' rspeedy 0.13. The harness serves
`@lynx-js/web-core` 0.22 for both generations (verified by smoke test).

## Operations

Mirrors `shared/bench-core.ts` `runScenario`: 3× create/clear warmup, then
create1k, update10th, select, swap, remove, append1k (n=10 each),
create10k + clear10k (n=5), memory sampled mounted / after10k / afterClear,
startup = lynx-view attach → first content. Mode order rotates across
loads. select taps row labels (cycling rows 2–9), remove taps a row's `x` —
both real hit-tested clicks.

## Fairness notes / limitations

- Frame-granularity flooring: operations faster than one frame read as
  ~17 ms for every framework; this harness can rank only operations that
  cost multiple frames. The vdom-vs-vapor sub-frame differences are visible
  in the instrumented benchmark (`results/latest.md`), not here.
- Lynx for Web, not a native device; PrimJS/native layout will shift
  absolute numbers.
- ReactLynx runs its production main-thread scheduling on the web runtime
  the same way Vue Lynx does (both BG-worker + MT), but the frameworks'
  main-thread strategies differ by design (ReactLynx has MT-first paint for
  initial render); first-screen numbers reflect that design difference.

## Results

Raw data: `results/cross-run1.{json,md}` (first run), `results/cross-run2.{json,md}`
(replication + cold single-shot + drift tables, = `cross-latest.*`). Both runs
agree; numbers below are run2. Ad-hoc cold update-path probe:
`harness/cold-select-probe.mjs`.

### Headline (in-scenario, median ms)

| op | react | vdom | vapor |
|---|---|---|---|
| create1k | 115 | 111 | 120 |
| update10th | 49 | 16 | 18 |
| select | 160 | 27 | 26 |
| swap | 314 | 16 | 28 |
| remove | 445 | 20 | 18 |
| append1k | 3028 | 116 | 126 |
| create10k | 28634 | 1274 | 1290 |
| clear10k | 332 | 249 | 237 |

### The single most important finding: degradation, not intrinsic cost

ReactLynx's in-scenario numbers degrade progressively as operations
accumulate; both Vue modes stay flat. Three independent confirmations:

1. **Cold single-shot** (fresh app per sample): creation is at **parity** —
   create1k 189 / 179 / 172 ms, create10k 1496 / 1460 / 1483 ms
   (react / vdom / vapor). React's in-scenario create10k of ~28.6 s is
   ~19× its own fresh-app cost.
2. **Within-scenario drift** (last-3 ÷ first-3 samples): react update10th
   1.94×, select 2.12× within a single load; Vue ops ≈ 0.9–1.1× (tiny ops
   like swap bounce on frame granularity). Degradation compounds across
   blocks, so late blocks (remove, append1k, create10k) start already slowed.
3. **Cold update-path probe** (fresh app → create1k → one select / one
   update10th, 3 rounds): react ≈ 38–40 / 36–55 ms; vdom ≈ 14–23 / 21–27 ms;
   vapor ≈ 21–24 / 22–23 ms.

So the honest cross-framework statement is:

- **Intrinsic (fresh-app) costs**: creation parity across all three;
  update-path ops ~1.5–2× faster on both Vue modes than ReactLynx.
- **Sustained-session costs**: Vue (both modes) stays at its intrinsic
  cost; ReactLynx 0.122.1 on the Lynx-for-Web runtime accumulates per-op
  slowdown (mechanism not investigated here — this suite is outcome-only;
  symptom resembles the MT element-registry leak we fixed in vue-lynx,
  `72ac20b`).
- **vdom vs vapor is a wash at frame granularity** — their real update-path
  difference (5.8–9.8× on the background thread) is sub-frame and only
  visible in the instrumented suite (`results/latest.md`).

### Startup / memory / bundle

- **First screen: react 68 ms < vdom 84 ms < vapor 96 ms.** ReactLynx's
  MT-first initial render pays off — it paints before the background
  thread finishes booting; Vue Lynx renders from the background thread.
  This is a real architectural advantage of ReactLynx on Lynx.
- Memory (indicative, no forced GC): after 10k rows react 61 / vdom 38 /
  vapor 90 MB in run2; vapor's page-heap numbers swing widely between runs
  (45→148 MB for the same phase in run1) — treat as noise-dominated.
- Bundle gzip (lynx): react 39.5 KB ≈ vdom 38.2 KB < vapor 46.1 KB.

### Caveats

- One-frame (~17 ms) measurement floor; sub-frame differences invisible.
- Lynx for Web + headless Chromium, not a native device / PrimJS.
- ReactLynx apps in production would use `<list>` virtualization for
  10k-row tables (so would Vue apps); the krausest protocol deliberately
  renders flat.
- ReactLynx 0.122.1 built with its own rspeedy 0.15 toolchain; Vue apps on
  rspeedy 0.13; both served by web-core 0.22.1.
