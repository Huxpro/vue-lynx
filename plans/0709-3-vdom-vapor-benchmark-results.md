# VDOM vs Vapor on Lynx — Benchmark Results & Analysis

**Question answered:** How do Vue VDOM mode and Vue Vapor mode differ in
performance on Lynx, quantitatively?

**Method:** Port of Vue's official benchmark (`vuejs/core
packages-private/benchmark`, js-framework-benchmark derived) in
`packages/benchmark`; identical workloads (the vapor app is generated from
the vdom source with a one-attribute diff); production builds; Lynx for Web
(`@lynx-js/web-core` `<lynx-view>`) in headless Chromium via Playwright.
n = 20 samples per interaction op (2 page loads × 10), n = 10 for the 10k-row
ops; medians with 95% CIs; modes alternated across loads. Raw data:
`packages/benchmark/results/`. Reproduce with
`pnpm --filter vue-lynx-benchmark bench`.

Environment: headless Chromium (playwright-core 1.61.1), 4× Xeon 2.80GHz,
Node 22, vue 3.6.0-beta.17, vue-lynx @ c2d2102.

## Headline numbers (medians)

| op | vdom bg | vapor bg | vapor advantage (bg) | vdom e2e | vapor e2e | vapor advantage (e2e) |
|---|---|---|---|---|---|---|
| update every 10th row (1k) | 2.20 ms | 0.40 ms | **5.5× faster** | 3.60 ms | 2.10 ms | 1.7× faster |
| select row (1k) | 1.60 ms | 0.20 ms | **8.0× faster** | 2.10 ms | 0.55 ms | 3.8× faster |
| swap rows (1k) | 1.90 ms | 0.50 ms | **3.8× faster** | 2.45 ms | 1.10 ms | 2.2× faster |
| remove row (1k) | 1.65 ms | 0.40 ms | **4.1× faster** | 2.05 ms | 0.80 ms | 2.6× faster |
| create 1k rows | 13.90 ms | 19.35 ms | 0.72× (**39% slower**) | 92.3 ms | 176.2 ms | 0.52× (1.9× slower) |
| append 1k rows | 17.10 ms | 21.85 ms | 0.78× (28% slower) | 157.0 ms | 367.7 ms | 0.43× |
| create 10k rows | 155.9 ms | 229.0 ms | 0.68× (47% slower) | 1159 ms | 2037 ms | 0.57× |
| clear 10k rows | 6.50 ms | 8.95 ms | 0.73× | 1287 ms | 3126 ms | 0.41× |

`bg` = Background-Thread cost (reactivity + render/patch or renderEffects +
ShadowElement ops + JSON serialization). `e2e` = bg + cross-thread transfer +
Main-Thread applyOps with the DOM applied (web platform).

Supporting metrics:

| metric | vdom | vapor |
|---|---|---|
| ops per create-1k (payload) | 17,000 ops / 327 KB | 25,000 ops / 428 KB (+47% / +31%) |
| first screen (attach → content) | 86 ms | 111 ms (+29%) |
| JS heap after 10k rows | 103 MB | 76 MB (**−26%**) |
| bundle (lynx, gzip) | 37.8 KB | 56.0 KB (+48%) |

## The answer, in three parts

### 1. Updates — Vapor delivers exactly what it promises (4–8× BG-thread wins)

For every update-path operation (update/select/swap/remove), Vapor's
Background-Thread cost is **4–8× lower** than VDOM's. This is the
structural win of Vapor: no vnode tree re-render, no diff — a `select`
re-runs 1,000 tiny class-binding render effects in 0.2 ms where VDOM
re-renders and diffs 1,000 row vnodes in 1.6 ms. Both modes emit the same
minimal ops stream for these operations (1–2 ops), so the entire delta is
framework CPU — the component of cost that is engine-agnostic and will
transfer to native Lynx (PrimJS BG thread), where CPU is typically scarcer
than in desktop V8. On update-heavy, long-lived screens Vapor's advantage is
decisive and its lower retained heap (−26% at 10k rows: no vnode tree kept
alive) compounds it.

### 2. Creation — was 28–47% slower; largely FIXED by only-child text aliasing

**Update (same day):** the highest-leverage fix below — routing an element's
only-child #text to the host element instead of materializing a separate
Main-Thread text node (with lazy materialization if the host ever gains
siblings) — is now implemented in `ShadowElement.cloneNode`. Results
(`results/run2-text-aliasing.*`, 2 loads, same methodology):

| metric | before | after |
|---|---|---|
| create1k ops (vapor vs vdom) | 25,000 vs 17,000 (+47%) | **17,000 vs 17,000 (parity)** |
| create1k payload | 428 KB vs 327 KB | **329 KB vs 327 KB** |
| create1k e2e gap | 1.9× slower | **1.10× slower** |
| append1k e2e gap | 2.3× slower | **1.00× (parity)** |
| create10k e2e gap | 1.76× slower | **1.11× slower** |
| clear10k e2e gap | 2.4× slower | **0.95× (parity)** |
| create1k bg gap | 1.39× slower | 1.24× slower |

**Second update: `CLONE_TEMPLATE` is now implemented too.** The opcode set
is vue-lynx's own protocol (the Main-Thread interpreter ships in the same
bundle as the BG code — no engine dependency, no version skew), so there was
no real blocker. `REGISTER_TEMPLATE` sends a template's static structure
once; each instance is a single `CLONE_TEMPLATE [tplId, baseUid]`, with
element ids assigned by a deterministic pre-order contract on both sides.
Results (`results/run3-clone-template.*`):

| metric | vdom | vapor (before) | vapor (now) |
|---|---|---|---|
| create1k ops | 17,000 | 17,000 | **7,000 (−59%, 2.4× fewer than vdom)** |
| create1k payload | 327 KB | 329 KB | **160 KB (−51% vs vdom)** |
| create10k payload | 3.50 MB | 3.52 MB | **1.69 MB** |
| create1k e2e | — | 0.91× | 0.89× (≈unchanged) |
| create1k bg | — | 0.81× | 0.81× (≈unchanged) |

Honest read: on the **web harness**, e2e didn't move further because the
Main-Thread cost is dominated by actual DOM element construction, which
CLONE_TEMPLATE doesn't reduce — it eliminates op dispatch + JSON volume.
The −51% cross-thread payload matters most where transfer and parsing are
comparatively expensive (native serialization, PrimJS JSON) and unlocks a
native mapping to `__CloneElement`/element templates later. The residual
~20% bg gap is runtime-vapor's clone+per-binding-renderEffect mount cost
itself.

The original analysis (pre-fix) follows for the record.

Vapor loses the creation benchmarks in this port today. The ops-stream
telemetry pinpoints why: creating the same 1k rows sends **25,000 ops
(428 KB) in Vapor vs 17,000 ops (327 KB) in VDOM**. This is not intrinsic
to Vapor (in the browser, upstream Vapor *wins* creation benchmarks); it is
the cost model of vue-lynx's current Vapor implementation:

- Vapor mounts by `cloneNode(true)` on a parsed template prototype. Our
  clone emits CREATE + attribute ops **plus one INSERT per template edge**,
  and the row's text placeholders are first created with template content
  and then overwritten by the interpolation renderEffects (an extra
  SET_TEXT per binding). VDOM's renderer builds the same subtree with fewer,
  more targeted ops.
- Higher ops volume also inflates e2e linearly: +31% payload → +91% e2e at
  create-1k, because Main-Thread apply and (on web) DOM insertion dominate.

Follow-up optimizations that would close or flip this gap, in order of
leverage: (a) emit a single composite `CLONE_TEMPLATE` op per row instance
(the MT already has the template shape after the first instance) — this
would cut per-row ops by ~3×; (b) skip SET_TEXT for placeholder text nodes
that a renderEffect immediately overwrites; (c) batch INSERTs for detached
subtree assembly into the parent CREATE.

### 3. Startup & size — was pay-for-both; FIXED by the pure Vapor entry

**Third update:** the composite `with-vapor` entry shipped both runtimes for
an interop scenario vue-lynx does not support. Upstream's model is a single
'vue' entry disambiguated by tree-shaking (lazy `ensureRenderer`,
`sideEffects: false`, 123 PURE annotations in runtime-vapor); ours couldn't
tree-shake because the vdom renderer was created at module scope and the
package declared no `sideEffects`. Since the mode is a per-app build-time
decision, the fix is two pure entries: `vue-lynx` (vdom only) and
`vue-lynx/vapor-app` (Vapor only — shared runtime-core surface + Lynx
utilities + Vapor helpers, no `createRenderer`). `with-vapor` is now a
deprecated alias of `vapor-app`; the vdom renderer is created lazily and the
package declares its side-effectful modules. Results
(`results/run4-pure-vapor-entry.*`):

| metric | before (composite) | after (pure entry) |
|---|---|---|
| bundle gzip (lynx) | 56.0 KB (+48% vs vdom) | **49.3 KB (+26%)** |
| first screen | +29% (111 vs 86 ms) | **+3% (125.8 vs 121.7 ms — CIs overlap)** |
| interaction / ops metrics | — | unchanged (no regression) |

The remaining +26% is `@vue/runtime-vapor` itself plus the
`@vue/runtime-dom` shared infra it imports and our DOM-compat layer
(shim + template parser) — the real cost of Vapor on Lynx, no longer an
artifact of packaging. (Observed in passing: the vdom bundle moved
37.8 → 39.2 KB gzip from the entry-split indirection — noise-level, noted
for the record.) The original analysis follows.

The `with-vapor` entry used to ship **both** runtimes (the vdom custom
renderer plus `@vue/runtime-vapor` + the `@vue/runtime-dom` shared infra it
imports), hence +48% gzip bundle and +29% first-screen at the time.

## Caveats

- **Harness is Lynx for Web, not a device.** e2e includes Chromium DOM costs
  rather than native layout; PrimJS (native BG engine) is slower than V8, so
  the *relative* BG-thread wins (the 4–8×) should hold or widen on device,
  but absolute times will differ. The scenario auto-runs on mount, so the
  same bundles can be loaded in LynxExplorer to repeat the measurement on
  hardware.
- Sub-millisecond e2e medians (select/swap/remove) sit near timer/ack
  granularity; their CIs are wide. The bg medians are tight (CI95 < 15%).
- Both apps disable options API; production mode; identical templates.
- Event dispatch overhead is excluded by design (identical in both modes —
  same sign registry); krausest-style click-to-paint would add a constant.

## A bonus finding: the benchmark caught a real leak

The first benchmark runs degraded catastrophically across 10k-row
create/clear cycles (vdom: 1.2 s → 27 s; vapor: 4.5 s → 162 s per create).
Root cause: the Main-Thread `elements` registry never released removed
subtrees (BG only sends REMOVE for subtree roots), so every cycle retained
40k+ detached elements with mounting GC pressure. Fixed in
`element-registry.ts`/`ops-apply.ts` with batch-end subtree release
(deferred so same-batch REMOVE+INSERT moves — KeepAlive, Teleport — keep
their elements), with regression tests in
`packages/upstream-tests/src/mt/`. Post-fix, heavy ops are stable across
iterations (create10k CI95 ±3% of median).

## Bottom line

> On Lynx today, **Vapor is unambiguously faster where Vapor was designed
> to be faster** — steady-state updates (4–8× lower BG-thread cost, ~2–4×
> lower end-to-end latency) with ~26% lower retained memory. After the
> only-child text-aliasing fix, **creation is at ops parity** (17,000 ops
> for both modes) and end-to-end creation is within ~10% of VDOM
> (append/clear at parity); the remaining ~20% BG-thread creation gap and
> the +48% bundle size (composite entry ships both runtimes) are the two
> known, bounded costs — both with identified fixes (composite
> CLONE_TEMPLATE op; pure-Vapor entry).
