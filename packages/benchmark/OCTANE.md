# Octane in the unified matrix

[Octane](https://github.com/octanejs/octane) ships a private Lynx renderer in
`packages/lynx` (`@octanejs/lynx`, `private: true`). This adds it to the matrix
as a third framework family alongside Vue and ReactLynx.

It has **no bespoke workload**. Octane is measured through exactly the two
instruments every other cell uses:

| workload | instrument | coverage |
|---|---|---|
| `table` | `harness/cross.mjs --storms` | create / update10th / select / updateStorm / selectStorm × 1k/10k/30k |
| `content-probe` | `harness/unified-content.mjs` | FCP × 1k…30k at CPU ×1, 1k…10k at ×4 |

`harness/verify-coverage.mjs --arch octane` asserts that, and reports
`COMPLETE` (11/11 storm ops, 6/6 FCP ×1 rungs, 4/4 ×4 rungs).

Building either needs `OCTANE_REPO` pointing at an octane checkout: the package
is private and its toolchain pins a different Rspeedy major than ours, so the
sources are staged there, built with octane's own toolchain, and only the
produced bundles come back — `harness/build-octane.mjs` for the table app,
`buildOctaneContentRung` in `harness/unified-content.mjs` for the content app.

## Where it sits in the matrix

`vdom-ops-node-ifr-clone` (`externalCells()` in `vue-lynx/internal/matrix`):

```
ops/node/random-access/BTS+MTS/persistent+ephemeral/—/object-clone/always
```

Its render model is `vdom`. Octane compiles, but it does not remove the diff:
`universal-core.ts` builds a fresh `Blueprint*` tree on every render and
reconciles it against the committed `LogicalRecord` children — keyed matching,
`sameRecordShape`, topology detection, shallow prop compare
(`createPreparedTransaction`). That is a virtual-DOM update model. So Octane
does not occupy a new structural point; it lands on the coordinate `vdom +ifr`
already holds:

```
vdom +ifr  ops/node/random-access/BTS+MTS/persistent+ephemeral/—/numeric-flat/none
octane     ops/node/random-access/BTS+MTS/persistent+ephemeral/—/object-clone/always
```

**Identical in all six structural columns**, and 13× apart on `select@10k`
(58 ms vs 753 ms). That is what motivated adding the Encoding and Validation
columns: the whole difference lives in the transport, not the architecture.

## Measured against octanejs/octane#459 — and what that retracts

Before **[octanejs/octane#459](https://github.com/octanejs/octane/pull/459)**,
Octane received no native events at all on Lynx for Web and its background
thread never committed anything.

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
handshake never completed, `root.render()` never settled, no commit was ever
dispatched.

**#459 is not merged.** These numbers were taken on that branch and must be
re-taken if review changes it.

**Retractions.** Earlier revisions of this file reported a `startup` column and
a `mount-create` ladder — measurements invented for Octane while it could not be
driven. Both are withdrawn: they timed a first screen the background never
contributed to, and the "Octane leads on startup" reading they produced was an
artifact of Octane doing strictly less work. Those two runners and the
`BENCH_AUTOROWS` build variants have been removed; the matrix carries no
Octane-specific instrument.

## Results

Chromium (Playwright) + `@lynx-js/web-core`, one host, medians. Storms n=3 per
rung; FCP n=3 per rung. Octane was measured in the same session as the four Vue
comparators shown here, so each table is internally same-host.

### Interaction (`table` workload)

Ratios against `vdom`:

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

### First frame (`content-probe` FCP)

CPU ×1, ms:

| cell | 1k | 3k | 5k | 10k | 20k | 30k |
|---|---|---|---|---|---|---|
| vdom | 130 | 205 | 281 | 456 | 846 | 1292 |
| vdom +ifr | 112 | 179 | 247 | 583 | 1082 | 1538 |
| vapor | 134 | 220 | 325 | 553 | 1152 | 1536 |
| vapor +ifr | 121 | 214 | 308 | 515 | 930 | 1329 |
| **octane** | **179** | **285** | **437** | **679** | **1246** | **1590** |

CPU ×4, ms:

| cell | 1k | 3k | 5k | 10k |
|---|---|---|---|---|
| vdom | 436 | 689 | 1100 | 1966 |
| vdom +ifr | 433 | 714 | 955 | 2104 |
| vapor | 453 | 740 | 1061 | 1786 |
| vapor +ifr | 436 | 800 | 1212 | 2115 |
| **octane** | **514** | **1035** | **1606** | **2819** |

Octane / `vdom` at ×1: 1.37 · 1.39 · 1.55 · 1.49 · 1.47 · **1.23**. The gap
*narrows* at the top of the ladder rather than widening.

### Bundle (content probe, 1k rung)

| cell | web raw / gzip |
|---|---|
| vdom | 159.2K / 39.7K |
| **octane** | **355.0K / 94.9K** |

## Reading — where the time actually goes

The three results only look contradictory until you line them up by **how much
of the tree changes per operation**:

| operation | fraction of tree touched | octane vs vdom |
|---|---|---|
| `select` | one row | 13–19× |
| `update10th` | every 10th row | 10–12× |
| `create` / FCP | whole tree | 1.2–2.1× |
| `updateStorm` | every row, repeatedly | 1.11× → 0.86× |

**The penalty scales with the number of *operations*, not the number of nodes.**
Touch one row and Octane is an order of magnitude behind; touch everything and it
matches or wins. That is the signature of a fixed per-update cost, not of a slow
renderer.

- **Point updates are the weak axis.** Octane's protocol is per-node object
  commands (`{op, id, type, props}`) posted through structured clone. Changing
  one row still ships that row's node commands as fresh objects, and the receiver
  re-validates them. The Vue cells collapse the same edit into a handful of
  numbers in a flat ops array. Same visual change, wildly different message.
- **Batch updates are its strong axis** — `updateStorm@30k` is 0.86× `vdom`.
  When every node is being rewritten anyway, per-node cost stops being overhead
  and the protocol's directness pays: no diff, no template bookkeeping.
- **Create and FCP sit in between (~1.2–2×)** because creation is per-node work
  for everyone. The narrowing at 30k (1.23×) says Octane's fixed costs are being
  amortized over more nodes, not that its per-node work is getting cheaper.
- **Bundle**: ~2.2× `vdom` raw, ~2.4× gzipped on the content probe — one Octane
  bundle carries both thread graphs.

The base branch's faster staging cells (`+b:c`, `+b!`, `+ifr:c`) are left out of
these tables deliberately — the comparison is held to the cells Octane can be
read against without extra flags, and adding them only widens the gap.
