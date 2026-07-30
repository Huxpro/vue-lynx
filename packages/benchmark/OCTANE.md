# Octane in the unified matrix

[Octane](https://github.com/octanejs/octane) ships a private Lynx renderer in
`packages/lynx` (`@octanejs/lynx`, version `0.0.0`, `private: true`). This adds
it to the matrix as a third framework family alongside Vue and ReactLynx.

## What runs, and what does not

Octane's Lynx bundles **do run on Lynx for Web** — the tree paints, CSS applies,
`<x-view>` / `<x-text>` come out of the same web-core runtime the Vue and React
cells use. (Octane's own README only claims a verified first paint on macOS
Explorer 3.9; the web path appears untested upstream but works.)

**Native events do not reach Octane's runtime.** Its host driver registers a
string token with `__AddEvent` (`octane:<root>:<id>:<generation>:<listener>`,
`core/native-events.ts`), and the only thing that turns such a token back into
an Octane event is `LynxMainThreadController.dispatchNativeEvent`, which is
called exclusively from `packages/lynx/tests/`. Neither the runtime nor
`@octanejs/rspeedy-plugin`'s generated main-thread entry wires an engine
callback into it, and the background side registers no handler for the token
either. A tap therefore renders nothing — verified on both our table app and
octane's own counter demo, where "Count 0" never advances.

This is consistent with `packages/lynx/README.md`, which lists the "native
event/reload contracts" as an open gate before public stabilization.

**Consequence for the matrix:** every click-driven metric — `create_ms`,
`update10th_ms`, `select_ms`, both storms — is unmeasurable for Octane. The
cells below are the ones that need no interaction.

## Where this lands in the unified report

Both measurements are ingested by `harness/synthesize.mjs` as the
`first-screen` workload (`ingestFirstScreen`) and rendered as the **First
screen** section of `results/unified/report.html` — i.e. the published
`/guide/benchmark-unified` page, not a side document. That section sits
directly under the conclusions (it used to be at the bottom, where nobody
scrolled to it) and carries:

- the startup + mount-create table, with Octane as a row;
- **`mount-create` vs rows** over the full 1k→30k ladder — the only scale
  curve Octane can appear on;
- the same curve **normalized to the `vdom` baseline**. Absolute medians move
  with the host; a ratio against the plainest cell in the matrix does not, so
  this is the chart to quote when the machine is suspect.

Octane also gets a top-level conclusion card, a row in the Coverage table
(`✓` under *first screen* only), and a column in the storm table rendered as
a hoverable `N/A` — a reader comparing frameworks should see that the cell
was attempted and why it is empty, not find it silently missing.

## Measurable cells

Two harness modes were added for this (both are framework-neutral and work for
every mode):

```bash
# first screen only: <lynx-view> attach → first content painted
node harness/cross.mjs --skip-build --startup-only --modes vdom,vapor,octane

# mount-create ladder: the app is BUILT with the table already populated
# (BENCH_AUTOROWS=N), measuring attach → all N rows painted
for N in 1000 3000 5000 10000 20000 30000; do
  BENCH_AUTOROWS=$N node harness/build-unified.mjs --skip-react \
    --only=vdom,vdom-ifr,vapor,vapor-ifr
  BENCH_AUTOROWS=$N OCTANE_REPO=… node harness/build-octane.mjs
done
node harness/cross.mjs --skip-build --mount-reps 7 \
  --mount-create=1000,3000,5000,10000,20000,30000 \
  --modes vdom,vdom-ifr,vapor,vapor-ifr,octane

# fold both into results/unified/latest.json + report.html / report.zh.html
node harness/synthesize.mjs
```

`BENCH_AUTOROWS` builds use `buildDataSeeded` (index-derived labels): the rows
are rendered during the first screen, so under IFR the main and background
threads each build the data themselves and `Math.random()` would turn every row
into a hydration mismatch.

### Which Vue cells are the fair comparison

Octane's shipped Rspeedy path always paints the first screen on the main thread
— `main-thread-entry.js` hardcodes `installLynxMainThread({ firstScreen: true,
firstScreenSync: 'manual' })` and there is no plugin option to turn it off.
(Patching it to `firstScreen: false` produces a bundle that never renders, since
the generated graph still calls `markFirstScreenSyncReady()`.) So Octane always
does main-thread paint + background re-render + adoption, and the honest Vue
comparators are the **`+IFR` cells**, not the plain ones.

## Results

Chromium (Playwright) + `@lynx-js/web-core`, medians; startup n=11,
mount-create n=7 per rung, mode order rotated per rep. Both measurements come
from **one session on one host** against this branch's base (`vapor` @
`7fe932b`).

### Startup — empty app, attach → first content

| cell | median | min–max |
|---|---|---|
| vapor +ifr | 93.3 ms | 79.7–112.5 |
| **octane** | **93.5 ms** | 76.7–112.8 |
| vdom +ifr | 95.9 ms | 75.5–110.9 |
| vdom | 114.6 ms | 96.0–133.9 |
| vapor | 119.5 ms | 104.4–133.0 |

**Read this one as a tie, not a ranking.** The three leaders are within
2.6 ms of each other with per-sample ranges that overlap almost completely,
and across the five runs this branch has been through Octane has landed
first, second and third. The defensible claim is that Octane is *in the
`+IFR` band* on an empty first screen — and clearly ahead of the two
non-IFR cells, which is the part that does not move.

### Mount-create ladder — attach → N rows painted (includes framework boot)

| cell | 1k | 3k | 5k | 10k | 20k | 30k |
|---|---|---|---|---|---|---|
| vdom | 299 ms | 656 ms | 1090 ms | 1991 ms | 3850 ms | 5660 ms |
| vdom +ifr | 242 ms | 753 ms | 1305 ms | 2275 ms | 4390 ms | 6559 ms |
| vapor | 345 ms | 709 ms | 1176 ms | 2185 ms | 4070 ms | 5683 ms |
| vapor +ifr | 287 ms | 610 ms | 1428 ms | 2570 ms | 4744 ms | 7723 ms |
| **octane** | **477 ms** | **1186 ms** | **1834 ms** | **3482 ms** | **6765 ms** | **9541 ms** |

Normalized to `vdom` (the plainest cell in the matrix, so the ratio survives
a host change even when the absolute ms do not):

| cell | 1k | 3k | 5k | 10k | 20k | 30k |
|---|---|---|---|---|---|---|
| vdom +ifr | 0.81× | 1.15× | 1.20× | 1.14× | 1.14× | 1.16× |
| vapor | 1.15× | 1.08× | 1.08× | 1.10× | 1.06× | 1.00× |
| vapor +ifr | 0.96× | 0.93× | 1.31× | 1.29× | 1.23× | 1.36× |
| **octane** | **1.60×** | **1.81×** | **1.68×** | **1.75×** | **1.76×** | **1.69×** |

This is the result that holds. Octane is a **flat ~1.6–1.8× the `vdom`
baseline across the whole ladder** — the penalty is a constant factor on
per-node work, not a term that only shows up at one size, and it has not
moved across any run.

### Bundle size (raw / gzip)

| cell | web | lynx (MT) |
|---|---|---|
| vdom | 114.4K / 39.9K | 118.3K / 48.4K |
| vapor | 137.5K / 46.9K | 141.1K / 55.3K |
| vdom +ifr | 228.7K / 79.4K | 259.0K / 111.9K |
| vapor +ifr | 257.7K / 87.7K | 293.5K / 128.4K |
| **octane** | **359.7K / 95.9K** | **357.1K / 117.9K** |

The base branch has since grown faster staging cells (`+b:c` /
`vapor-code`, `+b!` / `vapor-bang`, `+ifr:c` / `vapor-ifr-code-paint`).
They are not in the tables above — the comparison is deliberately held to
the cells Octane can be read against without extra flags, and adding them
only widens the gap.

## Reading

- **Empty first screen is Octane's best result** — it lands inside the
  `+IFR` band, which is what its architecture predicts: the main-thread
  bundle carries a purpose-built render-only renderer (`main-renderer.ts`)
  instead of a second copy of the framework runtime. Its margin over the Vue
  `+IFR` cells is inside the noise; its margin over the *non*-IFR cells
  (~20 ms, ~1.2×) is not.
- **That advantage inverts as soon as the first screen has content, and stays
  inverted at every scale.** Octane is 1.6–1.8× `vdom` from 1k all the way to
  30k. The per-node object command protocol (`{op,id,type,props}` through
  structured clone) has no template/tree registration to amortize it, where
  the Vue cells collapse repeated structure into `INSTANTIATE_TEMPLATE` /
  `REGISTER_TREE`+`CLONE_TREE`. A flat factor is the signature of exactly
  that: constant extra cost per node, no fixed overhead being amortized away.
- **The Vue IFR crossover is now visible as a curve, not a guess**: `vdom
  +ifr` is 0.81× `vdom` at 1k and 1.14–1.20× from 3k on. Painting twice pays
  off only while the first screen is small — the same double render Octane
  performs unconditionally, which is part of why its curve never comes down.
- **Bundle**: one Octane bundle carries both graphs, so it is roughly the size
  of a Vue `+IFR` build and ~3× a plain Vue build. Gzipped it is actually
  slightly *better* than `vapor +ifr` on the main-thread side (117.9K vs
  128.4K).

Interaction numbers cannot be added until Octane closes its native event loop.
