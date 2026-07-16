# IFR Strategy Benchmark Report

**Date**: 2026-07-11
**Question**: How much first-frame time does each IFR implementation strategy cost/save, and is the compile-time snapshot-lowering direction (ReactLynx-style) worth pursuing for Vue Lynx?

## TL;DR

| | verdict |
|---|---|
| Current IFR (`ifr-replay`) | Its JS cost ≈ the whole classic pipeline's JS cost. Its win is **when** the frame paints (at `loadTemplate`, skipping BG boot + IPC), not **how much** JS runs. |
| Direct PAPI (route #2) | −25–40% render time. Real, but the smallest structural win. |
| Static-island templates (route a) | 10× on static-heavy screens; fades to −25% when holes interleave (template-level static coverage 37%/12% on the content/list scenes). |
| **Block templates + holes/slots (route b/Q2)** | **7–15× faster than current IFR on every scene shape**, and shrinks the ops protocol by 3–1000×. The best effort/reward on the table. |
| Vapor-style no-vdom (route c/Q1) | Another ~2–3× beyond block templates, ~at the straight-line PAPI floor. The endgame, but requires a hydration-protocol rewrite. |

All variants produce byte-identical rendered documents (21/21 correctness checks, modulo bookkeeping attributes and invisible fragment anchors — see Methodology).

## What was measured

Seven strategies render the same logical first screens through the same PAPI surface:

| variant | what it is | fidelity |
|---|---|---|
| `bg-baseline` | No IFR: BG render → ops → JSON → interpreter apply | **real shipped code** |
| `ifr-replay` | Current IFR: MT mount, ops recorded + interpreted locally | **real shipped code** |
| `ifr-direct` | Route #2: same vdom walk; ops recorded but applied through element handles at emit time (no interpreter pass, no id-map lookups) | prototype |
| `ifr-static-tpl` | Route (a): fully-static islands compiled to straight-line `create()` fns (`<sta-N>` tags); everything else = direct | prototype (island analysis on the scene DSL) |
| `ifr-block-tpl` | Route (b)/Q2: whole blocks lowered to skeleton templates with holes + slots; vdom exists only at block granularity (one vnode per block, one prop per hole) | prototype |
| `ifr-vapor` | Route (c)/Q1 upper bound: no vdom; skeleton fns + per-hole closure application | prototype (omits Vapor's reactive-effect bookkeeping → slightly optimistic) |
| `papi-floor` | One generated straight-line function — the absolute floor | reference |

Scenes (generated from one DSL so every variant renders the same tree; sizes: small ≈ 200–300 elements, large ≈ 1000–1400 elements):

- **static-heavy** — landing/skeleton screen; template-level static coverage **99.7%** (route a's best case)
- **content** — card feed with a dynamic class + two dynamic texts per card; coverage **37%** (the "skeleton with interleaved holes" shape)
- **list** — v-for screen, 3 dynamic parts per item; coverage **12%** (per unique template node)

Engines: Node V8 (≈ web-platform main thread) and **`node --jitless`** (interpreter-only, the closest available proxy for PrimJS/Lepus). PAPI backend for timing is a counting stub (isolates framework JS cost); the correctness oracle runs every variant against the real `@lynx-js/testing-environment` jsdom PAPI.

## Results

### Warm median render time, `--jitless`, large scenes (~1000+ elements) — closest proxy for native Lepus

| variant | static-heavy | content | list |
|---|---|---|---|
| bg-baseline | 11.86 ms | 9.36 ms | 6.87 ms |
| ifr-replay (current) | 10.94 ms | 8.40 ms | 6.57 ms |
| ifr-direct | 8.17 ms | 6.36 ms | 4.89 ms |
| ifr-static-tpl | 1.11 ms | 5.29 ms | 4.00 ms |
| **ifr-block-tpl** | **0.74 ms** | **1.26 ms** | **1.44 ms** |
| ifr-vapor | 0.53 ms | 0.55 ms | 0.46 ms |
| papi-floor | 0.54 ms | 0.39 ms | 0.31 ms |

### Cold first run, `--jitless`, large — the number that models a device's one-shot first frame

| variant | static-heavy | content | list |
|---|---|---|---|
| ifr-replay (current) | 18.0 ms | 16.4 ms | 11.7 ms |
| ifr-direct | 14.0 ms | 12.3 ms | 8.7 ms |
| ifr-static-tpl | 5.0 ms | 10.4 ms | 8.1 ms |
| **ifr-block-tpl** | **4.2 ms** | **5.3 ms** | **4.9 ms** |
| ifr-vapor | 1.4 ms | 1.2 ms | 0.8 ms |

### V8 (web platform proxy), large, warm median

| variant | static-heavy | content | list |
|---|---|---|---|
| bg-baseline | 6.72 ms | 5.04 ms | 3.40 ms |
| ifr-replay | 6.15 ms | 4.33 ms | 2.67 ms |
| ifr-direct | 3.76 ms | 2.65 ms | 1.57 ms |
| ifr-static-tpl | 0.88 ms | 2.37 ms | 1.72 ms |
| ifr-block-tpl | 0.54 ms | 1.08 ms | 1.25 ms |
| ifr-vapor | 0.32 ms | 0.33 ms | 0.17 ms |
| papi-floor | 0.39 ms | 0.22 ms | 0.13 ms |

### Protocol size (ops payload the BG thread would ship / the IFR render records), large

| variant | static-heavy | content | list |
|---|---|---|---|
| replay / baseline | 77.6 KB (16,075 frames) | 60.4 KB (12,048) | 45.1 KB (9,656) |
| static-tpl | 5.7 KB (1,462) | 44.1 KB (9,673) | 36.3 KB (8,256) |
| **block-tpl** | **69 B (15)** | **9.2 KB (1,515)** | **17.1 KB (3,823)** |

PAPI call counts drop only ~5–20% across the ladder (4.8k–6.2k → 3.0k–4.8k): the native element work is a shared floor; what the lowered strategies eliminate is the *framework JS around it* — and, for block templates, almost the entire cross-thread protocol. That protocol shrink benefits the **normal non-IFR pipeline and every update** too, not just the first frame.

## Analysis

1. **The current replay IFR does not reduce JS work — it relocates it.** `ifr-replay` ≈ `bg-baseline` in pure JS time (the JSON round-trip it saves is small next to vdom + interpreter). Its entire first-frame win on device comes from painting during `loadTemplate` instead of after BG boot + bundle eval + IPC — which this benchmark can't measure but which is additive on top of `bg-baseline`'s numbers. That win is real but was never about JS throughput; these results quantify what the *next* level costs.

2. **Route #2 (direct PAPI) is worth more under an interpreter than estimated analytically** (−25–40% vs −10% guessed): in `--jitless`, the eliminated second walk + per-op Map lookups + arg re-boxing are material. Still the smallest structural step on the ladder.

3. **Static islands (route a) are shape-fragile.** 10× on the 99.7%-static screen, but only −17…−37% on realistic interleaved shapes (content/list) — exactly the fragmentation weakness predicted. Its artifacts (template format, generated `create()` fns, INSTANTIATE op) are all reusable by route b, so it's a stepping stone, not a destination.

4. **Block templates (route b/Q2) are the inflection point.** 7–15× vs current IFR on every shape, ~3–4× better cold, and the recorded/shipped protocol collapses (69 bytes for a 1,400-element static-heavy screen). This is the ReactLynx-snapshot insight transplanted onto Vue's block structure — and it keeps both threads running the same code, so the existing deterministic-ops hydration protocol survives unchanged.

5. **Vapor-style (route c/Q1) buys another 2–3× over block templates and sits essentially at the floor** — but requires the structural-adoption hydration rewrite and inherits Vapor's feature gaps. Its *unique* wins beyond block-tpl are the MT bundle size (drops `runtime-core`) and update-path reactivity, neither measured here.

6. **Bundle-size dimension** (from the shipped hello-world builds): enabling current IFR grows `main.lynx.bundle` 83.3 KB → 168.7 KB (the MT copy of Vue runtime + app). Routes a/b don't change this materially; route c would remove most of the Vue-runtime share; MT-DCE (route #1, not benchmarked — it's a bundle lever, not a render lever) claws back the app-code share.

## Recommendation

1. **Productionize route b (block templates + holes/slots)** via route a's infrastructure as the stepping stone: template format + `INSTANTIATE_TEMPLATE` op + `insertStaticContent` first, then the block-level compiler transform. Protocol unchanged, all shapes win ~an order of magnitude, and the normal pipeline's payload shrinks alongside.
2. Fold **route #2's direct-apply** into that work (block-tpl already implies handle-based application at instantiation sites); as a standalone project it is superseded.
3. Keep **route c (Vapor)** as the tracked endgame gated on upstream Vapor maturity; revisit once (b) lands and structural-adoption hydration is needed anyway for `firstScreenSyncTiming: 'jsReady'`.

## Caveats

- `--jitless` V8 is a proxy for PrimJS, not PrimJS: interpreter designs differ (inline caches, property access costs). Ratios are more trustworthy than absolute milliseconds; on-device Lynx traces should confirm before large investments.
- `bg-baseline` excludes BG thread boot, bundle evaluation, and IPC latency — on device those add tens of ms to the no-IFR first frame, in *favor* of every IFR variant.
- The counting-stub PAPI makes native element work ~free; on device, element creation/layout adds a shared constant to every variant (PAPI call counts above bound that term: the lowered variants also make 5–20% fewer PAPI calls).
- `ifr-direct` / `-static-tpl` / `-block-tpl` / `-vapor` are benchmark prototypes sharing semantics with the shipped interpreter, verified by rendered-output equality — not production integrations. `ifr-vapor` omits Vapor's reactive-effect re-tracking bookkeeping (slightly optimistic).
- Correctness normalization strips `vue-ref-N` bookkeeping attributes (intentionally absent on anonymous static nodes in the lowered designs) and empty `<text></text>` fragment anchors (invisible placeholders the lowered variants don't need).

## Reproduce

```bash
pnpm --filter vue-lynx-ifr-bench run check   # correctness oracle (jsdom)
pnpm --filter vue-lynx-ifr-bench run bench   # full matrix → results/results.json
node run.mjs --quick                         # fast pass
```
