# Cross-framework black-box benchmark: ReactLynx vs Vue VDOM vs Vue Vapor

Date: 2026-07-11. Follow-up to `0709-2-vdom-vapor-benchmark.md` /
`0709-3-vdom-vapor-benchmark-results.md`.

> **⚠️ CORRECTION (Round 4, same day):** every ReactLynx number in Rounds
> 1–3 is polluted by a Lynx-for-Web runtime artifact and is superseded by
> the Round 4 results below. Real-device testing showed React ≈ Vue for
> these scenarios; the audit traced our multi-second/DNF React numbers to
> `@lynx-js/web-core`'s always-on `lynx.profile` shim (see Round 4). The
> Vue-vs-Vue numbers were never affected. Rounds 1–3 are kept as history
> of the investigation.

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

## Round 2: update-heavy scenarios (storms)

The base suite could not show the vdom-vs-vapor update difference — every
update-path op at 1k rows is sub-frame, so both floor at ~one frame. Two
constructed scenario families raise the work above the floor
(`node harness/cross.mjs --storms`, results
`results/cross-storms-run2.{json,md}` = `cross-storms-latest.*`):

- **one-shot ops on a 10k-row table** — vdom's full-list diff spans
  multiple frames there;
- **storms** — one click triggers N sequential state→render→cross-thread→
  DOM ticks in-app (update ×50 / select ×30, one macrotask per tick via
  MessageChannel); wall time from pointerdown to the final DOM state is a
  throughput outcome that amplifies per-tick cost N× above the frame floor.

Fresh app per (mode, size, rep). Key numbers (median, run2):

| scenario | react | vdom | vapor | vapor vs vdom |
|---|---|---|---|---|
| update storm ×50 @1k | 31.4 s | 103 ms | **68 ms** | 1.5× faster |
| select storm ×30 @1k | 39.0 s | 47 ms | **20 ms** | 2.3× faster |
| update10th one-shot @10k | 1.61 s | 107 ms | **90 ms** | 1.2× faster |
| select one-shot @10k | 5.06 s | 73 ms | **57 ms** | 1.3× faster |
| update storm ×50 @10k | DNF (>240 s ×2) | 1417 ms | **798 ms** | **1.8× faster** |
| select storm ×30 @10k | not reached (rep aborted at update-storm DNF) | 687 ms | **97 ms** | **7.1× faster** |

Readings:

- **The select storm on a 10k table is the textbook Vapor case made
  user-visible**: each tick, vdom re-renders/diffs the whole 10k-row list
  to move one selection class (~23 ms/tick); vapor runs two class effects
  (~3 ms/tick, mostly cross-thread/scheduling overhead). 687 ms vs 97 ms
  for 30 selection moves is directly perceivable jank vs fluidity.
- Update storm @10k (1000 label writes/tick): vapor 16 ms/tick vs vdom
  28 ms/tick. The gap is smaller than select's because both must ship and
  apply 1000 SET_TEXT ops per tick (shared MT cost); vdom additionally
  pays the 10k-row diff.
- ReactLynx: storms at 1k take 31–39 s (vs Vue's tens of ms) and at 10k
  hit the 240 s timeout — its superlinear per-op degradation compounds
  under rapid successive updates. Cold one-shots at 10k (1.6 s update,
  5.1 s select) are already multi-second before degradation.
- Sub-frame one-shot artifact, for honesty: select@1k medians (vdom 8 ms,
  vapor 27 ms) are frame-phase alignment noise — completion lands in
  either the same rAF or the next for ops this small; only the storm
  totals rank sub-frame ops meaningfully.

## Round 3: is the React app under-optimized? (naive / manual hooks / React Compiler)

Fair challenge — answered by measuring all three optimization levels
(`--modes react,react-naive,react-compiler`, results
`results/cross-storms-react-variants.{json,md}`):

- **react** (the variant used in every round above) was ALREADY the
  hand-optimized one: `memo()`'d Row component + `useCallback` on every
  handler — the keyed react-hooks reference implementation.
- **react-naive**: same semantics, no memo / no useCallback.
- **react-compiler**: the naive source auto-memoized by
  `babel-plugin-react-compiler` 1.0 (`target: '18'`, using the
  `react-compiler-runtime` polyfill with `react` aliased to
  `@lynx-js/react`; `_c()` memo caches verified present in the bundle).
  ReactLynx 0.122 itself has no `react/compiler-runtime` export.

Storm results (median; hooks column reproduces Round 2's react within noise):

| scenario | react (hooks) | react-naive | react-compiler |
|---|---|---|---|
| update storm ×50 @1k | 31.8 s | 60.0 s | 63.9 s |
| select storm ×30 @1k | 39.5 s | 94.6 s | 95.0 s |
| update10th one-shot @10k | 1.91 s | 3.73 s | 2.98 s |
| select one-shot @10k | 5.20 s | 11.3 s | 10.3 s |
| storms @10k | DNF (>240 s) | DNF | DNF |

Readings:

1. **Manual optimization matters on ReactLynx**: naive is 1.5–2.4× slower
   than the hand-optimized app (select storm 94.6 s vs 39.5 s).
2. **React Compiler does NOT substitute for manual memo on ReactLynx**:
   compiler ≈ naive across the board (sometimes slightly worse — memo-cache
   bookkeeping overhead without the payoff). Consistent explanation:
   React Compiler's win comes from preserving JSX element identity so the
   reconciler bails out of unchanged subtrees; it does not wrap child
   components in `memo()`. ReactLynx's preact-based reconciler apparently
   lacks (or doesn't benefit from) the element-reference bailout for this
   shape, so compiler-level memoization inside `App` doesn't prune the
   1k/10k `Row` re-renders the way explicit `memo(Row)` does.
3. **The framework comparison above is therefore already React's best
   case**: every headline number in Rounds 1–2 used the hand-optimized
   variant, and the superlinear degradation + storm DNFs persist across
   all three optimization levels — it's runtime behavior, not app-code
   quality.

## Round 4: credibility audit and CORRECTION — the degradation was a web-core artifact

Trigger: real-device testing (create 10k → select/update storms) showed
**React ≈ Vue, same order of magnitude** — contradicting our DNF results.
Audit steps and findings (scripts preserved in the session; method below):

1. **Replication with three independent channels** (badge-style
   MutationObserver, timed screenshots, PerformanceObserver longtasks):
   the container reproduced the harness results faithfully — react
   update storm @10k really did exceed 300 s here, with per-tick time
   *growing during the storm* (tick 4 ≈ 4 s → tick 20 ≈ 15 s) while DOM
   mutations stayed constant (3,000 records/tick).
2. **Zero-observer control** (no polling, no observers, coarse 5 s state
   checks): still >300 s — ruled out observer effect from our harness.
3. **Main-thread CDP profile**: 90% idle — ruled out main-thread
   contention; the cost was inside the background worker.
4. **Worker CPU profile** (raw CDP attach to the worker target):
   **82.8% of worker CPU in `performance.clearMarks`**, plus `mark`,
   `measure`, `profileEnd` — all called from web-core's worker chunk.
5. **Source confirmation** (`@lynx-js/web-core` 0.22.1): the shim maps
   Lynx's `profileStart`/`profileEnd` onto `performance.mark()` /
   `measure()` / `clearMarks()`, **never clears the measure entries**
   (unbounded timeline growth ⇒ every later call scans it), and reports
   `isProfileRecording: () => performance !== undefined` — i.e. *always
   recording* on web, whereas on native Lynx these calls are no-ops
   unless a tracing session is active. ReactLynx's production runtime
   profiles per rendered snapshot; Vue Lynx never calls the API. Hence:
   React-only, web-only, superlinear-in-operation-count degradation.
6. **Fix validation**: neutralizing `lynx.profile:`-prefixed entries
   (surgical `mark`/`measure`/`clearMarks` no-op, applied identically to
   every framework; now part of `harness/cross.mjs` and the docs
   playground) took the same react update storm @10k from **>300 s (DNF)
   to ~15–20 s wall / all 50 ticks**, worker 78% idle.

### Corrected results (run3-neutralized, `results/cross-storms-run3-neutralized.*`)

| scenario | react (hooks) | vdom | vapor | react/vdom |
|---|---|---|---|---|
| update10th one-shot @1k | 25.5 ms | 28.1 ms | 23.2 ms | ~parity |
| select one-shot @1k | 27.8 ms | 29.0 ms | 28.3 ms | ~parity |
| update storm ×50 @1k | 406 ms | 88 ms | 54 ms | 4.6× |
| select storm ×30 @1k | 176 ms | 51 ms | 17 ms | 3.4× |
| update10th one-shot @10k | 161 ms | 110 ms | 80 ms | 1.5× |
| select one-shot @10k | 101 ms | 55 ms | 56 ms | 1.8× |
| update storm ×50 @10k | 4.31 s | 1.21 s | 0.62 s | 3.6× |
| select storm ×30 @10k | 2.58 s | 0.60 s | 0.086 s | 4.3× |

Corrected conclusions:

- **React vs Vue on Lynx: same order of magnitude everywhere** — parity
  on one-shots at 1k, 1.5–1.8× at 10k one-shots, 3.4–4.6× under storm
  throughput. Matches real-device experience and js-framework-benchmark
  expectations. All "superlinear degradation" / DNF claims about
  ReactLynx are **withdrawn** — they measured web-core's profiling shim,
  not the framework.
- **Vue-vs-Vue results stand** (Vue never triggered the shim): vapor
  1.6× (update) / 3.0× (select) faster than vdom at 1k storms, 1.9× /
  7.0× at 10k storms.
- The artifact is worth reporting upstream: web-core could gate the shim
  on an explicit tracing flag and/or clear measures; frameworks calling
  `profileStart`/`profileEnd` in production hot paths pay O(timeline)
  per call on web as it stands.
- Meta-lesson recorded in the docs: cross-validate any surprising
  benchmark result with an independent channel (real device, zero-observer
  control, CPU profile) before publishing.

## Round 5: React Compiler triage, scaling curves, and the create/update trade-off

### React Compiler triage — our scaffolding broke compilation

`babel-plugin-react-compiler` with a logger revealed that **`App` never
compiled** in the earlier compiler variant: the storm drivers' `t++`
mutating a binding captured by lambdas bails out the entire component
("(BuildHIR::lowerExpression) Handle UpdateExpression to variables
captured within lambdas"). Only `Row` compiled — and with an uncompiled
parent passing fresh inline props, its memo cache was pure overhead.
So "compiler ≈ naive or worse" was measuring a bailed-out build.

Fix: storm drivers moved to module scope (`runStorm(ticks, step)` — the
compiler only processes components/hooks; the per-tick callback takes `t`
as a parameter). Verified post-fix: `App` compiles with a 93-slot memo
cache, `Row` with 16.

Post-fix results (scale run, `results/cross-storms-scale.*`): compiler is
now **10–25% faster than naive** on storms and near-hooks on one-shot
select — but still well short of manual `memo(Row)` (e.g. selectStorm@1k:
hooks 227 ms, compiler 352 ms, naive 409 ms). Mechanism: the compiler's
memoization is **intra-component** — `rows.map(row => <Row/>)` re-runs
whenever `rows` or `selected` changes, recreating all row elements; it
cannot prune per-row re-renders of a keyed list the way an explicit
component-boundary `memo(Row)` does. For krausest-shaped workloads
(large keyed lists), manual `memo` remains necessary on ReactLynx.
Our sources otherwise pass the compiler cleanly (no Rules-of-React
violations — the bailout was an unsupported syntax pattern, not a rule
break).

### Does "React creates faster, Vue updates faster" match the web?

Half of it does not — and that half is the Lynx-specific finding:

- **On js-framework-benchmark (web), keyed `vue` is consistently FASTER
  than `react-hooks` at creation** (vue ≈1.1–1.2× of vanilla vs react
  ≈1.3–1.5×, order-stable across years). On Lynx for Web, React creates
  ~15–20% FASTER than both Vue modes at every scale (10k: 1.61 s vs
  1.91 s). This inversion is a runtime-architecture trait: creation e2e
  is dominated by main-thread DOM construction, and ReactLynx's snapshot
  system ships static structure once and bulk-instantiates on the main
  thread — a path web-core optimizes natively — while vue-lynx's ops
  interpreter creates elements node-by-node (CLONE_TEMPLATE cut our
  cross-thread payload but the MT loop remains per-node).
- **Vue's update advantage exists on the web too, but small (~1.1–1.3×);
  Lynx amplifies it to 3–5× (vdom) / 5–20× (vapor)** under sustained
  ticks. Every tick pays serialize→transfer→apply; ReactLynx adds
  per-commit snapshot-patch overhead plus 10k memo comparisons per tick
  in the worker (post-fix profile: react worker 69% idle vs vdom 90%
  idle during the same storm — residual cost is genuine reconciliation,
  no pathology), plus ~4% residual profiling-call overhead.

### Scaling curves (1k→3k→5k→10k, `results/cross-storms-scale.*`)

Rendered as create-vs-per-tick log-log curves in `cross-table.html`. All
five variants scale linearly with N on both axes (parallel curves — no
cliffs). Placement:

- **Vapor is not a trade-off within Vue**: creation matches vdom at every
  scale while update/select throughput dominates (select ~6× vdom, ~20×
  react at 10k) — bottom curve on both charts. Overall better, not
  "各有千秋", within the Vue family (its costs live elsewhere: +26%
  bundle, prerelease status).
- **The real trade-off is React vs Vue**: React holds the creation edge
  (~1.2×) and pays for it in update throughput (~3–5× vs vdom). Pick by
  workload: creation-heavy feeds vs interaction-heavy tables.

## Round 6: Preact web baseline, larger scales, and the pipeline tax

Two challenges: (a) ReactLynx is preact-based, so the honest web reference
is Preact, not React — maybe "creates faster" is just Preact; (b) parallel
curves might be an artifact of too-small a range, with Lynx costs
amortizing framework differences. Both answered by running **the exact
same click-driven storm protocol on plain DOM** (new
`apps/web-baseline`: preact-hooks / Vue vdom / Vue vapor — the vapor SFC
compiled by `@vue/compiler-sfc` in an esbuild plugin; harness
`harness/web-baseline.mjs`) and extending Lynx scales to **20k/30k** with
least-squares scaling exponents (`results/cross-storms-scale6.*`,
`results/web-baseline-latest.*`, all rendered in `cross-table.html`).

### (a) Preact reference: the Lynx differences are ADAPTER traits, not framework traits

Plain DOM @10k: create — preact 712 ms, vue 641 ms, vapor 498 ms
(**preact is SLOWER than Vue at create on the web**); select storm —
preact 651 ms, vue 1130 ms (**preact is ~1.7× FASTER than Vue vdom at
sustained updates on the web**). Both orderings INVERT on Lynx (react
creates 1.2× faster; vue sustains updates 2–7× faster). Conclusion: the
underlying frameworks are close on DOM, and essentially all of the
cross-framework structure we measure on Lynx comes from the respective
adapters/runtimes — ReactLynx's snapshot bulk-instantiation wins creation,
vue-lynx's leaner per-commit pipeline wins sustained updates. (Vapor on
plain DOM dominates everything, consistent with upstream claims.)

### (b) Larger scales: the parallel-curves picture breaks, as suspected

- **Update storms converge on Lynx**: vapor/vdom per-tick ratio 1.8× @10k
  → 1.10× @20k → 1.08× @30k — the shared main-thread apply dominates at
  large N and amortizes the BG-side advantage. Scaling exponents:
  react α=1.00 (linear!), vdom α=1.30, vapor α=1.37 — extrapolating,
  ReactLynx would eventually catch Vue on update storms (@30k it's
  already only 1.6×).
- **Select storms stay structurally separated** (vapor α=0.88 vs vdom
  1.20; @30k still 8.4×): per-tick work is O(1)-rows for vapor and
  O(N) for diff-based renderers — no amortization possible.
- Creation is ~linear (α≈0.9–1.0) for everyone, no cliffs anywhere.

### The Lynx pipeline tax (same framework family, Lynx ÷ DOM, @10k)

| metric | Vapor | VDOM | React↔Preact |
|---|---|---|---|
| create | 4.0× | 3.0× | 2.2× |
| update storm /tick | **0.5×** | **0.4×** | 1.3× |
| select storm /tick | 4.6× | 0.9× | 3.9× |

Creation costs 2–4× more through the dual-thread pipeline (serialize +
interpret + apply). But **sustained updates are FASTER on Lynx than the
same framework on plain DOM for Vue** (0.4–0.5×): the BG thread renders
tick N+1 while the MT applies tick N (pipelining), and the MT element
tree avoids full-page style/layout per tick. React's per-commit overhead
eats that pipelining win (1.3×). Vapor's select-storm tax (4.6×) is a
floor effect — 1 ms/tick on DOM vs ~5 ms of cross-thread round-trip.

### Corrected React optimization variants (`results/cross-storms-react-variants.*`, v2)

| scenario | react (hooks) | react-naive | react-compiler |
|---|---|---|---|
| update storm ×50 @1k | 442 ms | 644 ms | 843 ms |
| select storm ×30 @1k | 175 ms | 332 ms | 468 ms |
| update storm ×50 @10k | 4.31 s | 6.16 s | 8.65 s |
| select storm ×30 @10k | 1.88 s | 3.44 s | 4.95 s |

Corrected readings: manual memo/useCallback is worth ~1.5–1.9× under
storms; React Compiler measures ~1.9–2.7× slower than hand-optimized
(and consistently slower than naive) on ReactLynx's preact-based
reconciler — its memo-cache bookkeeping runs on every render without
pruning child re-renders. The artifact had previously exaggerated the
naive/compiler penalty (more re-renders ⇒ more profiling calls ⇒ more
timeline scanning).
