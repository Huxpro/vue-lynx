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

See `results/cross-run1.md` (snapshot) / `results/cross-latest.md`.

<!-- RESULTS_SUMMARY -->
