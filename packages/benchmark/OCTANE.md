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
`/guide/benchmark-unified` page, not a side document. Octane also gets a row
in that report's Coverage table, with `✓` under *first screen* only.

## Measurable cells

Two harness modes were added for this (both are framework-neutral and work for
every mode):

```bash
# first screen only: <lynx-view> attach → first content painted
node harness/cross.mjs --skip-build --startup-only --modes vdom,vapor,octane

# mount-create ladder: the app is BUILT with the table already populated
# (BENCH_AUTOROWS=N), measuring attach → all N rows painted
BENCH_AUTOROWS=1000 node harness/build-unified.mjs --skip-react --only=vdom,vapor
BENCH_AUTOROWS=1000 OCTANE_REPO=… node harness/build-octane.mjs
node harness/cross.mjs --skip-build --mount-create=1000,10000 --mount-reps 7 \
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
mount-create n=9, mode order rotated per rep. Measured on this branch's base
(`vapor` @ `7fe932b`) — the Vue cells were re-measured after each of that
branch's moves, so every number below comes from one run on one host.

### Startup — empty app, attach → first content

| cell | median | min–max |
|---|---|---|
| **octane** | **84.9 ms** | 71.9–103.0 |
| vdom +ifr | 97.0 ms | 84.0–104.6 |
| vapor +ifr | 97.0 ms | 79.5–118.6 |
| vapor | 111.5 ms | 100.8–125.1 |
| vdom | 113.2 ms | 100.6–122.2 |

**Read this one with care.** The per-sample ranges overlap, and across the
four runs this branch went through, Octane placed first three times and
third once (behind both `+IFR` cells). The honest statement is that Octane
is *at the front of the `+IFR` band* on an empty first screen, not that it
beats it by a fixed margin. The run that placed it third used a
mode-major loop; the runner now rotates mode order per rep, like the
scenario loop already did.

### Mount-create — attach → N rows painted (includes framework boot)

| cell | 1k | 10k |
|---|---|---|
| vdom | 301 ms | 1919 ms |
| vdom +ifr | 254 ms | 2226 ms |
| vapor | 313 ms | 2096 ms |
| vapor +ifr | 270 ms | 2415 ms |
| **octane** | **471 ms** | **3460 ms** |

This one is not close and did not move across any run: Octane is
1.5–1.9× the Vue cells at 1k and 1.4–1.8× at 10k.

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

- **Empty first screen is Octane's best result** — it lands at the front of
  the `+IFR` band, which is what its architecture predicts: the main-thread
  bundle carries a purpose-built render-only renderer (`main-renderer.ts`)
  instead of a second copy of the framework runtime. The margin over the Vue
  `+IFR` cells is small enough to move between runs (see the caveat above);
  the margin over the *non*-IFR cells is not.
- **That advantage inverts as soon as the first screen has content.** At 1k
  rows Octane is 1.5–1.9× the Vue cells; at 10k, 1.4–1.8× — a gap that held
  across every run, unlike the startup ordering. The per-node object
  command protocol (`{op,id,type,props}` through structured clone) has no
  template/tree registration to amortize it, where the Vue cells collapse
  repeated structure into `INSTANTIATE_TEMPLATE` / `REGISTER_TREE`+`CLONE_TREE`.
- **Note the Vue IFR crossover**: `+IFR` wins at 1k and *loses* at 10k
  (2226/2415 vs 1919/2096). Painting twice stops paying off once the first
  screen is large — the same double-render Octane performs unconditionally.
- **Bundle**: one Octane bundle carries both graphs, so it is roughly the size
  of a Vue `+IFR` build and ~3× a plain Vue build. Gzipped it is actually
  slightly *better* than `vapor +ifr` on the main-thread side (117.9K vs
  128.4K).

Interaction numbers cannot be added until Octane closes its native event loop.
