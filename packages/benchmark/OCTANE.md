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

Chromium (Playwright) + `@lynx-js/web-core`, medians; startup n=9,
mount-create n=7. Octane `main` @ `packages/lynx`, vue-lynx `vapor` branch.

### Startup — empty app, attach → first content

| cell | median |
|---|---|
| **octane** | **75.1 ms** |
| vdom +ifr | 79.6 ms |
| vapor +ifr | 83.6 ms |
| vapor | 102.4 ms |
| vdom | 106.6 ms |

### Mount-create — attach → N rows painted (includes framework boot)

| cell | 1k | 10k |
|---|---|---|
| vdom | 288 ms | 1930 ms |
| vdom +ifr | 233 ms | 2141 ms |
| vapor | 284 ms | 1887 ms |
| vapor +ifr | 251 ms | 2252 ms |
| **octane** | **433 ms** | **3228 ms** |

### Bundle size (raw / gzip)

| cell | web | lynx (MT) |
|---|---|---|
| vdom | 108.1K / 37.9K | 110.7K / 45.0K |
| vapor | 130.9K / 44.8K | 133.2K / 51.7K |
| vdom +ifr | 221.6K / 77.1K | 250.1K / 107.9K |
| vapor +ifr | 250.0K / 85.2K | 284.2K / 124.3K |
| **octane** | **359.7K / 95.9K** | **357.1K / 117.9K** |

## Reading

- **Empty first screen is Octane's best result.** It beats every Vue cell
  including `+IFR`, which is what its architecture predicts: the main-thread
  bundle carries a purpose-built render-only renderer (`main-renderer.ts`)
  instead of a second copy of the framework runtime.
- **That advantage inverts as soon as the first screen has content.** At 1k
  rows Octane is 1.7–1.9× the Vue cells; at 10k, 1.4–1.7×. The per-node object
  command protocol (`{op,id,type,props}` through structured clone) has no
  template/tree registration to amortize it, where the Vue cells collapse
  repeated structure into `INSTANTIATE_TEMPLATE` / `REGISTER_TREE`+`CLONE_TREE`.
- **Note the Vue IFR crossover**: `+IFR` wins at 1k and *loses* at 10k
  (2141/2252 vs 1930/1887). Painting twice stops paying off once the first
  screen is large — the same double-render Octane performs unconditionally.
- **Bundle**: one Octane bundle carries both graphs, so it is roughly the size
  of a Vue `+IFR` build and ~3× a plain Vue build. Gzipped it is actually
  slightly *better* than `vapor +ifr` on the main-thread side (117.9K vs
  124.3K).

Interaction numbers cannot be added until Octane closes its native event loop.
