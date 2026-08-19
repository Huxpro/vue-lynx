# Vapor IFR Route C Design

**Date:** 2026-07-16

**Status:** Approved by the supplied autonomous goal brief

## Goal

Add production-ready Instant First-Frame Rendering (IFR) to pure Vapor builds. During `loadTemplate`, the main-thread bundle synchronously runs the Vapor app and applies its ops locally. The background thread subsequently performs a normal Vapor mount to establish the authoritative shadow tree, reactive effects, event registry, refs, and BG-only anchors; its initial ops hydrate rather than duplicate the first-frame tree.

The public switch remains `pluginVueLynx({ enableIFR: true })`. It works for both renderer modes on this branch, while `vapor: true` selects route C and keeps the pure `vue-lynx/vapor` runtime entry.

## Evidence and protocol decision

The current Vapor renderer satisfies the deterministic replay prerequisites:

- page root ID is fixed at 1;
- `ShadowElement.nextUid` allocates sequentially from 2;
- template IDs allocate sequentially from 1;
- `REGISTER_TEMPLATE` plus `CLONE_TEMPLATE` reserve a contiguous preorder UID block, and the main-thread interpreter uses the same preorder walk;
- event signs, main-thread-ref IDs, and worklet execution IDs use realm-local monotonic counters;
- the ops buffer preserves emission order.

Therefore the implementation uses deterministic replay, the preferred branch of the goal's decision tree. Structural adoption is rejected for this milestone because it would need a new manifest and BG reconstruction path for comments, empty text anchors, folded text aliases, refs, event registries, and reactive ownership. Normal BG Vapor mounting already builds all of that state and produces the deterministic ops needed for hydration.

The VDOM `enableElementTemplates` transform is not ported. Vapor already owns an equivalent static-template lowering path through opcodes 15 (`REGISTER_TEMPLATE`) and 16 (`CLONE_TEMPLATE`). The retired opcode 14 remains retired.

## Runtime architecture

### Environment and deferred mount

An IFR bootstrap runs after the normal main-thread bootstrap and before user modules. It sets `__VUE_LYNX_IFR_MT__` and installs a local op sink.

Both VDOM `createApp().mount()` and Vapor `createVaporApp().mount()` check that flag. On the IFR main thread they register a mount closure instead of mounting during module evaluation. `renderPage()` creates and registers the native page root, then invokes the registered closures synchronously.

After those closures return, the runtime seals the MT stream so a synchronous or scheduled MT effect cannot extend the first frame while BG startup is in flight. The BG entry has a matching build marker and a generated epilogue after the user entry. The epilogue forces any scheduled initial flush and sends `vueIfrHydrationComplete` only after every patch acknowledgement has returned. This explicit end-of-stream signal distinguishes an incomplete split batch from a genuinely shorter BG render.

### Initial Vapor render

Vapor still executes its real template cloning and initial `renderEffect` bodies. Every resulting op is routed by `flush.ts` to the local IFR sink rather than through `callLepusMethod`. The sink records the flat ops and immediately calls the shipped `applyOps()` interpreter, so the first frame exists before `renderPage()` returns.

Internal `vue-ref-*` selector attributes are deferred during that disposable MT paint. They are not visible application state and only serve BG `NodesRef` queries. A successful handoff installs them in one pass before BG ownership completes; fallback clears the deferred set and normal BG replay installs them through the ordinary interpreter. This removes one PAPI attribute write per native node from the first-paint path without weakening post-hydration selectors.

The main-thread app remains allocated after handoff, but any later ops are dropped. This is the same ownership rule as the reference IFR implementation: after hydration, the BG runtime exclusively owns visible state.

### Lifecycle and effects

The eight user-facing lifecycle registration functions are inert while the IFR MT flag is active: mounted/beforeMount, unmounted/beforeUnmount, updated/beforeUpdate, activated/deactivated. `onErrorCaptured` remains active so error boundaries can participate in fallback.

Vapor's initial `renderEffect` calls must run because they populate dynamic holes. Reactive effects are not globally disabled. If they run after handoff their ops are discarded. Synchronous setup/module side effects and user-created watchers remain a documented limitation; first-screen code must be deterministic and thread-neutral. `useVaporCssVars()` also skips its mounted watcher on MT.

### Worklets and refs

MT rendering must not call BG-only `registerWorkletCtx()`. Worklet event contexts and MT refs are emitted into the recorded stream, but hydration always reapplies the BG versions so `_execId` and authoritative BG bookkeeping win. The same guards cover Vapor's main-thread attribute path and the shared `runOnMainThread()` wrapper.

## Hydration engine

The main-thread phase machine is `inactive -> enabled -> rendered -> hydrated`.

Recorded MT ops and incoming BG initial ops are decoded using a shared `OP_ARITY` table. Reconciliation uses a flat frame cursor rather than assuming batch boundaries align:

- identical frames are skipped;
- value ops compare identity-bearing arguments and patch only differing trailing values;
- `SET_WORKLET_EVENT`, `SET_MT_REF`, and `INIT_MT_REF` are always replayed from BG;
- structural differences, unknown opcodes, and truncated frames trigger fallback;
- differing list platform metadata (`item-key`, estimated sizes, span/reuse flags) triggers fallback because native `update-list-info` has already committed those values;
- incoming frames after the recorded MT stream is exhausted apply normally as post-mount updates.

All incoming hydration frames are retained until hydration completes. If a late mismatch occurs after earlier batches were skipped, fallback removes the IFR root children, resets main-thread element/template/list/worklet registries while retaining the native page root, and replays the complete buffered BG stream. This closes the completed reference branch's late-mismatch and split/coalesced-batch gaps.

If the completion signal arrives while an unmatched MT tail remains, that strict-prefix case is also a mismatch: Vue Lynx tears down the MT-only tail and replays the complete BG history. A successful match commits the deferred `NodesRef` selectors, installs BG ownership, and moves the phase to `hydrated`; all later MT ops are dropped.

`runIfrRender()` is wrapped in `try/catch`. Any MT-incompatible user code tears down partial output and leaves later BG rendering on the classic path; page correctness never depends on IFR success.

## Build architecture

`enableIFR` changes the MT entry order to:

1. normal PAPI bootstrap;
2. IFR bootstrap;
3. worklet runtime;
4. full user entry graph.

The MT worklet loader gains a full-module mode. It preserves SFC script/template code, applies the LEPUS transform to directive-bearing modules, strips `with { runtime: 'shared' }` attributes, drops ordinary style side effects, and retains CSS-module imports so the existing MT `exportOnlyLocals` rule supplies hashed class mappings.

Directive and import analysis use Babel's TypeScript/JSX-aware parser rather than text matching. This preserves import-shaped text in comments and literals, accepts escaped `main thread` directives and deprecated import assertions, and removes only real shared-runtime attributes even when comments or unusual whitespace are present.

For pure Vapor, both JS- and LEPUS-target worklet transforms use `vue-lynx/vapor` as `runtimePkg`. This prevents an accidental `vue-lynx` VDOM entry import from erasing route C's bundle-size advantage. Bootstrap/runtime/internal packages remain excluded from the MT worklet loader even when workspace symlinks resolve outside `node_modules`.

`SystemInfo` preserves any engine-provided global rather than replacing it with `{}`.

## Verification

Tests are written before production changes and cover:

1. isolated-realm deterministic alignment of template IDs, clone base UIDs, element UIDs, event signs, refs, and op ordering;
2. first frame painted synchronously in `renderPage()`;
3. lifecycle suppression on MT and exactly-once BG execution;
4. identical hydration without duplicate elements;
5. event routing to the BG handler;
6. post-hydration BG updates and MT-op dropping;
7. in-place value mismatch patches;
8. structural fallback and full authoritative replay;
9. `REGISTER_TEMPLATE`/`CLONE_TEMPLATE` hydration;
10. split/coalesced batches and late mismatch history replay;
11. worklet/MT-ref BG-authoritative replay;
12. render failure fallback and non-IFR regression;
13. loader behavior for CSS modules, styles, shared imports, worklet hashes, and pure-Vapor imports;
14. real Vapor bundle evaluation and the existing correctness oracle.

The existing IFR benchmark asset is ported without redesign. The synthetic `ifr-vapor` remains the optimistic 0.55 ms upper bound; a separate real `ifr-vapor-real` variant measures runtime-vapor cloning, render effects, DOM compatibility, the Vapor template protocol, and the shipped interpreter. Final reporting includes JS cost, real-browser FCP at 1x/4x CPU, and MT bundle raw/gzip size against IFR-off and VDOM IFR baselines.

## Explicit limitations

- First-screen output must be deterministic and thread-neutral.
- Synchronous setup/module side effects and user watchers are not suppressed.
- Regular events before BG registration are dropped; main-thread-script handlers are unaffected.
- First-screen data must be synchronously available; fetch-only screens should not enable IFR.
- Pure Vapor keeps its existing limitations: `<script setup>` only, no Options API, no VDOM/Vapor mixing, no VDOM-only built-ins, no `v-html`, and no exposed upstream SSR hydration path.
- CSS Modules are supported on MT through locals-only compilation; they are not intentionally downgraded to unhashed first-frame classes.
