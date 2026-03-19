# Refactor: Inline worklet-runtime into main-thread.js

**Date**: 2026-03-19
**Status**: Completed ✅

---

## Background

Previously, worklet-runtime (from `@lynx-js/react/worklet-runtime`) was injected as a **separate Lepus chunk** named `'worklet-runtime'`:

1. `VueWorkletRuntimePlugin` hooked into `LynxTemplatePlugin.beforeEncode` and pushed the chunk into `lepusCode.chunks`
2. `entry-main.ts` called `__LoadLepusChunk('worklet-runtime', { chunkType: 0 })` at startup to load it
3. Native Lynx loaded the chunk, making `globalThis.runWorklet` / `registerWorkletInternal` / `lynxWorkletImpl` available

The layer-based architecture plan (`0309-5`) explicitly kept this design:
> **Keep `VueWorkletRuntimePlugin`** (unchanged — still needed to inject worklet-runtime Lepus chunk).

## Motivation

The separate-chunk approach added unnecessary complexity:

- A dedicated webpack plugin (`VueWorkletRuntimePlugin`, ~50 lines) to inject the chunk via `beforeEncode`
- `fs.readFileSync` at compile time to read the worklet-runtime source
- `__LoadLepusChunk` call at runtime with fallback error handling for load failure
- A "half-initialized" failure mode: main-thread boots but worklet dispatch is broken

Since the layer-based refactor already made webpack handle the main-thread entry natively, the worklet-runtime can simply be another module in that entry — no special chunk mechanism needed.

## Change

1. **`plugin/src/entry.ts`**: Add `workletRuntimePath` as a webpack entry import in the main-thread bundle (after `entry-main.js`, before user imports). Remove `VueWorkletRuntimePlugin` class and its usage. Remove unused `fs` import.

2. **`main-thread/src/entry-main.ts`**: Remove the `__LoadLepusChunk('worklet-runtime', ...)` block (~30 lines).

## Key Risk: Does Native Lynx require `__LoadLepusChunk` as a signal?

The original code commented:
> Native Lynx requires this chunk to be loaded via __LoadLepusChunk so it knows to call runWorklet() when a worklet event fires.

**Verified on LynxExplorer (iOS simulator)**: `examples/main-thread` draggable demo works correctly — worklet events fire, MT draggable responds to touch with zero latency. Native Lynx dispatches to `runWorklet()` based on the presence of the global function, not the chunk-loading signal.

## Trade-offs

### Pros
- Simpler plugin code (−80 lines)
- No separate Lepus chunk concept in vue-lynx
- Atomic loading: worklet-runtime succeeds or fails with the entire main-thread entry
- More predictable bundle structure: one `lepusCode.root`, no `lepusCode.chunks`

### Cons
- Cannot independently cache worklet-runtime across entries (minor — it's ~10 kB)
- Execution order depends on webpack module scheduling (mitigated: entry-main.js is listed first)
