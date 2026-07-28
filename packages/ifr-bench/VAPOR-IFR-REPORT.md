# Vapor IFR Route C report

**Date:** 2026-07-16  
**Implementation:** `pluginVueLynx({ vapor: true, enableIFR: true })`

> **2026-07-16 review addendum.** A take-over review found that the first
> frame silently crashed into fallback on every Lynx-for-Web run, so this
> report's original "Browser FCP" section measured a broken IFR. See
> [Review addendum](#review-addendum-2026-07-16) for the root cause, the fix,
> and the corrected same-source browser matrix (~1,000 elements, IFR now
> −14% FCP at 1× instead of the mixed result below).

## Executive result

Route C is implemented with deterministic replay and an explicit Background-to-Main completion handshake. A real built Vapor SFC paints 10 nodes inside `renderPage()`, hydrates to the same 10-node tree, keeps scoped CSS and event signs aligned, and accepts reactive updates from the Background Thread without duplicate nodes or listeners.

Correctness is production-shaped: the Main Thread runs the actual compiler-vapor output, Vapor runtime, template protocol, recorder, and PAPI interpreter. The 24-case jsdom oracle passes, as do 36 focused IFR protocol tests and the emitted-bundle smoke test.

The performance result is mixed:

- On V8, real Vapor IFR is faster than the block-template prototype for the large content scene: **0.728 ms vs 0.844 ms** warm.
- Under `--jitless`, real Vapor IFR is **2.080 ms**, faster than BG (**6.792 ms**) and replay IFR (**5.327 ms**), but slower than block templates (**1.010 ms**) and the supplied 1.26 ms target.
- Browser FCP improves **4.31% at 1×**, but regresses **5.87% at 4×** on the example and host tested. This is not a consistent FCP win.
- The final `.lynx.bundle` grows **25.5% gzip** with IFR. Its incremental cost is materially smaller than the historical VDOM basic result, although the two example baselines are not directly comparable.

The flag therefore remains off by default and experimental. The implementation preserves correctness, but each entry still needs device-specific FCP and bundle validation.

## Protocol decision

The implementation follows the preferred deterministic-replay branch rather than structural adoption.

Vapor satisfies the required invariants in fresh realms:

- the engine page is protocol ID 1 and element IDs allocate from 2;
- template IDs and clone base IDs are monotonic;
- `REGISTER_TREE`/`CLONE_TREE` reserve the same preorder UID range on both threads;
- event signs, worklet IDs, refs, and emitted op order are deterministic.

The Main Thread evaluates the full Vapor entry but defers `mount()` until `renderPage()`. Its real template clones and initial `renderEffect` calls write to a local recorder/interpreter. The Background Thread then mounts normally and owns the ShadowElement tree, reactivity, events, refs, and subsequent updates.

Hydration compares flattened op frames using the shared `OP_ARITY` ABI:

- identical frames are skipped;
- ordinary value differences patch in place;
- worklet contexts and MT refs always adopt the BG payload;
- list platform-metadata differences, structural differences, unknown opcodes, and truncated frames rebuild from the complete buffered BG history;
- a BG completion signal turns an unmatched MT tail into the same safe fallback instead of leaving a strict-prefix tree behind.

The MT stream is sealed after its deferred mounts. Ops produced later are discarded. If first-frame rendering throws, Vue Lynx removes the partial tree, resets element/template/list/worklet state, retains the engine-owned page, and lets BG replay normally.

### Deferred selector optimization

Profiling identified one avoidable production cost: the disposable MT paint wrote one `vue-ref-*` selector attribute per native node even though those selectors serve BG `NodesRef` queries. Route C now defers those writes, installs them in one pass before successful BG ownership, and clears the deferred set before fallback.

For large content this removed exactly 1,004 first-paint attribute calls. The real variant fell from roughly 3.8–4.0 ms to 2.1–2.5 ms in repeated jitless runs. Focused tests lock the timing, successful commit, and fallback replay behavior.

## JavaScript cost

Method: one fresh subprocess per cell, 30 iterations, counting PAPI, large content scene. Page creation is outside the timed region. V8 and `node --jitless` use the same generated scene and production modules. Full cold, warm median, p95, scene, and size data are in [`results/results.json`](./results/results.json) (SHA-256 `40b96d1b60e80f1c45c6ec46264f868e57db8e63c1d9d5e3c1459bfdcc9d084d`).

| Variant | V8 warm (ms) | Jitless warm (ms) |
|---|---:|---:|
| BG baseline | 4.753 | 6.792 |
| Replay IFR | 2.634 | 5.327 |
| Direct PAPI prototype | 3.738 | 5.021 |
| Static-template prototype | 2.602 | 4.208 |
| Block-template prototype | 0.844 | 1.010 |
| Vapor upper-bound prototype | 0.188 | 0.326 |
| **Real Vapor IFR** | **0.728** | **2.080** |
| PAPI floor | 0.226 | 0.255 |

Real Vapor IFR large-content detail:

| Mode | Cold (ms) | Warm median (ms) | Warm p95 (ms) | PAPI calls |
|---|---:|---:|---:|---:|
| V8 | 8.498 | 0.728 | 1.473 | 3,642 |
| Jitless | 9.819 | 2.080 | 2.324 | 3,642 |

On jitless warm cost, real Route C is 3.27× faster than BG and 2.56× faster than replay IFR. It is still 2.06× slower than block templates and 6.38× slower than the optimistic Vapor prototype.

That gap was profiled rather than hidden. After selector deferral, real Vapor and block templates make effectively the same number of PAPI calls. The remaining cost is framework work omitted by the prototype: the real path builds a navigable ShadowElement clone, runs dependency-tracked Vapor effects, retains element/subtree registries, and emits the hydration protocol. Replacing that with a direct-PAPI compiler target would be a different architecture and would need new ownership and `NodesRef` semantics.

## Browser FCP

> **Superseded.** These runs predate the Lynx-for-Web DOM-constructor fix:
> in every "IFR on" sample below, the Main-Thread first frame threw inside
> the Vapor runtime and fell back to the Background render, so the deltas
> measure the IFR bundle/evaluation tax with none of the early paint. The
> corrected results are in the
> [review addendum](#review-addendum-2026-07-16).

Method: final emitted `.web.bundle` files in the existing dual-thread `lynx-view` web harness, Chrome for Testing 149 on macOS arm64, seven fresh contexts per entry. Every off/on sample rendered exactly 10 final nodes. Raw FCP, settled-time, plain-control, and node-count arrays are in [`browser-results-vapor.json`](./results/browser-results-vapor.json) and [`browser-results-vapor-x4.json`](./results/browser-results-vapor-x4.json).

| CPU throttle | IFR off median | IFR on median | Delta |
|---|---:|---:|---:|
| 1× | 85.9 ms | 82.2 ms | **−3.7 ms / −4.31%** |
| 4× | 144.9 ms | 153.4 ms | **+8.5 ms / +5.87%** |

Final web-bundle SHA-256 values:

- IFR off: `2c08ee124f38d71c24a4b8f3ebda47b2c41a84adf1c7b168987512a01b725122`
- IFR on: `aea8192385a3f9b2c4703a2346c834de4d44f5c63002d4bfe34d16989ed96e93`

This example does not reproduce the historical VDOM branch's consistent 19–31% browser improvement. At 1× the structural early-paint path narrowly wins; at 4× the larger MT program and real Vapor work outweigh it. Seven-run medians are directional rather than a device launch criterion, so the docs recommend measuring the target screen and leaving fetch-only screens off.

## Bundle size

All sizes below come from the final `examples/vapor` production builds after clearing `node_modules/.cache`. Gzip uses level 9.

| Artifact or section | IFR off raw | IFR on raw | Raw delta | IFR off gzip | IFR on gzip | Gzip delta |
|---|---:|---:|---:|---:|---:|---:|
| `main.web.bundle` | 202,218 B | 244,264 B | +42,046 B / +20.8% | 68,408 B | 83,620 B | +15,212 B / +22.2% |
| `main.lynx.bundle` | 225,085 B | 278,874 B | +53,789 B / +23.9% | 96,733 B | 121,360 B | +24,627 B / +25.5% |
| MT section | 94,438 B | 122,100 B | +27,662 B / +29.3% | 31,887 B | 42,170 B | +10,283 B / +32.2% |
| BG section | 102,164 B | 116,101 B | +13,937 B / +13.6% | 35,963 B | 40,691 B | +4,728 B / +13.1% |

The size hypothesis is partially supported in the marginal comparison. The historical VDOM `basic` sweep grew its MT section from 17,075 to 81,503 raw bytes (**+64,428 B**) and its full gzip bundle from 34,872 to 78,693 bytes (**+43,821 B**). Route C's corresponding increments are +27,662 B MT raw and +24,627 B full gzip—57% and 44% smaller respectively.

Those are different examples and branch baselines, so absolute totals are not an apples-to-apples win: the Vapor bundle is larger in absolute bytes. The verified claim is narrower: enabling IFR duplicates substantially less incremental code than the historical VDOM path. The pure entry avoids importing Vue Lynx's VDOM renderer, while upstream runtime-vapor still shares runtime-core scheduling and component primitives.

## Correctness and verification

The real `ifr-vapor-real` row is registered beside the optimistic prototype rather than replacing it. The oracle renders all eight variants for static-heavy, content, and list scenes through the jsdom PAPI and compares normalized application output. Normalization removes only internal `vue-ref-*`, invisible empty text anchors, and `data-v-app` on the engine-owned outer page; a guard preserves nested application output.

Verified coverage includes:

- isolated-realm template/UID/event/ref determinism;
- synchronous `renderPage()` paint and inert MT lifecycle registration;
- identical, value-different, split, coalesced, late-mismatch, and strict-prefix hydration;
- BG-authoritative events, worklets, refs, and post-hydration reactive updates;
- template clones, list metadata fallback, duplicate-batch handling, and render exceptions;
- selector deferral/commit/fallback, CSS Modules, scoped CSS, import attributes, escaped directives, and worklet-hash alignment;
- emitted-bundle paint/hydration with no duplicate tree or listener.

The emitted-bundle measurement reported `contentAtRenderPage=10`, `contentFinal=10`, a 1,028-byte first BG patch, two BG batches, and no BG error.

## Vapor-specific limitations

- Initial structure must be deterministic and based on synchronously available, thread-neutral inputs.
- Top-level module evaluation happens before `renderPage()` and is outside the render fallback boundary.
- Synchronous module/setup side effects and user-created watchers can execute in both realms.
- Regular events before BG handler registration are dropped; Main Thread Script handlers are separate.
- `useVaporCssVars()` installs its reactive CSS-variable effect on BG, so bound CSS variables can appear at handoff rather than MT paint.
- The MT Vapor graph remains allocated after handoff, although its later visible ops are discarded.
- Fetch-only screens pay the size/evaluation cost without useful synchronous content.
- Pure Vapor retains its existing `<script setup>`-only, no Options API, no VDOM mixing, no VDOM-only built-ins, no `v-html`, and no SSR-hydration limitations.

CSS Modules keep their generated locals on MT, and scoped/ordinary extracted CSS uses the same stylesheet output as IFR-off.

## Reproduce

```bash
# 24 application-output comparisons
pnpm --filter vue-lynx-ifr-bench run check

# 96 cells: V8 + jitless, small + large, three scenes, eight variants
pnpm --filter vue-lynx-ifr-bench run bench

# final dual-thread browser runs
node web-harness/run-browser.mjs <bundlesDir> 7 1 vapor
node web-harness/run-browser.mjs <bundlesDir> 7 4 vapor
```

---

## Review addendum (2026-07-16)

A take-over review of this implementation ran the full suites, audited the
protocol/build/test surfaces, and re-benchmarked in a real browser at the
same scale as the historical VDOM work (a ~1,000-element generated SFC)
instead of the 10-node example. Two of its findings invalidate sections
above; the fixes are landed on this branch.

### Critical: the first frame crashed on Lynx for Web

On Lynx for Web the Background runtime runs in a Worker (no DOM globals),
but the **Main-Thread Lepus chunk executes on the page's main thread, where
real `Node`/`Element`/`Text`/`document` globals exist**. The Vapor DOM shim
installs its globals with skip-if-present semantics, so in that realm every
`instanceof Node/Element` classification inside `@vue/runtime-vapor`
resolved against the host DOM, returned `false` for ShadowElements, sent
`insert()` down the fragment path, and threw
`TypeError: Cannot read properties of undefined (reading 'anchor')` inside
`runIfrRender()`. The catch boundary then fell back to the Background
render — silently. Every "IFR on" browser sample in the section above
therefore paid the IFR bundle and evaluation tax and painted on the classic
BG path; the reported "+4.31%/−5.87%" deltas measured noise plus that tax.
The jsdom smoke test could not catch this because its Main-Thread realm has
no DOM globals, exactly like native Lepus (where the feature works).

**Fix:** the plugin now rewrites the free DOM-constructor identifiers to
internal shim globals (`Node` → `globalThis.__VUE_LYNX_NODE__`, …) exactly
as it already did for `document`/`window`, and the DOM shim installs those
rewrite targets unconditionally in every realm (`VAPOR_DOM_CTOR_GLOBALS` in
`vue-lynx/internal/ops`). The emitted-bundle spec now evaluates the
Main-Thread section in a hostile realm with real jsdom DOM globals
installed, reproducing the browser failure mode in CI.

### Corrected browser FCP — same-source matrix at ~1,000 elements

Method: one **generated SFC** (`sfc-probe/generate.mjs`) mirroring the
bench "content" scene — a feed header plus 125 literal cards, each with one
dynamic class and two dynamic text bindings against reactive state
(1,004 elements) — built four ways from identical source so renderer mode
and `enableIFR` are the only variables. `examples/vapor` (10 nodes) rides
along for continuity with the superseded runs. Headless Chromium
(playwright, Linux container), the same dual-thread `lynx-view` harness,
seven fresh contexts per entry, medians. Raw arrays:
[`browser-results-sfc.json`](./results/browser-results-sfc.json),
[`browser-results-sfc-x4.json`](./results/browser-results-sfc-x4.json);
section sizes: [`sfc-probe-sizes.json`](./results/sfc-probe-sizes.json).

| Entry (elements) | 1× off | 1× on | Δ | 4× off | 4× on | Δ |
|---|---:|---:|---:|---:|---:|---:|
| content vapor (1,004) | 161.6 ms | 138.9 ms | **−14.0%** | 482.9 ms | 510.6 ms | **+5.7%** |
| content vdom (1,004) | 146.7 ms | 118.8 ms | **−19.0%** | 473.9 ms | 443.0 ms | **−6.5%** |
| ten vapor (10) | 104.1 ms | 76.5 ms | **−26.5%** | 283.0 ms | 243.4 ms | −14.0% |

Reading (seven-run medians on shared cloud CPU are directional; a second
independent post-fix run agreed at 1× and put the two ×4 vapor rows at
+2.8% and −3.5%):

- With the crash fixed, Vapor IFR's structural win is real and lands in the
  historical VDOM range at 1× (−14% at 1,000 elements, −26% at 10). The
  original "route c has no consistent FCP win" conclusion is superseded.
- The ×4 large-content row is the remaining honest weakness: the vapor IFR
  MT section is the largest of the matrix (174 KB raw vs 136 KB for vdom
  IFR), and on a slow CPU its parse/eval plus the real Vapor runtime work
  still outweigh the saved worker startup and IPC. VDOM replay IFR keeps a
  −6.5% win on the same source at ×4. The original report's residual
  diagnosis — the MT path is not yet compiler-direct — stands.
- Same-source bundle increments (gzip): enabling IFR costs the vapor entry
  **+11.3 KB MT / +16.4 KB total**, and the vdom entry
  **+14.0 KB MT / +14.9 KB total**. Route c's *incremental* MT cost is
  smaller than VDOM replay's (the pure entry carries no vdom renderer), but
  the vapor entry remains absolutely larger.

### Other defects found and fixed in review

1. **Fallback boundaries could throw into Lepus.** An in-place hydration
   patch or the post-teardown history replay ran outside any catch; a
   native rejection there escaped `vuePatchUpdate`. Both now fall back
   (patch failure → full history rebuild) or contain the error, with tests.
2. **Dev builds crashed timer-less Lepus realms.** A development IFR bundle
   reaches `setTimeout` during module evaluation (runtime-core's
   devtools-hook replay sees the shim `window`), outside the render
   fallback boundary. `enableIFR()` now installs a no-op timer stub when
   the realm has none.
3. **The emitted-bundle spec built dev bundles under vitest.** Vitest
   exports `NODE_ENV=test`, which Rsbuild inherited; the spec now forces
   `NODE_ENV=production` and treats a dev-mode bundle in `dist/` as stale.
4. **`worklet-utils` Babel grammar broke valid TS.** `typescript`+`jsx`
   parsed together reject angle-bracket type assertions (`<T>expr`) in
   plain `.ts`, turning previously-building files into build errors (and
   silently dropping their MT import edges). Parsing now cascades: plain TS
   grammar first, JSX grammar on failure.
5. **The correctness oracle leaked scheduler state across variants.** A
   straggling post-flush callback from one variant could fire inside the
   next variant's run. The oracle now drains the shared scheduler while
   each variant's guards are still installed.
6. **`INIT_MT_REF` replay semantics were changed without a lock.** BG-
   authoritative replay overwrites a ref value an MT worklet wrote during
   the pre-hydration window (the reference branch kept first-write-wins).
   The designed trade — one unambiguous owner over interaction state in
   that narrow window — is now pinned by a test.

### Caveats that remain (unchanged recommendation)

- The JS-cost table above compares variants fairly, but its warm medians
  reuse the parsed template prototypes and `buildStructure` caches across
  iterations. A production MT realm pays that work once in its single first
  frame: with per-run fresh template closures the real variant measures
  roughly 2.6× its cached warm median. Treat the 0.728/2.080 ms rows as
  relative, not absolute fresh-realm cost.
- The completion handshake (`vueIfrHydrationComplete`) has end-to-end but
  no unit coverage; the Node PAPI test env cannot express it.
- `enableIFR` stays experimental and off by default. Measure the target
  screen: 1× wins are consistent; slow-CPU large screens can still regress
  until the MT first-frame target is compiler-direct.

