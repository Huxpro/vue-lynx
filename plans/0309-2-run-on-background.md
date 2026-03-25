# MTS Phase 3: `runOnBackground`

## Context

Vue Lynx's Swiper demo currently duplicates all touch tracking on the BG thread (~60 lines of `onBGTouchStart/Move/End`) because there's no MT->BG function call mechanism. React Lynx solves this with `runOnBackground(fn)` -- allowing `'main thread'` functions to asynchronously invoke BG functions. This also blocks code sharing between Vue and React swiper implementations.

**Goal**: Implement `runOnBackground` for Vue Lynx, matching React Lynx's API.

## What already works (no changes needed)

| Layer                                                                                                                                                                                                        | Status                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **SWC transform** -- detects `runOnBackground(fn)` by identifier name, extracts into `_jsFn` handles (JS pass) and generates `registerWorkletInternal` with bare `runOnBackground(_jsFnK)` calls (LEPUS pass) | Already works -- same `@lynx-js/react/transform` SWC plugin |
| **worklet-loader** -- `extractRegistrations()` captures `registerWorkletInternal(...)` bodies including any `runOnBackground(...)` calls inside                                                               | Already works                                              |
| **worklet-runtime on MT** -- `transformWorkletInner` stamps `_execId` from parent ctx onto `_jsFnId` sub-objects; `_runOnBackgroundDelayImpl` is initialized                                                  | Already works -- loaded via `__LoadLepusChunk`              |
| **`FunctionCallRet` BG listener** -- `function-call.ts` resolves return values from `runOnMainThread` calls                                                                                                   | Already works (reusable pattern)                           |

## Implementation

### Step 1: Types -- extend `worklet-types.ts`

**File**: `packages/vue/runtime/src/worklet-types.ts`

Add `JsFnHandle` interface and extend `Worklet`:

```ts
export interface JsFnHandle {
  _jsFnId?: number;
  _fn?: (...args: unknown[]) => unknown;
  _execId?: number;
  _error?: string;
  _isFirstScreen?: boolean;
}

// Add to existing Worklet interface:
export interface Worklet {
  // ...existing fields...
  _execId?: number;
  _jsFn?: Record<string, unknown>;
}
```

### Step 2: `transformToWorklet` -- BG function wrapper

**New file**: `packages/vue/runtime/src/transform-to-worklet.ts` (~15 lines)

Port from React's `packages/react/runtime/src/worklet/call/transformToWorklet.ts`:

```ts
let lastId = 0;

export function transformToWorklet(obj: (...args: any[]) => any): JsFnHandle {
  const id = ++lastId;
  if (typeof obj !== 'function') {
    return {
      _jsFnId: id,
      _error:
        `Argument of runOnBackground should be a function, got [${typeof obj}]`,
    };
  }
  obj.toJSON ??= () => '[BackgroundFunction]';
  return { _jsFnId: id, _fn: obj };
}
```

The SWC JS pass generates `import { transformToWorklet } from "vue-lynx"` -- so this must be exported from `index.ts`.

### Step 3: BG-side worklet registration + event listener

**New file**: `packages/vue/runtime/src/run-on-background.ts` (~100 lines)

Port and simplify from React's `runOnBackground.ts` + `execMap.ts` + `indexMap.ts`:

```ts
// IndexMap -- auto-incrementing Map (port from React's indexMap.ts)
class IndexMap<T> {
  private lastIndex = 0;
  private map = new Map<number, T>();
  add(value: T): number {
    const id = ++this.lastIndex;
    this.map.set(id, value);
    return id;
  }
  get(index: number): T | undefined {
    return this.map.get(index);
  }
  remove(index: number): void {
    this.map.delete(index);
  }
}

// WorkletExecIdMap -- stamps _execId on worklets, finds JsFnHandle by (execId, fnId)
class WorkletExecIdMap extends IndexMap<Worklet> {
  add(worklet: Worklet): number {
    const execId = super.add(worklet);
    worklet._execId = execId;
    return execId;
  }
  findJsFnHandle(execId: number, fnId: number): JsFnHandle | undefined {
    const worklet = this.get(execId);
    if (!worklet) return undefined;
    // Recursive search for { _jsFnId: fnId } in worklet object
    // (same algorithm as React's execMap.ts)
  }
}

let execIdMap: WorkletExecIdMap | undefined;

// registerWorkletCtx -- called before worklet ctx is sent to MT via ops
export function registerWorkletCtx(ctx: Worklet): void {
  if (!execIdMap) init();
  execIdMap!.add(ctx);
}

function init(): void {
  execIdMap = new WorkletExecIdMap();
  lynx.getCoreContext().addEventListener(
    'Lynx.Worklet.runOnBackground',
    runJSFunction,
  );
}

// runJSFunction -- receives MT dispatch, finds _fn, calls it, sends return value
function runJSFunction(event: { data?: unknown }): void {
  const data = JSON.parse(event.data as string);
  const handle = execIdMap!.findJsFnHandle(data.obj._execId, data.obj._jsFnId);
  if (!handle?._fn) throw new Error('runOnBackground: JS function not found');
  const returnValue = handle._fn(...data.params);
  lynx.getCoreContext().dispatchEvent({
    type: 'Lynx.Worklet.FunctionCallRet',
    data: JSON.stringify({ resolveId: data.resolveId, returnValue }),
  });
}
```

### Step 4: Hook `registerWorkletCtx` into patchProp + runOnMainThread

**File**: `packages/vue/runtime/src/node-ops.ts`

In `patchProp`, when handling `main-thread-*` worklet events, stamp `_execId` before pushing ops:

```ts
// Before: pushOp(OP.SET_WORKLET_EVENT, el.id, event.type, event.name, nextValue);
// After:
registerWorkletCtx(nextValue as Worklet); // stamps _execId
pushOp(OP.SET_WORKLET_EVENT, el.id, event.type, event.name, nextValue);
```

**File**: `packages/vue/runtime/src/cross-thread.ts`

In `runOnMainThread(fn)`, stamp before dispatch:

```ts
export function runOnMainThread<R, Fn extends (...args: unknown[]) => R>(
  fn: Fn,
) {
  registerWorkletCtx(fn as unknown as Worklet); // stamp _execId
  return async (...params) => {/* existing dispatch logic */};
}
```

### Step 5: MT-side `runOnBackground` function

**New file**: `packages/vue/main-thread/src/run-on-background-mt.ts` (~50 lines)

This is the function called inside worklet bodies on MT. It dispatches to BG via `lynx.getJSContext()`:

```ts
// Return value resolver (MT-side, mirrors BG's function-call.ts but on getJSContext)
let resolveMap: Map<number, (v: unknown) => void> | undefined;
let nextResolveId = 1;

function initReturnListener(): void {
  resolveMap = new Map();
  lynx.getJSContext().addEventListener(
    'Lynx.Worklet.FunctionCallRet',
    (event) => {
      const { resolveId, returnValue } = JSON.parse(event.data as string);
      const resolve = resolveMap!.get(resolveId);
      if (resolve) {
        resolveMap!.delete(resolveId);
        resolve(returnValue);
      }
    },
  );
}

export function runOnBackground(handle: JsFnHandle) {
  return async (...params: unknown[]): Promise<unknown> => {
    return new Promise((resolve) => {
      if (!resolveMap) initReturnListener();
      const resolveId = nextResolveId++;
      resolveMap!.set(resolveId, resolve);

      // First-screen delay (worklet-runtime handles this if needed)
      if (handle._isFirstScreen) {
        globalThis.lynxWorkletImpl?._runOnBackgroundDelayImpl
          .delayRunOnBackground(handle, (fnId, execId) => {
            dispatch(fnId, params, execId, resolveId);
          });
        return;
      }
      dispatch(handle._jsFnId!, params, handle._execId!, resolveId);
    });
  };
}

function dispatch(
  fnId: number,
  params: unknown[],
  execId: number,
  resolveId: number,
) {
  lynx.getJSContext().dispatchEvent({
    type: 'Lynx.Worklet.runOnBackground',
    data: JSON.stringify({
      obj: { _jsFnId: fnId, _execId: execId },
      params,
      resolveId,
    }),
  });
}
```

**File**: `packages/vue/main-thread/src/entry-main.ts`

Register as global (extracted LEPUS code calls it as bare identifier):

```ts
import { runOnBackground } from './run-on-background-mt.js';
(globalThis as any).runOnBackground = runOnBackground;
```

### Step 6: Exports from `index.ts`

**File**: `packages/vue/runtime/src/index.ts`

```ts
export { transformToWorklet } from './transform-to-worklet.js';
// runOnBackground: re-export as type-level API for user imports
// (SWC replaces calls at compile time; never actually called on BG at runtime)
export { runOnBackground } from './run-on-background.js';
// Reset
import { resetRunOnBackgroundState } from './run-on-background.js';
// Add to resetForTesting():
//   resetRunOnBackgroundState();
```

For `runOnBackground` export from BG package: provide a stub that throws with clear message ("can only be used in 'main thread' functions"). The SWC transform replaces all call sites, so this never runs -- it exists only for TypeScript import resolution.

### Step 7: Update Swiper demo

**File**: `packages/vue/e2e-lynx/src/swiper/Swiper/Swiper.vue`

Before (~196 lines):

```vue
<!-- Same element has both MT and BG touch handlers -->
<view
  :main-thread-bindtouchstart="handleTouchStart"
  :main-thread-bindtouchmove="handleTouchMove"
  :main-thread-bindtouchend="handleTouchEnd"
  @touchstart="onBGTouchStart"
  @touchmove="onBGTouchMove"
  @touchend="onBGTouchEnd"
/>
```

After (~130 lines):

```vue
<!-- MT handlers only -- runOnBackground syncs indicator -->
<view
  :main-thread-bindtouchstart="handleTouchStart"
  :main-thread-bindtouchmove="handleTouchMove"
  :main-thread-bindtouchend="handleTouchEnd"
/>
```

Changes:

- Delete `bgOffset`, `bgTouchStartX`, `bgTouchStartOffset` variables
- Delete `onBGTouchStart`, `onBGTouchMove`, `onBGTouchEnd` functions
- Delete `@touchstart/@touchmove/@touchend` template bindings
- Add `import { runOnBackground } from 'vue-lynx'`
- In MT `mtUpdateOffset`, add: `runOnBackground(updateCurrentIndex)(index)` to sync indicator
- Add BG function: `function updateCurrentIndex(index: number) { currentIndex.value = index; }`

### Step 8: MT type declarations

**File**: `packages/vue/main-thread/src/entry-main.ts` (extend existing `lynx` declare)

Add `lynx.getJSContext()` declaration for MT side:

```ts
declare const lynx: {
  getJSContext(): {
    dispatchEvent(event: { type: string; data: string }): void;
    addEventListener(
      type: string,
      handler: (event: { data?: unknown }) => void,
    ): void;
  };
  // ...existing declarations...
};
```

## Explicitly NOT in scope (future work)

| Feature                                     | Reason                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| GC lifecycle (`FinalizationRegistry`)       | Optimization -- worklets are few and long-lived, minor leak is acceptable                                      |
| `releaseBackgroundWorkletCtx` event         | Requires GC lifecycle                                                                                         |
| SDK version guard (`isSdkVersionGt(2, 15)`) | Vue targets modern Lynx SDK only                                                                              |
| First-screen delay (`_isFirstScreen`)       | Vue mounts immediately, no hydration delay needed. Include the code path for safety but not critical to test. |

## Verification

1. **Build**: `pnpm build` in runtime, main-thread, rspeedy-plugin -- no errors
2. **Type check**: `pnpm tsc --noEmit` passes
3. **Existing tests**: `pnpm test` in `packages/vue/testing-library/` -- all 20 tests pass (no regression)
4. **Swiper demo on LynxExplorer**:
   - Touch drag still moves the swiper (MT handler, zero-latency)
   - Indicator dot updates during drag (via `runOnBackground`)
   - Indicator click still animates swiper (via `runOnMainThread`)
   - No duplicate BG touch handlers in code
5. **Console verification**: BG log shows `runJSFunction` receiving calls from MT during touch

## File summary

| File                                      | Action  | ~Lines                |
| ----------------------------------------- | ------- | --------------------- |
| `runtime/src/worklet-types.ts`            | modify  | +10                   |
| `runtime/src/transform-to-worklet.ts`     | **new** | ~15                   |
| `runtime/src/run-on-background.ts`        | **new** | ~100                  |
| `runtime/src/node-ops.ts`                 | modify  | +3                    |
| `runtime/src/cross-thread.ts`             | modify  | +3                    |
| `runtime/src/index.ts`                    | modify  | +5                    |
| `main-thread/src/run-on-background-mt.ts` | **new** | ~50                   |
| `main-thread/src/entry-main.ts`           | modify  | +3                    |
| `e2e-lynx/src/swiper/Swiper/Swiper.vue`   | modify  | -60                   |
| `main-thread/src/shims.d.ts`              | modify  | +10                   |
| **Total**                                 |         | ~200 new, -60 removed |

## Post-Implementation Summary

### Build & Test Results

- All 3 packages (`runtime`, `main-thread`, `rspeedy-plugin`) build successfully
- Pipeline tests 28/28 pass (no regressions)
- Upstream tests 778/875 pass, 97 skipped (consistent with previous results)
- Swiper demo verified on LynxExplorer

### Vue Lynx <-> React Lynx MTS Code Reuse Analysis

#### MTS Function Body Reuse Rate: ~95%

`'main thread'` functions become worklet contexts after SWC transform, and the function bodies are completely framework-agnostic:

| MTS Function                      | Differences                                         |
| --------------------------------- | --------------------------------------------------- |
| `handleTouchStart`                | Only animation cancellation differs (React hook vs Vue ref) |
| `handleTouchMove`                 | **0 differences**                                   |
| `handleTouchEnd`                  | Same structure, Vue inlines animate                  |
| `updateOffset` / `mtUpdateOffset` | **0 differences** -- `Math.min/max` clamp logic is line-by-line identical |
| `easeInOutQuad`                   | **Character-by-character identical**                 |
| `calcNearestPage`                 | Vue inlines it in `handleTouchEnd`, same logic       |

#### Swiper Demo Before/After Comparison

| Metric                              | Before (without `runOnBackground`)                                      | After                |
| ----------------------------------- | ----------------------------------------------------------------------- | -------------------- |
| Vue Swiper total lines              | ~196 lines                                                              | ~167 lines (**-30 lines**) |
| BG duplicate touch logic            | 3 handlers x ~10 lines = ~30 lines                                      | **0 lines** (deleted) |
| BG state variables                  | `bgOffset`, `bgTouchStartX`, `bgTouchStartOffset`                       | **0**                |
| MTS function bodies directly reusable from React | ~70% (missing MT->BG channel, indicator logic differs)       | **~95%**             |
| Cross-framework API consistency     | `useMainThreadRef` OK `runOnMainThread` OK `runOnBackground` missing     | **All OK**           |

#### Runtime Infrastructure Reuse

| Module                 | Reuse Level                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `useMainThreadRef`     | API consistent, Vue adds `.value` alias                                    |
| `runOnMainThread`      | dispatch protocol consistent                                               |
| `runOnBackground`      | **Fully aligned after implementation**                                     |
| `transformToWorklet`   | Logic consistent                                                           |
| worklet-runtime (MT)   | **100% reuse** -- same `__LoadLepusChunk('worklet-runtime')`               |
| SWC transform          | **100% reuse** -- same `@lynx-js/react/transform` plugin                   |
| Event protocol         | **100% reuse** -- `Lynx.Worklet.runOnBackground` / `FunctionCallRet`       |

#### Conclusion

After implementing `runOnBackground`, Vue Lynx's MTS API is fully aligned with React Lynx (`useMainThreadRef`, `runOnMainThread`, `runOnBackground`, `transformToWorklet`). The Swiper's MTS function bodies can be ported nearly line-by-line, requiring only framework wrapper adjustments (Vue SFC composable vs React hook). The remaining ~5% difference comes from Vue inlining `useAnimate` rather than extracting it as a separate hook -- this is a code organization style difference that does not affect functionality.
