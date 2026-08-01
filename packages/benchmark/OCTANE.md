# Octane in the unified matrix

[Octane](https://github.com/octanejs/octane) ships a private Lynx renderer in
`packages/lynx` (`@octanejs/lynx`, `private: true`). This adds it to the matrix
as a third framework family alongside Vue and ReactLynx.

## What is measured, and against which build

**Everything.** Create, update, select, both storms, startup, the mount-create
ladder and bundle sizes — the same coverage the Vue cells get.

That required an upstream fix. Measured against
**[octanejs/octane#459](https://github.com/octanejs/octane/pull/459)**
(`fix/lynx-web-cross-realm-messages`, on top of `0c191830`), which is not yet
merged. Numbers must be re-taken once it lands, in case review changes it.

### The bug that blocked this, and why it matters for reading old numbers

Before #459, Octane received **no native events at all** on Lynx for Web, and
its background thread never committed anything.

The two Lynx threads are separate JavaScript realms on web — the background runs
in an iframe — so an object sent from the background carries the *iframe's*
`Object.prototype`. Octane's message validators tested realm-local identity:

```ts
const prototype = Object.getPrototypeOf(value);
if (prototype !== Object.prototype && prototype !== null) {
  return fail(label, 'must be a plain object.');   // core/protocol.ts
}
```

so the main thread rejected **every** message the background sent. The readiness
handshake never completed, `root.render()` never settled, and no commit was ever
dispatched. Two separate symptoms fell out of that one cause: a blank first
screen in engine mode, and taps that reached Octane's receiver and then died.

Consequence for anything published earlier: **the Octane mount-create figures
this repo published before this run measured main-thread-only first-screen
paint**, because the background contributed nothing. They are superseded by the
tables below, and the startup ordering they reported is retracted (see below).

Found by bisect + instrumented browser runs from here; diagnosed to the realm
check and fixed upstream by a parallel session. A local harness that mounts a
built bundle through `@lynx-js/web-core` and drives a real click is what made
all of it observable — Octane's own event tests call `dispatchNativeEvent`
directly, which bypasses the engine, the handshake and the validator alike.

## Method

```bash
# storms: octane + its four Vue comparators, one same-host session
node harness/cross.mjs --skip-build --storms --storm-sizes 1k,10k,30k \
  --storm-reps 3 --label octane-web \
  --modes vdom,vdom-ifr,vapor,vapor-ifr,octane

# first screen: rebuild every rung, then measure
for N in 1000 3000 5000 10000 20000 30000; do
  BENCH_AUTOROWS=$N node harness/build-unified.mjs --skip-react \
    --only=vdom,vdom-ifr,vapor,vapor-ifr
  BENCH_AUTOROWS=$N OCTANE_REPO=… node harness/build-octane.mjs
done
node harness/cross.mjs --skip-build --mount-reps 7 \
  --mount-create=1000,3000,5000,10000,20000,30000 \
  --modes vdom,vdom-ifr,vapor,vapor-ifr,octane
node harness/cross.mjs --skip-build --startup-only --startup-count 11 \
  --modes vdom,vdom-ifr,vapor,vapor-ifr,octane

node harness/synthesize.mjs      # → results/unified/{latest.json,report*.html}
```

`BENCH_AUTOROWS` builds use `buildDataSeeded` (index-derived labels): those rows
render during the first screen, so under IFR both threads build the data
themselves and `Math.random()` would make every row a hydration mismatch.

Octane's shipped Rspeedy path always paints the first screen on the main thread
(`installLynxMainThread({ firstScreen: true })`, no plugin option to disable),
so the `+ifr` cells are the closest Vue comparators on the first-screen
workload. Storms are post-mount and compare against everything.

## Results

Chromium (Playwright) + `@lynx-js/web-core`, medians. Storms n=3 per rung,
mount-create n=7 per rung, startup n=11, mode order rotated per rep. One host.

### Interaction — the headline

Ratios against `vdom`, the plainest cell in the matrix:

| op | 10k | 30k |
|---|---|---|
| `select` (point) | **13.1×** | **19.1×** |
| `update10th` (point) | **10.0×** | 11.6× |
| `create` | 2.05× | 1.93× |
| `selectStorm` | 2.07× | 1.98× |
| `updateStorm` (batch) | 1.11× | **0.86×** |

Absolute medians, ms:

| op | vdom | vdom +ifr | vapor | vapor +ifr | **octane** |
|---|---|---|---|---|---|
| create@10k | 1409 | 1338 | 1345 | 1357 | **2891** |
| create@30k | 4752 | 4614 | 4713 | 4138 | **9192** |
| select@10k | 58 | 58 | 34 | 38 | **753** |
| select@30k | 196 | 214 | 146 | 144 | **3752** |
| update10th@10k | 98 | 94 | 57 | 65 | **978** |
| update10th@30k | 366 | 356 | 308 | 292 | **4243** |
| selectStorm@10k | 628 | 628 | 65 | 60 | **1299** |
| selectStorm@30k | 2715 | 2694 | 288 | 245 | **5363** |
| updateStorm@10k | 1422 | 1334 | 655 | 702 | **1575** |
| updateStorm@30k | 6801 | 6674 | 5018 | 3872 | **5865** |

**The penalty is shape-dependent, not a flat factor.** Octane is an order of
magnitude behind on *point* updates, ~2× on create, and at 30k batch updates it
is **faster than vdom** (0.86×). Against `vapor` the point gap is wider still —
22× on `select@10k` — which is what vapor's targeted updates predict.

### First screen — startup (empty app)

| cell | median | min–max |
|---|---|---|
| vdom +ifr | 81.8 ms | 72–99 |
| vapor +ifr | 87.2 ms | 78–95 |
| vapor | 96.9 ms | 90–120 |
| vdom | 97.5 ms | 86–131 |
| **octane** | **108.7 ms** | 93–124 |

**This retracts an earlier claim.** Before #459 this repo reported Octane at or
near the front of this column. That was an artifact: the background never
committed, so Octane was being timed doing strictly less work than every Vue
cell. With the handshake actually completing, Octane is **last**. The ranges
still overlap the two non-IFR Vue cells, so read it as "at the back of the
pack", not as a precise margin.

### First screen — mount-create ladder (attach → N rows painted, incl. boot)

| cell | 1k | 3k | 5k | 10k | 20k | 30k |
|---|---|---|---|---|---|---|
| vdom | 250 ms | 541 ms | 856 ms | 1595 ms | 3031 ms | 4597 ms |
| vdom +ifr | 213 ms | 597 ms | 978 ms | 1757 ms | 3383 ms | 5107 ms |
| vapor | 275 ms | 549 ms | 888 ms | 1673 ms | 3124 ms | 4809 ms |
| vapor +ifr | 221 ms | 510 ms | 1104 ms | 1965 ms | 3686 ms | 5652 ms |
| **octane** | **436 ms** | **979 ms** | **1495 ms** | **2837 ms** | **5477 ms** | **8312 ms** |

Normalized to `vdom` — the ratio survives a host change even when absolute ms do
not:

| cell | 1k | 3k | 5k | 10k | 20k | 30k |
|---|---|---|---|---|---|---|
| vdom +ifr | 0.85× | 1.10× | 1.14× | 1.10× | 1.12× | 1.11× |
| vapor | 1.10× | 1.02× | 1.04× | 1.05× | 1.03× | 1.05× |
| vapor +ifr | 0.88× | 0.94× | 1.29× | 1.23× | 1.22× | 1.23× |
| **octane** | **1.74×** | **1.81×** | **1.75×** | **1.78×** | **1.81×** | **1.81×** |

Flat ~1.75–1.81× across the whole ladder: a constant per-node cost, not an
overhead that amortizes. (The pre-#459 run showed the same flat shape at
1.60–1.81×, which in hindsight was main-thread paint alone — the fix moved the
absolute numbers, not the shape.)

### Bundle size (raw / gzip)

| cell | web | lynx (MT) |
|---|---|---|
| vdom | 114.4K / 39.9K | 118.3K / 48.4K |
| vapor | 137.5K / 46.9K | 141.1K / 55.3K |
| vdom +ifr | 228.7K / 79.4K | 259.0K / 111.9K |
| vapor +ifr | 257.7K / 87.7K | 293.5K / 128.4K |
| **octane** | **368.1K / 99.0K** | **365.8K / 121.4K** |

## Reading

- **Point updates are the weak axis, by an order of magnitude.** Octane's
  per-node object command protocol (`{op,id,type,props}` through structured
  clone) re-ships whole-node commands for every update. There is no equivalent
  of the tiny op payload the Vue cells collapse a point update into, and nothing
  to amortize when only one row changes.
- **Batch updates are its strong axis** — `updateStorm@30k` is 0.86× `vdom`.
  When every node is being touched anyway, per-node cost stops being overhead
  and the protocol's directness pays. This is the one place Octane wins.
- **Create and mount-create sit at a flat ~1.8×.** Same cause as the point-update
  gap, but diluted: creation is per-node work for everyone, so the constant
  factor shows up as a constant factor rather than an order of magnitude.
- **Startup is now its worst first-screen result, not its best** — see the
  retraction above. The main-thread bundle does carry a purpose-built
  render-only renderer rather than a second framework runtime, which is a real
  design advantage; it is just not worth what the background handshake and
  adoption cost on this host.
- **Bundle**: one Octane bundle carries both graphs — roughly a Vue `+ifr`
  build, ~3× a plain Vue build, though gzipped it is still slightly better than
  `vapor +ifr` on the main-thread side (121.4K vs 128.4K).

The base branch's faster staging cells (`+b:c`, `+b!`, `+ifr:c`) are left out of
these tables deliberately — the comparison is held to the cells Octane can be
read against without extra flags, and adding them only widens the gap.
