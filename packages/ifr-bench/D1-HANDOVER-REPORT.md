# D1 — IFR handover: stream vs tree (preliminary)

**Date**: 2026-07-31
**Design**: `plans/0731-1-rl-render-to-opcodes-insights.md` §5–§8
**Cells**: `vapor +b +ifr:h` (`vapor-data-block-ifr-tree`), `vdom +ifr:h`
(`vdom-ops-node-ifr-tree`), plus the `vdom +b +ifr:h` interaction probe
**Host**: cloud agent, headless Chromium 1194 (Lynx for Web) + Node/jsdom PAPI
**Flag**: `ifrHandover: 'stream' | 'tree'` (default `stream` — nothing shipped
changes until the data says so)

---

## 0. What moved

Only the Handover column. The durable tree, the paint staging, the naming, the
delivery and the MT driver are byte-identical between each pair; hydration
changes from *frame-by-frame equality against a recorded op stream* to
*structural adoption of the painted elements* (`main-thread/src/ifr-tree.ts`).

## 1. Ops-level microbench — the decisive measurement

The browser harness cannot resolve this factor: first paint happens inside
`renderPage`, **before** any hydration runs, so both handovers paint the same
frame. `packages/testing-library/src/__tests__/ifr-handover-bench.test.ts`
measures the part that actually differs. 60 cards × 51 nodes (ops scene) /
60 template instances (template scene); native PAPI calls are exact, wall time
is the median of 3.

Native PAPI calls during hydration:

| scene (naming) | divergence | stream | tree | Δ |
|---|---|---:|---:|---:|
| ops (**node**) | identical | 3,060 | 3,060 | 0 |
| ops | append (suffix) | 3,314 | 3,314 | 0 |
| ops | **middle** | 15,300 | 3,142 | **−79%** |
| template (**block**) | identical | 120 | 120 | 0 |
| template | append (suffix) | 249 | 249 | 0 |
| template | **middle** | 7,804 | 125 | **−98%** |

Hydration wall time (ms, median of 3):

| scene | divergence | stream | tree |
|---|---|---:|---:|
| ops | identical | 22.5 | 36.8 |
| ops | middle | 70.9 | 31.4 |
| template | identical | 0.8 | 0.8 |
| template | middle | 30.6 | 2.9 |

Adoption rate (painted block roots claimed): 3,060/60 and 60/60 on `identical`;
**3,058/60 and 60/60 on `middle`** — the one-step lookahead in `matchTrees`
keeps the suffix after a divergence instead of sacrificing it.

Three readings, in order of importance:

1. **Stream handover already handles two of the three divergence classes.**
   Value-only differences it patches in place; a pure *suffix* append is a
   strict prefix of the recorded stream and applies verbatim. Both handovers
   are identical there. The class it cannot absorb is **mid-stream structural
   divergence** — a `v-if` that flipped, a list whose middle item differs, an
   async component that resolved between the two renders — and that is where
   the whole difference lives.
2. **On that class, divergence stops being a page rebuild.** −79% native calls
   on the ops scene, −98% on the template scene, and the wall time follows
   (−56% / −90%).
3. **The happy path costs something on node-named streams.** +14 ms on 3,060
   nodes (≈4.6 µs/node) for ops staging; **zero** for template staging, whose
   adoption walk has one entry per template instance rather than per node.

The `identical` baseline of 3,060 / 120 calls is the deferred
selector-attribute commit (`commitIfrSelectorAttributes`) that **both**
handovers pay — it is paint work billed at hydration time, not hydration work.

## 2. Browser FCP — no effect, as designed

Lynx for Web, same-source SFC probe, 1,004 elements. Pooled over 3 runs ×11
(×1) and 2 runs ×9 (×4); medians in ms.

| cell | ×1 (n=33) | ×4 (n=18) |
|---|---:|---:|
| `content-vdom` | 161.7 | 585.7 |
| `content-vdom-ifr` | 134.6 | 513.9 |
| `content-vdom-ifr-tree` | 137.5 | 505.9 |
| `content-vapor` | 167.5 | 539.8 |
| `content-vapor-ifr` | 147.2 | 566.7 |
| `content-vapor-ifr-tree` | 148.6 | 560.0 |

tree vs stream: **+2.2% / +1.0% at ×1, −1.6% / −1.2% at ×4** — sign-inconsistent
across throttles and well inside the p25–p75 spread (~10 ms at ×1). Read as
*no FCP effect*, which is what the design predicts: the paint is identical and
happens before hydration exists.

IFR itself reproduces its known effect on this scene: −16.8% (vdom) / −12.1%
(vapor) at ×1, and the familiar ×4 inversion for vapor (+5.0%).

## 3. Naming × Handover — a confirmed interaction

The microbench predicted that the tree walk is priced per *named node*, so
block naming should make it free. Testing it needs a cell where only the naming
differs, so the same handover was built on `vdom +b` (Code-Template, block
named) and measured against `vdom` (op stream, node named).

Post-paint gap (`settled − fcp`, ×4 CPU, n=18, ms):

| cell | naming | p25 | **p50** | p75 |
|---|---|---:|---:|---:|
| `content-vdom-ifr` | node | 0.5 | 1.6 | 4.0 |
| **`content-vdom-ifr-tree`** | **node** | 30.0 | **46.1** | 58.4 |
| `content-vdom-ifr-et` | block | 0.7 | 1.5 | 4.2 |
| **`content-vdom-ifr-et-tree`** | **block** | 1.1 | **2.1** | 4.6 |
| `content-vapor-ifr` | block | 0.8 | 1.2 | 2.0 |
| **`content-vapor-ifr-tree`** | **block** | 0.6 | **1.7** | 2.4 |

Same handover, same scene, same host: **46 ms under node naming, +0.5 ms under
block naming.** The Naming column does not merely pay for itself in JS memory
and wire constants (`GRAPH-ENG-REPORT.md` §6) — it is what makes structural
hydration affordable at all. This is the first measured cross-column
interaction in the matrix, and it is large.

It also confirms the reverse-inspiration claim in
`plans/0731-1-rl-render-to-opcodes-insights.md` §I5 from the other direction:
block naming is what keeps an id-transplant table proportional to template
instances instead of to nodes.

## 4. Bundle size

`ifr-tree.ts` is unconditionally imported by `ifr.ts`, so both handovers carry
it; the cost is versus pre-D1, measured by rebuilding the same cells with the
module removed.

| cell | MT gzip before | after | Δ |
|---|---:|---:|---:|
| `content-vapor-ifr` | 50,090 | 52,649 | **+2,559 B (+5.1%)** |
| `content-vdom-ifr` | 37,654 | 40,250 | **+2,596 B (+6.9%)** |

(Selecting `stream` does not shrink it — the module is reachable either way.
Making it tree-shakable behind the define is a follow-up worth ~2.5 KB for
builds that stay on stream.)

## 5. Verdict and recommendation

- **Ship `tree` as the default for block-named cells** (`vapor +b` — the
  product default — and `vdom +b`): the happy path is free within measurement
  error, and mid-stream divergence stops costing a page rebuild.
- **Keep `stream` as the default for `vdom` op staging** until either the
  driver work (D2/D5) or a naming change lands: ~46 ms of post-paint work at
  ×4 on a 1,004-element screen is not worth paying for a divergence class that
  well-behaved apps rarely hit.
- **The determinism constraint can be relaxed only on tree-handover builds.**
  `website/docs/guide/ifr.mdx` must say so per cell rather than globally.

## 6. Non-claims

- **One scene.** All of this is the 1,004-element content probe. List-heavy and
  deeply-nested first screens are unmeasured.
- **List children are never adopted** — native list ownership rides on
  `update-list-info`/enqueue callbacks that adoption would bypass, so a list
  parent degrades to "rebuild its children" by design. A list-heavy first
  screen will not show the §1 wins.
- **`+b:c` (INSTANTIATE_BOUND_TEMPLATE) is not adopted** when the bound entry
  is unavailable at match time (block size unknown → not adoptable). Safe, but
  it means the `+b:c` cell currently gets stream-like behavior under `tree`.
- **The upstream vue-core suites did not run** in this container (no `core/`
  checkout): `pnpm --filter vue-lynx-upstream-tests test` / `test:dom` /
  `test:vapor` are unverified here. testing-library (473) and upstream `local`
  (130) are green.
- **`transition-leak-repro.test.ts` is timing-fragile under load** (fake timers
  + `advanceTimersByTimeAsync`). It flaked while the microbench was oversized;
  it is stable at the shipped bench size, but the fragility is pre-existing and
  independent of D1.
- **Wall times are single-host medians** on a shared cloud agent. The native
  call counts are exact and load-independent — prefer them.
