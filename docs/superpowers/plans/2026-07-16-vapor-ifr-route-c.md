# Vapor IFR Route C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `enableIFR` for pure Vapor builds, with deterministic cross-thread hydration, correctness fallbacks, real-runtime benchmarks, browser FCP measurements, bundle-size evidence, and a final report.

**Architecture:** The IFR main-thread bundle evaluates the real Vapor runtime and app, defers mount until `renderPage`, and routes the initial ops stream to a local recorder/interpreter. The BG thread performs a normal Vapor mount; a frame-stream reconciler skips identical structure, patches values, reapplies BG-owned worklet/ref frames, and fully replays buffered BG history after structural mismatch. Vapor's existing `REGISTER_TEMPLATE`/`CLONE_TEMPLATE` lowering remains the only route-C template protocol.

**Tech Stack:** TypeScript, Vue 3.6 Vapor runtime/compiler, Rspack/Rspeedy module layers and loaders, Vitest, Lynx PAPI testing environment, Node benchmark harnesses, Playwright/Chromium.

---

## File map

- `packages/vue-lynx/internal/src/ops.ts` — single wire-protocol definition and arities.
- `packages/vue-lynx/runtime/src/ifr-env.ts` — MT environment detection, inert-hook wrapper, worklet-runtime gate.
- `packages/vue-lynx/runtime/src/app-registry.ts` — deferred app mount bridge.
- `packages/vue-lynx/runtime/src/flush.ts` — local MT op sink vs BG IPC.
- `packages/vue-lynx/runtime/src/index.ts` — VDOM mount/lifecycle IFR compatibility.
- `packages/vue-lynx/runtime/src/vapor-app.ts` and `runtime/src/vapor/index.ts` — pure Vapor mount/lifecycle integration.
- `packages/vue-lynx/runtime/src/main-thread-props.ts`, `cross-thread.ts` — avoid BG-only worklet registration on MT.
- `packages/vue-lynx/main-thread/src/ifr.ts` — phase machine, recorder, frame-stream hydration, teardown/fallback.
- `packages/vue-lynx/main-thread/src/entry-ifr.ts`, `entry-main.ts` — bootstrap/lifecycle wiring.
- `packages/vue-lynx/plugin/src/index.ts`, `entry.ts` — public flag and MT entry graph.
- `packages/vue-lynx/plugin/src/loaders/worklet-loader{,-mt}.ts`, `worklet-utils.ts` — pure-Vapor full-code MT transforms.
- `packages/upstream-tests/src/vapor/ifr*.spec.ts` and helpers — Node-based Vapor IFR integration suite.
- `packages/testing-library/src/__tests__/worklet-utils.test.ts` — loader utility regressions.
- `packages/ifr-bench/**` — existing benchmark asset plus `ifr-vapor-real` and Vapor bundle/browser cases.
- `examples/vapor/lynx.config.ts` — reproducible IFR build switch.
- `website/docs/guide/ifr.mdx`, `website/docs/guide/vapor-mode.mdx` — user-facing behavior and limitations.
- `packages/ifr-bench/VAPOR-IFR-REPORT.md` — protocol decision and measured results.

## Task 1: Establish the protocol ABI and deterministic-replay proof

**Files:**
- Modify: `packages/vue-lynx/internal/src/ops.ts`
- Modify: `packages/upstream-tests/src/vapor/ops-test-utils.ts`
- Create: `packages/upstream-tests/src/vapor/ifr-determinism.spec.ts`

- [ ] **Step 1: Add the characterization test before changing production code**

  Define a compiled-output-style Vapor component with two templates, an only-child text alias, a comment anchor, `v-if`, `v-for`, an event, `useMainThreadRef`, and a main-thread event prop. Render it twice with `resetForTesting()` between runs and capture the serialized flushes. Assert exact equality of the two decoded frame sequences, including template IDs, clone base UIDs, event signs, and WVIDs.

  ```ts
  expect(second).toEqual(first)
  expect(opsOf(first, OP.REGISTER_TEMPLATE).map(x => x.args[0])).toEqual([1, 2])
  expect(opsOf(first, OP.SET_EVENT)[0]?.args[3]).toBe('vue:0')
  expect(opsOf(first, OP.INIT_MT_REF)[0]?.args[0]).toBe(1)
  ```

- [ ] **Step 2: Run the smoke test and confirm the existing invariant**

  Run: `pnpm --filter vue-lynx-upstream-tests exec vitest run --config vitest.local.config.ts src/vapor/ifr-determinism.spec.ts`

  Expected: PASS. This is an explicit characterization gate, not a new feature test; any difference forces the design to structural adoption before production edits.

- [ ] **Step 3: Add the failing shared-arity coverage test**

  Replace the test-local arity table import with `OP_ARITY` from `vue-lynx/internal/ops`, and assert every `Object.values(OP)` entry has an arity.

  Expected failure: `OP_ARITY` is not exported.

- [ ] **Step 4: Add the protocol constants**

  Add `PAGE_ROOT_ID = 1` and a frozen numeric `OP_ARITY` map covering opcodes 0–13 and 15–16. Keep opcode 14 absent and keep `REGISTER_TEMPLATE=15`, `CLONE_TEMPLATE=16`.

  ```ts
  export const PAGE_ROOT_ID = 1
  export const OP_ARITY: Readonly<Record<number, number>> = {
    [OP.CREATE]: 2,
    [OP.CREATE_TEXT]: 1,
    [OP.INSERT]: 3,
    [OP.REMOVE]: 2,
    [OP.SET_PROP]: 3,
    [OP.SET_TEXT]: 2,
    [OP.SET_EVENT]: 4,
    [OP.REMOVE_EVENT]: 3,
    [OP.SET_STYLE]: 2,
    [OP.SET_CLASS]: 2,
    [OP.SET_ID]: 2,
    [OP.SET_WORKLET_EVENT]: 4,
    [OP.SET_MT_REF]: 2,
    [OP.INIT_MT_REF]: 2,
    [OP.REGISTER_TEMPLATE]: 2,
    [OP.CLONE_TEMPLATE]: 2,
  }
  ```

- [ ] **Step 5: Run focused tests**

  Run the command from Step 2 plus `pnpm --filter vue-lynx-testing-library exec vitest run src/__tests__/ops-coverage.test.ts`.

  Expected: PASS.

## Task 2: Specify the hydration engine with red tests

**Files:**
- Create: `packages/upstream-tests/src/vapor/ifr-papi-test-env.ts`
- Create: `packages/upstream-tests/src/vapor/ifr.spec.ts`
- Modify: `packages/upstream-tests/vitest.local.config.ts` if an alias is needed

- [ ] **Step 1: Build a minimal in-memory PAPI fixture**

  Install global PAPI functions used by `entry-main.ts` and `ops-apply.ts`. Each mock element stores `type`, `children`, `parent`, `attrs`, `classes`, `style`, and events. Implement typed creators, append/insert/remove, setters, `__AddEvent`, unique IDs, and flush counters. Expose helpers to query the page tree and dispatch a stored sign through `publishEvent`.

- [ ] **Step 2: Write failing first-frame and lifecycle tests**

  Cover deferred Vapor mount, synchronous paint inside `renderPage`, MT `onMounted` suppression, and exactly-once BG `onMounted` execution.

  Expected failures: Vapor `mount()` executes before `renderPage`; MT lifecycle callback runs.

- [ ] **Step 3: Write failing identical/value/event/ownership tests**

  Cover identical hydration without duplication, BG event routing through the MT-bound sign, BG post-hydration updates, MT post-hydration ops dropping, text/style value patching in place, and authoritative BG worklet/MT-ref replay.

- [ ] **Step 4: Write failing structural and batching tests**

  Cover single-batch structural fallback, MT render exception fallback, split BG frames, coalesced BG frames, and a mismatch in a later batch after earlier frames were skipped. Assert the late fallback rebuilds from the entire buffered BG stream.

- [ ] **Step 5: Write the failing non-IFR regression**

  Without calling `enableIFR`, assert `renderPage` remains empty until BG mount and normal `vuePatchUpdate` applies exactly once.

- [ ] **Step 6: Run the suite and record expected RED output**

  Run: `pnpm --filter vue-lynx-upstream-tests exec vitest run --config vitest.local.config.ts src/vapor/ifr.spec.ts`

  Expected: failures for missing `enableIFR`, `entry-ifr`, deferred mount, and hydration interception—not fixture errors.

## Task 3: Implement runtime-side IFR plumbing

**Files:**
- Create: `packages/vue-lynx/runtime/src/ifr-env.ts`
- Modify: `packages/vue-lynx/runtime/src/app-registry.ts`
- Modify: `packages/vue-lynx/runtime/src/flush.ts`
- Modify: `packages/vue-lynx/runtime/src/index.ts`
- Modify: `packages/vue-lynx/runtime/src/vapor-app.ts`
- Modify: `packages/vue-lynx/runtime/src/vapor/index.ts`
- Modify: `packages/vue-lynx/runtime/src/main-thread-props.ts`
- Modify: `packages/vue-lynx/runtime/src/cross-thread.ts`

- [ ] **Step 1: Add the environment helpers**

  Implement `isIfrMainThread()`, a generic `ifrInert(fn)` wrapper, and `loadWorkletRuntime()` in a renderer-neutral module. Export the gate from both runtime entries.

- [ ] **Step 2: Expose and reset deferred mounts**

  `registerMount()` must install `globalThis.__vueLynxIfrMountApps = triggerRenderPage`; `resetAppRegistry()` clears pending functions, render state, and the global hook.

- [ ] **Step 3: Route MT flushes locally**

  In `doFlush`, after `takeOps()`, call `__vueLynxIfrApplyOps(ops)` and return when IFR MT is active. Do not create an ack promise or call IPC. Preserve `__VUE_LYNX_FLUSH_HOOK__` on both paths.

- [ ] **Step 4: Defer both app mounts**

  Wrap the existing VDOM and Vapor mount bodies in closures. Register instead of invoking only when `isIfrMainThread()` is true.

- [ ] **Step 5: Make lifecycle registration inert**

  Replace direct exports for the eight hooks with `ifrInert` wrappers in both `index.ts` and `vapor-app.ts`. Keep `onErrorCaptured` direct. Return early from `useVaporCssVars()` on IFR MT.

- [ ] **Step 6: Guard BG-only worklet registration**

  Skip `registerWorkletCtx()` in `applyMainThreadProp()` and `runOnMainThread()` while on IFR MT. Do not suppress the emitted `SET_WORKLET_EVENT`, `SET_MT_REF`, or `INIT_MT_REF` frames.

- [ ] **Step 7: Reset new module state in tests**

  Add `resetAppRegistry()` to `resetForTesting()` and leave the real-thread path unchanged.

- [ ] **Step 8: Run Task 2 tests**

  Expected: deferred mount/lifecycle/local-flush tests move GREEN; hydration tests remain RED until Task 4.

## Task 4: Implement the robust main-thread recorder and hydrator

**Files:**
- Create: `packages/vue-lynx/main-thread/src/ifr.ts`
- Create: `packages/vue-lynx/main-thread/src/entry-ifr.ts`
- Modify: `packages/vue-lynx/main-thread/src/entry-main.ts`

- [ ] **Step 1: Implement phases and the local recorder**

  Add `enableIFR`, `recordAndApply`, `runIfrRender`, `getIfrPhase`, and `resetIfrForTesting`. Drop and warn once for MT ops after `hydrated`.

- [ ] **Step 2: Implement frame-stream reconciliation**

  Decode frames with `OP_ARITY`. Strictly compare opcode and identity args; patch the last arg for normal value ops; always enqueue BG worklet/ref frames. Maintain a cursor into flattened MT ops and accept arbitrary incoming batch boundaries.

- [ ] **Step 3: Buffer authoritative BG history**

  Retain every incoming hydration frame until completion. On late mismatch, replay history plus the current frames after teardown. Release both MT recording and BG history on success.

- [ ] **Step 4: Implement registry-safe teardown**

  Determine page-root children from recorded structural frames, remove them through PAPI, preserve the page handle/unique ID, call `resetMainThreadState()`, then reseed root ID 1. This clears element ancestry, Vapor templates, lists, and worklet refs before replay.

- [ ] **Step 5: Wire the main-thread lifecycle**

  Preserve an engine-provided `SystemInfo`; call `runIfrRender()` after root registration in `renderPage`; call `interceptPatchUpdate(data)` before normal parse/apply.

- [ ] **Step 6: Run the full Vapor IFR suite**

  Expected: every Task 2 scenario PASS, including split/coalesced/late mismatch and non-IFR behavior.

## Task 5: Add `enableIFR` to the pure-Vapor build pipeline

**Files:**
- Modify: `packages/vue-lynx/plugin/src/index.ts`
- Modify: `packages/vue-lynx/plugin/src/entry.ts`
- Modify: `packages/vue-lynx/plugin/src/loaders/worklet-loader.ts`
- Modify: `packages/vue-lynx/plugin/src/loaders/worklet-loader-mt.ts`
- Modify: `packages/vue-lynx/plugin/src/loaders/worklet-utils.ts`
- Modify: `packages/testing-library/src/__tests__/worklet-utils.test.ts`
- Create or modify: focused loader tests beside existing worklet tests

- [ ] **Step 1: Write RED loader utility tests**

  Assert shared import attributes are stripped, ordinary SFC style imports are removed, CSS-module style imports and bindings remain, and comments/string literals do not confuse the transform.

- [ ] **Step 2: Write RED full-module transform tests**

  Assert an IFR connector retains script/template edges, a Vapor worklet module's full output imports `loadWorkletRuntime` from `vue-lynx/vapor`, and MT/BG `_wkltId` hashes match.

- [ ] **Step 3: Add the public option and entry order**

  Add `enableIFR?: boolean`, default false, and pass `{ enableIFR, vapor }` into `applyEntry`. IFR imports must be `entry-main`, `entry-ifr`, worklet runtime, then user imports. Exclude `runtime/` from the MT worklet loader.

- [ ] **Step 4: Add full-module MT loader mode**

  Preserve current resolver/allowlist behavior for non-IFR builds. In IFR mode, keep full modules, transform directive-bearing original source to LEPUS, remove shared attributes, and apply the style policy from Step 1.

- [ ] **Step 5: Preserve pure Vapor worklet imports**

  Pass `vapor` to both worklet loaders and choose `runtimePkg: 'vue-lynx/vapor'` for Vapor builds on both targets.

- [ ] **Step 6: Run loader and package builds**

  Run: `pnpm --filter vue-lynx-testing-library exec vitest run src/__tests__/worklet-utils.test.ts src/__tests__/worklet-loader-imports.test.ts`

  Run: `pnpm build`

  Expected: PASS and no VDOM entry imported by the Vapor MT graph.

## Task 6: Verify a real Vapor SFC bundle and broaden regression coverage

**Files:**
- Modify: `examples/vapor/lynx.config.ts`
- Create: `packages/example-harness/tests/vapor-ifr.spec.mjs`
- Modify: docs/tests only when a real-bundle failure identifies a missing contract

- [ ] **Step 1: Make the example flag reproducible**

  Set `enableIFR` from `process.env.VUE_LYNX_ENABLE_IFR === '1'` while retaining `vapor: true` and `optionsApi: false`.

- [ ] **Step 2: Build IFR off and on after clearing cache**

  In `examples/vapor`, remove `node_modules/.cache`, build once with the env unset and once with `VUE_LYNX_ENABLE_IFR=1`, preserving both `.web.bundle`/`.lynx.bundle` outputs outside `dist`.

- [ ] **Step 3: Evaluate the real IFR bundle**

  Execute `lepusCode.root`, call `renderPage({})`, and assert the first frame exists before evaluating `background.js`; then evaluate BG and assert structural equality/no duplication after hydration.

- [ ] **Step 4: Verify worklets and CSS modules**

  Build the worklet-heavy Vapor overlay/example and a `<style module>` Vapor fixture. Compare BG `_wkltId` values with MT registrations and assert hashed first-frame classes.

- [ ] **Step 5: Run regressions**

  Run `pnpm test`, all three upstream configs, `pnpm build`, and the Vapor example-harness tests.

## Task 7: Port the existing IFR benchmark asset and add `ifr-vapor-real`

**Files:**
- Add from the reference branch: `packages/ifr-bench/**` source, harnesses, reports, and package metadata
- Modify: `packages/ifr-bench/src/prep.mjs`
- Modify: `packages/ifr-bench/src/variants.mjs`
- Modify: `packages/ifr-bench/resolve-hooks.mjs`
- Modify: `packages/ifr-bench/package.json`

- [ ] **Step 1: Port, do not redesign, the reference asset**

  Bring the benchmark package, correctness oracle, scenes, counting/jsdom PAPI backends, examples sweep, and browser harness intact. Preserve `ifr-vapor` as the named optimistic upper bound.

- [ ] **Step 2: Write a failing correctness registration**

  Register `ifr-vapor-real` beside `ifr-vapor` before its implementation. Run `pnpm --filter vue-lynx-ifr-bench run check` and confirm the variant is missing/fails rather than weakening the oracle.

- [ ] **Step 3: Compile and evaluate the real Vapor scene**

  Use `@vue/compiler-vapor` with native tags, condensed whitespace, module output, and event delegation disabled. Evaluate against `vue-lynx/vapor`, wrap the render function as a Vapor component, defer its app mount, time only `runIfrRender()`, and collect real ops.

- [ ] **Step 4: Pass the correctness oracle**

  Expected: every scene/variant document matches after only the existing bookkeeping/anchor normalization. Record the exact check count.

- [ ] **Step 5: Run JS cost**

  Run the quick matrix first, then the full V8 and `--jitless` matrix. Record cold and warm content results versus the 0.55 ms synthetic upper bound and 1.26 ms VDOM block-template result.

## Task 8: Measure real-browser FCP and bundle size

**Files:**
- Modify only benchmark result/report files produced by the existing harness

- [ ] **Step 1: Produce a flat bundle matrix**

  Include Vapor IFR off/on and the closest VDOM IFR reference bundles available. Record total bundle, MT section, BG section, raw bytes, and gzip bytes with one deterministic script.

- [ ] **Step 2: Install/locate Chromium and run 1x**

  Run `node packages/ifr-bench/web-harness/run-browser.mjs <bundlesDir> 7 1`. Record medians and failures.

- [ ] **Step 3: Run 4x CPU throttle**

  Run the same harness with throttle `4`. Preserve the generated JSON separately.

- [ ] **Step 4: Run the applicable examples sweep**

  Reuse the existing orchestrator, adapting only the entry map for Vapor-capable examples. Clear each app cache before builds and restore configs. Classify content-first, fetch-first, and unsupported/Options-API cases.

## Task 9: Documentation, report, and final verification

**Files:**
- Create: `website/docs/guide/ifr.mdx`
- Modify: `website/docs/guide/vapor-mode.mdx`
- Modify: `website/rspress.config.ts`
- Create: `packages/ifr-bench/VAPOR-IFR-REPORT.md`
- Create: `.changeset/vapor-ifr-route-c.md`

- [ ] **Step 1: Document the switch and protocol**

  Explain renderer-neutral `enableIFR`, Vapor route C, deterministic replay, fallback, lifecycle/effect constraints, pre-BG events, sync-data requirement, and that VDOM element templates are unrelated to Vapor REGISTER/CLONE templates.

- [ ] **Step 2: Write the results report**

  Include the hydration decision and evidence, correctness count, JS ladder, real-browser 1x/4x FCP, MT/raw/gzip bundle sizes, comparison to reference VDOM numbers, and a candid Vapor limitations table. Mark any unavailable measurement as unavailable with the exact command/error—never substitute single-process timing for FCP.

- [ ] **Step 3: Run formatting/type/build checks**

  Run focused Biome on changed files, `pnpm build`, `pnpm test`, `pnpm test:upstream`, benchmark correctness, and the real Vapor bundle smoke test.

- [ ] **Step 4: Use verification-before-completion**

  Review fresh command output, inspect `git diff --check`, verify no caches/dist artifacts or unrelated changes are tracked, and request final code review. Resolve every correctness or quality issue before declaring completion.
