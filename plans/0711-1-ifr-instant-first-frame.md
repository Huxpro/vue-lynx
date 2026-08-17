# Feature: Instant First-Frame Rendering (IFR)

**Date**: 2026-07-11
**Status**: Completed ✅

---

## Background

ReactLynx ships with IFR (Instant First-Frame Rendering, 首屏直出): the app is compiled twice, and the main-thread (Lepus) bundle renders the first screen synchronously *inside* `loadTemplate` using a fork of `preact-render-to-string` that emits Element PAPI calls instead of HTML. The background thread then boots, renders the same app into a silent shadow tree, receives the main-thread tree as JSON (`rLynxFirstScreen`), adopts the main-thread node ids into its own tree, and sends back a mismatch patch (`rLynxChange`). Effects never run on the main thread (`SKIP_EFFECTS` at runtime + `shake.removeCall: ['useEffect', ...]` at compile time), and events that fire before hydration are queued.

- Official docs: https://lynxjs.org/guide/interaction/ifr
- Deep-dive blog: lynx-family/lynx-website#1136
- Reference implementation: `@lynx-js/react` `runtime/lib/snapshot/lifecycle/render.js` (header: *"Implements the IFR on main thread"*), `backgroundSnapshot.js` (`hydrate`), `tt.js` (`rLynxFirstScreen` handler)

Vue Lynx previously had no IFR: `renderPage` created an empty page root; everything visible waited for the background thread to boot, mount, and ship its first ops batch — a blank first frame.

## Design

The port does **not** replicate ReactLynx's snapshot serialization + BG-side tree diff. Vue Lynx's architecture already has the perfect seam: the renderer is thread-agnostic and its output is a flat, JSON-serializable **ops stream** — the ops stream *is* the "recorded element PAPI calls". IFR becomes:

1. **First frame on the main thread.** The MT bundle carries the full Vue runtime + user app (instead of stripping user code down to worklet registrations). `renderPage` mounts the deferred Vue app; the runtime's flush hook applies each ops batch locally via the existing `applyOps` interpreter and records it.
2. **Deterministic replay.** The background thread boots and renders the same app with the same data. `ShadowElement` ids (module counter from 2), event signs (`vue:N`), and `_wvid`s are deterministic, so its ops stream reproduces the main-thread stream — including event signs, which means events bound during the first frame route to BG handlers with **zero re-binding** (Lynx routes `bindEvent` string handlers to BG `publishEvent` regardless of which thread attached them).
3. **Hydration on the main thread.** The BG's initial `vuePatchUpdate` batches are intercepted and compared against the recorded stream, batch by batch:
   - byte-identical JSON → **skip** (fast path, the common case);
   - same op/id structure but different trailing values (`SET_TEXT`, `SET_STYLE`, …) → **patch in place** with the BG value; `SET_WORKLET_EVENT` / `SET_MT_REF` / `INIT_MT_REF` are always re-applied from the BG frame (the BG worklet ctx carries the `_execId` required for `runOnBackground`);
   - structural divergence (different opcodes/ids, extra MT ops) → **teardown**: every IFR-created element is removed and the BG batch applies onto a clean page. Correctness never depends on the renders matching (same principle as ReactLynx; their diff degrades to remove+insert patches, ours to a rebuild).
   - If BG sends more trailing ops than recorded (e.g. a merged flush), the excess applies verbatim; once the recorded stream is consumed, hydration completes and all later batches flow through the normal pipeline (where the pre-existing duplicate-batch detection still guards double bundle evaluation).
4. **Effect suppression.** `onMounted` / `onBeforeMount` / `onUnmounted` / `onBeforeUnmount` / `onUpdated` / `onBeforeUpdate` / `onActivated` / `onDeactivated` re-exported from `vue-lynx` are no-ops during the MT render (runtime equivalent of ReactLynx's compile-time `removeCall` + `SKIP_EFFECTS`). `onErrorCaptured` stays active so error boundaries work. Vue-internal hooks (KeepAlive bookkeeping etc.) are untouched — they are deterministic framework behavior.

vs. ReactLynx's protocol: they need BG-side hydration because BG/MT ids are allocated in different spaces (positive/negative) and snapshots carry per-part updaters; we get id alignment for free from determinism and keep all hydration logic on the MT side, with the BG entirely unaware IFR exists. The trade-off: structural divergence costs a full rebuild instead of a subtree patch — acceptable because divergence requires non-deterministic render code, which the docs forbid (same constraint ReactLynx documents).

Not ported (follow-ups): `firstScreenSyncTiming: 'jsReady'` (MT-side re-render on `updatePage` before handover + event id swap maps — Vue Lynx has no init-data API yet, so `updatePage` remains a no-op), pre-hydration event queueing (our BG mount + `publishEvent` registration happen in one synchronous bundle evaluation, so the exposed window is engine-level, same as ReactLynx's pre-`tt`-injection window), SSR (`ssrEncode`/`ssrHydrate`).

## Change

1. **`runtime/src/ifr-env.ts`** (new): `isIfrMainThread()` — reads `globalThis.__VUE_LYNX_IFR_MT__`, set by the MT bootstrap before user code evaluates. Absent on BG and in test envs.

2. **`runtime/src/app-registry.ts`**: `registerMount` now exposes `globalThis.__vueLynxIfrMountApps = triggerRenderPage` so the main-thread package (separate module graph) can trigger mounts from `renderPage`; added `resetAppRegistry()` (wired into `resetForTesting`).

3. **`runtime/src/index.ts`**: `createApp().mount()` defers via `registerMount` on the IFR main thread; the eight user-facing lifecycle registration hooks are wrapped with `ifrInert`; new hidden export `loadWorkletRuntime()` (the LEPUS worklet transform emits `import { loadWorkletRuntime } from "vue-lynx"`, which must resolve in IFR builds where the full LEPUS output is kept).

4. **`runtime/src/flush.ts`**: `doFlush` hands ops to `globalThis.__vueLynxIfrApplyOps` (synchronous local apply, no ack promise) when on the IFR main thread, instead of `callLepusMethod`.

5. **`runtime/src/node-ops.ts`**: skip `registerWorkletCtx` on the IFR main thread (it wires `lynx.getCoreContext()` — a BG-only API; hydration re-applies the BG worklet ctx anyway).

6. **`main-thread/src/ifr.ts`** (new): the whole IFR/hydration engine — `enableIFR()` (installs the globals), `recordAndApply`, `runIfrRender(data)` (drives deferred mounts inside `renderPage`, with try/catch teardown fallback), `interceptPatchUpdate(json): boolean` (fast-path string compare → op-frame walk `reconcileBatch` → teardown), `teardownIfrTree()` (removes recorded root children + created ids), phase state machine `inactive → enabled → rendered → hydrated`.

7. **`main-thread/src/entry-ifr.ts`** (new): bootstrap that calls `enableIFR()`; injected by the plugin between `entry-main` and user code.

8. **`main-thread/src/entry-main.ts`**: `renderPage` calls `runIfrRender(data)` after creating the page root; `vuePatchUpdate` consults `interceptPatchUpdate(data)` before applying. Both are no-ops in non-IFR bundles (nothing registers, phase stays `inactive`).

9. **`plugin/src/index.ts` + `entry.ts`**: new `enableIFR` option (default `false`). When set: MT entry imports become `[entry-main, entry-ifr, worklet-runtime, ...user]`, and both MT loader rules get `options({ ifr: true })`. The runtime package dir is now always excluded from `vue:worklet-mt` (its dist enters the MT graph in IFR builds and must pass through untransformed — workspace symlinks bypass the `/node_modules/` exclude, same gotcha as the other bootstrap packages).

10. **`plugin/src/loaders/worklet-loader-mt.ts` + `worklet-utils.ts`**: IFR mode keeps full module code. `.vue` connectors pass through minus `?vue&type=style` imports (CSS is extracted on the BG layer; duplicating it would double it). Files with `'main thread'` directives return the **full LEPUS transform output** — the transform rewrites worklet expressions to `{ _wkltId }` ctx objects in place (same shape as the BG JS-target output, so hashes and hydration align) and appends `registerWorkletInternal` calls. `with { runtime: 'shared' }` import attributes are stripped (`stripSharedImportAttributes`) — the escape hatch exists to bypass the stripping loaders, which IFR mode doesn't do.

## Verification

- `packages/testing-library/src/__tests__/ifr.test.ts` (8 tests): first frame painted during `renderPage` before any BG code; `onMounted` suppressed on MT / runs once on BG; identical-batch skip without element duplication; event routing through MT-bound signs after hydration; post-hydration updates (from `onMounted` mutations) applying normally; value-mismatch in-place patching (text + style); structural-mismatch teardown + rebuild; non-IFR pipeline untouched when `enableIFR()` never ran.
- Full suites green: testing-library 112, upstream runtime-core 854, upstream dom-pipeline 59, upstream local 23.
- Real-bundle check: evaluating `dist/main.web.bundle`'s `lepusCode.root` in a PAPI-over-jsdom env (`@lynx-js/testing-environment`) and calling `renderPage({})` paints hello-world's complete first screen with zero background code; same harness passes for the worklet-heavy `examples/main-thread` entries built with IFR (including `runtime: 'shared'` imports).
- `examples/hello-world` ships with `enableIFR: true` (main-thread bundle 83 kB → 169 kB); all other examples build unchanged (`event-modifiers` failure pre-exists on the base branch); dev-smoke passes.

## Constraints (documented in `website/docs/guide/ifr.mdx` + zh)

- First-screen render must be deterministic and thread-agnostic; divergence ⇒ dev warning + full BG re-render fallback.
- Side effects belong in lifecycle hooks / watchers — never in render or `setup()` bodies' synchronous path.
- Events in the paint→BG-boot window are dropped (main-thread-script events unaffected).
- MT bundle size grows by ~Vue runtime + app code.
