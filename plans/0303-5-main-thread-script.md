# Vue Lynx Main Thread Script (MTS) Design Plan

## Scope

**This PR**: Design document + **Phase 1 runtime foundation** (new ops, patchProp detection, `MainThreadRef` composable, MT executor changes). No SWC build transform yet -- Phase 1 tests with manually-constructed worklet context objects.

**Template syntax**: `:main-thread-bindscroll="onScroll"` (v-bind prefix, zero Vue compiler changes needed).

## Context

Vue Lynx currently routes ALL event handling through the Background Thread: native event -> `publishEvent(sign, data)` on BG -> Vue handler -> reactive updates -> ops buffer -> `callLepusMethod` -> Main Thread PAPI. This introduces 2 thread crossings per interaction, causing perceptible latency for gesture-driven animations and making `v-model` on `<input>` impossible (Lynx's `getValue()`/`setValue()` are synchronous, Main Thread-only APIs).

React Lynx solves this with **Main Thread Script**: functions marked with `'main thread'` directive execute synchronously on the Main Thread with zero thread crossings. We adapt this pattern for Vue, reusing Lynx's existing worklet infrastructure.

## Architecture Overview

```
BUILD TIME                                          RUNTIME
─────────────────────────────────────────────────────────────────────────────
.vue file                                           BG Thread
  │                                                 ┌─────────────────────┐
  ├─ <script setup>  → BG bundle (vue-loader)      │ Vue renderer        │
  │                                                 │ patchProp detects   │
  ├─ <script main-thread>  → MT bundle             │ "main-thread-bind*" │
  │  (compiled for Lepus, registered via            │ → pushOp(SET_WORK- │
  │   registerWorkletInternal)                      │   LET_EVENT, ctx)   │
  │                                                 │ → callLepusMethod  │
  └─ webpack bundles                                └────────┬────────────┘
     ├─ BG: Vue + user code (worklet context objs)           │
     └─ MT: PAPI executor + worklet-runtime                  ▼
           + registerWorkletInternal calls            MT Thread
                                                    ┌─────────────────────┐
                                                    │ applyOps receives   │
                                                    │ SET_WORKLET_EVENT   │
                                                    │ → __AddEvent(el,   │
                                                    │   type, name,       │
                                                    │   {type:'worklet',  │
                                                    │    value: ctx})     │
                                                    │                     │
                                                    │ User taps element:  │
                                                    │ → runWorklet(ctx,  │
                                                    │   [event]) — ZERO  │
                                                    │   thread crossings  │
                                                    └─────────────────────┘
```

## User-Facing API

### SFC Syntax: `<script main-thread>`

Main-thread functions live in a **separate `<script>` block** -- Vue-idiomatic, clean separation:

```vue
<script setup>
import { ref } from 'vue';
import { useMainThreadRef } from 'vue-lynx';

const count = ref(0);
const elRef = useMainThreadRef(null);
</script>

<script main-thread>
// This entire block compiles for the Main Thread.
// Exports become worklet context objects available in the template.
export function onScroll(event) {
  event.currentTarget.setStyleProperty('opacity', '0.5');
}

export function onTap(event) {
  event.currentTarget.setStyleProperty('background-color', 'blue');
}
</script>

<template>
  <scroll-view
    :main-thread-ref="elRef"
    :main-thread-bindscroll="onScroll"
    :main-thread-bindtap="onTap"
    :style="{ width: 300, height: 300 }"
  >
    <text>Scroll me</text>
  </scroll-view>
</template>
```

**Why `<script main-thread>` instead of React's `'main thread'` directive?**

- Vue already supports multiple `<script>` blocks (`<script>` + `<script setup>`)
- Clean separation: BG logic in `<script setup>`, MT handlers in `<script main-thread>`
- No SWC closure extraction needed -- the block boundary IS the thread separation
- vue-loader custom block handling can route the block to the MT bundle directly
- `event.currentTarget` provides element access; `useMainThreadRef` bridges shared state

### Template Binding Syntax (v-bind prefix)

```vue
<!-- Use :main-thread- prefix to bind worklet events/refs -->
<view :main-thread-bindtap="onTap" :main-thread-ref="elRef" />
```

Vue's `:` (v-bind) evaluates the expression and passes the JS value to `patchProp`. The `main-thread-` prefix is detected at runtime -- zero Vue compiler changes needed.

### Cross-Thread References

**Option A: `useMainThreadRef` (explicit, general-purpose)**

```typescript
import { useMainThreadRef } from 'vue-lynx';

// Element reference
const elRef = useMainThreadRef<ViewElement>(null);
// <view :main-thread-ref="elRef" />

// In <script main-thread>:
elRef.value?.setStyleProperty('transform', '...'); // .value access (Vue convention)

// General MT state (not just elements)
const scrollY = useMainThreadRef(0);
// In <script main-thread>:
scrollY.value = event.detail.scrollTop; // writable on MT
```

**Option B: `useMainThreadHandle` (derived from template ref, future Phase 2)**

```typescript
import { useTemplateRef } from 'vue';
import { useMainThreadHandle } from 'vue-lynx';

const el = useTemplateRef<ShadowElement>('myEl');
const elHandle = useMainThreadHandle(el); // auto-derives from template ref
// <view ref="myEl" />  — standard Vue ref binding

// In <script main-thread>:
elHandle.value?.setStyleProperty('color', 'red');
```

Option A is Phase 1 (general-purpose). Option B layers on top later by resolving the ShadowElement id -> PAPI element mapping on MT.

### Other Composable APIs (future)

```typescript
// runOnMainThread — async BG → MT invocation (future Phase 2)
const result = await runOnMainThread(fn)(arg1, arg2);

// runOnBackground — async MT → BG invocation (future Phase 2)
await runOnBackground(() => {
  count.value++;
})();
```

## Compile-Time Transform (Phase 2 -- not this PR)

### Two approaches considered:

**A. `<script main-thread>` block** (Vue-idiomatic, recommended)

- vue-loader custom block handler routes the block to MT bundle
- Exports from the block are mapped to worklet context objects on BG side
- No SWC closure extraction needed

**B. `'main thread'` directive** (React Lynx compatible, fallback)

- Reuse `@lynx-js/swc-plugin-reactlynx` worklet visitor on vue-loader JS output
- `target: 'JS'` for BG (replaces fn with `{ _c, _wkltId }`), `target: 'LEPUS'` for MT (emits `registerWorkletInternal`)
- Callable via `transformReactLynxSync()` from `@lynx-js/react/transform` (napi binding)

### Build Pipeline Change (Phase 2)

**Current**: MT bundle = ONLY `entry-main.ts` (PAPI executor, no user code)

**New**: MT bundle = `entry-main.ts` + `worklet-runtime` + `<script main-thread>` blocks (or LEPUS-transformed user code)

## Runtime Changes

### New Op Codes (`packages/vue/runtime/src/ops.ts`)

```typescript
export const OP = {
  // ... existing 0-10 ...
  SET_WORKLET_EVENT: 11, // [11, id, eventType, eventName, workletCtx]
  SET_MT_REF: 12, // [12, id, { _wvid }]
} as const;
```

### patchProp Extension (`packages/vue/runtime/src/node-ops.ts`)

```typescript
// Detect main-thread-* props (added before existing event/style/class checks):
if (key.startsWith('main-thread-')) {
  const suffix = key.slice('main-thread-'.length);
  if (suffix === 'ref') {
    pushOp(OP.SET_MT_REF, el.id, (nextValue as MainThreadRef).toJSON());
  } else {
    const event = parseEventProp(suffix);
    if (event && nextValue) {
      pushOp(OP.SET_WORKLET_EVENT, el.id, event.type, event.name, nextValue);
    }
  }
  scheduleFlush();
  return;
}
```

### Main Thread Executor (`packages/vue/main-thread/src/ops-apply.ts`)

```typescript
case OP.SET_WORKLET_EVENT: {
  const id = ops[i++], eventType = ops[i++], eventName = ops[i++], ctx = ops[i++]
  const el = elements.get(id)
  if (el) __AddEvent(el, eventType, eventName, { type: 'worklet', value: ctx })
  break
}

case OP.SET_MT_REF: {
  const id = ops[i++], refImpl = ops[i++]
  const el = elements.get(id)
  // Store in worklet ref map if worklet-runtime is loaded
  if (el && typeof lynxWorkletImpl !== 'undefined') {
    lynxWorkletImpl._refImpl?.updateWorkletRef(refImpl, el)
  }
  break
}
```

### v-model Mechanism (Phase 3 -- not this PR)

Pre-registered MT worklet handles synchronous input value sync:

```
User types → MT bindinput fires → MT worklet reads getValue()
  → MT: setValue() (immediate visual feedback, no flicker)
  → MT: dispatchEvent('Lynx.Vue.inputUpdate', { elementId, value }) to BG
  → BG: updates Vue ref(value) → reactive system → next tick
```

## Files to Create/Modify (Phase 1)

### New Files

| File                                          | Purpose                                                |
| --------------------------------------------- | ------------------------------------------------------ |
| `packages/vue/runtime/src/main-thread-ref.ts` | `MainThreadRef` class, `useMainThreadRef()` composable |
| `packages/vue/runtime/src/cross-thread.ts`    | `runOnMainThread()` stub, callback registry            |
| `packages/vue/e2e-lynx/src/mts-demo/index.ts` | Phase 1 E2E demo with hand-crafted worklet context     |

### Modified Files

| File                                        | Change                                                        |
| ------------------------------------------- | ------------------------------------------------------------- |
| `packages/vue/runtime/src/ops.ts`           | Add `SET_WORKLET_EVENT=11`, `SET_MT_REF=12`                   |
| `packages/vue/runtime/src/node-ops.ts`      | Detect `main-thread-*` props in `patchProp`                   |
| `packages/vue/runtime/src/index.ts`         | Export `useMainThreadRef`, `MainThreadRef`, `runOnMainThread` |
| `packages/vue/main-thread/src/ops-apply.ts` | Handle new op codes                                           |

### Reused from React Lynx (future phases, no modification)

| Package                          | What                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `@lynx-js/react/transform`       | SWC worklet transform (napi)                                                  |
| `@lynx-js/react/worklet-runtime` | `initWorklet()`, `registerWorkletInternal()`, `runWorklet()`, `Element` class |

## Implementation Steps (Phase 1)

### Step 1: New Op Codes

**File**: `packages/vue/runtime/src/ops.ts`

- Add `SET_WORKLET_EVENT = 11` and `SET_MT_REF = 12`

### Step 2: MainThreadRef Composable

**File (new)**: `packages/vue/runtime/src/main-thread-ref.ts`

- `MainThreadRef<T>` class: `_wvid`, `_initValue`, `toJSON()`, `.value` getter/setter (throws on BG in dev)
- Uses `.value` (Vue convention) instead of `.current` (React convention)
- `useMainThreadRef<T>(initValue)` with `onScopeDispose` cleanup
- Compatible with worklet-runtime's `_wvid`-based ref resolution on MT

### Step 3: patchProp Detection

**File**: `packages/vue/runtime/src/node-ops.ts`

- Detect `main-thread-*` prefix, parse suffix, emit `SET_WORKLET_EVENT` or `SET_MT_REF` ops

### Step 4: Main Thread Executor

**File**: `packages/vue/main-thread/src/ops-apply.ts`

- Handle `SET_WORKLET_EVENT`: `__AddEvent(el, type, name, { type: 'worklet', value: ctx })`
- Handle `SET_MT_REF`: store in worklet ref map (if available)

### Step 5: Cross-Thread Stubs

**File (new)**: `packages/vue/runtime/src/cross-thread.ts`

- `runOnMainThread(fn)` stub (logs warning that SWC transform needed)
- Callback registry scaffold for future async returns

### Step 6: Exports

**File**: `packages/vue/runtime/src/index.ts`

- Export new APIs

### Step 7: E2E Demo

**File (new)**: `packages/vue/e2e-lynx/src/mts-demo/`

- Hand-crafted worklet context object (simulates what compiler would produce)
- Tests the full ops plumbing: BG -> ops -> MT -> `__AddEvent` with worklet context

## Testing Strategy (Phase 1)

Since Phase 1 has no SWC transform, we test the **runtime plumbing** only:

1. **Build check**: `pnpm build` in all three packages -- existing counter/todomvc demos still work
2. **Type check**: `pnpm tsc --noEmit` passes across runtime, main-thread, rspeedy-plugin
3. **Ops flow test**: The mts-demo emits `SET_WORKLET_EVENT` ops. On MT, verify via `console.info` logs that `__AddEvent` is called with `{ type: 'worklet', value: { _wkltId: '...' } }`
4. **No regression**: Existing BG-thread events (`@tap`, `@confirm`) continue to work normally via sign-based registry
5. **DevTool verification**: `Runtime_listConsole` on LynxExplorer shows the worklet event binding logs

**Note**: The worklet handler won't actually fire yet (no worklet-runtime on MT). That requires Phase 2. Phase 1 proves the plumbing is correct.

---

## Post-Implementation Summary

### Actual Implementation vs Plan Deviations

#### 1. `<script main-thread>` approach was abandoned in favor of `'main thread'` directive

The recommended `<script main-thread>` approach from the plan (Vue-idiomatic, separate SFC block) **was not adopted**. The React Lynx `'main thread'` string directive approach was used instead, for the following reasons:

- **Reuse of the SWC compiler**: The `@lynx-js/react/transform` worklet compiler (SWC NAPI binding) works out of the box, supporting `target: 'JS'` (BG side replaces with worklet context object) and `target: 'LEPUS'` (MT side generates `registerWorkletInternal()` calls)
- **Zero vue-loader modifications**: No need to add new loader configuration for custom blocks
- **Automatic closure capture**: The SWC compiler automatically analyzes external references in `'main thread'` function bodies, serializing them into `_c` (closure values), including `MainThreadRef`'s `_wvid` marker
- **Consistency with React Lynx ecosystem**: worklet-runtime, workletRefMap, runWorklet and other infrastructure fully reused

**Trade-off**: `'main thread'` functions are written inside `<script setup>`, not as cleanly separated as an independent block. However, in practice this turned out to be more flexible -- BG and MT code can be mixed in the same scope, sharing props/computed/ref.

#### 2. Dual protocol for `.current` and `.value`

The plan stated "Uses `.value` (Vue convention) instead of `.current` (React convention)". After actual implementation, it was found that **`.current` must also be supported**:

- The ref object after worklet-runtime hydration only has `.current` (`{ current: value, _wvid: id }`)
- The LEPUS code generated by the SWC compiler compiles ref access in worklet function bodies to `.current`
- A `.current` getter/setter was added to the BG-side `MainThreadRef` class (read-only, warns in dev mode)

#### 3. Discovered and fixed missing value-only ref registration (INIT_MT_REF)

**This was the biggest unexpected discovery**. The plan only mentioned `SET_MT_REF` (element-bound ref), completely missing the value-only ref issue.

**Problem**: A ref created with `useMainThreadRef<number>(0)` is not bound to any DOM element, so it never triggers a `SET_MT_REF` op. When the worklet function runs on MT, the hydration process looks up `_workletRefMap` via `_wvid`, finds no entry -> returns `undefined` -> `undefined.current = value` throws TypeError.

**React Lynx's approach**:

1. `useMainThreadRef(initValue)` internally calls `addWorkletRefInitValue(wvid, initValue)`, accumulating into the patch buffer
2. During the commit phase, `sendMTRefInitValueToMainThread()` is called, sending via `callLepusMethod('rLynxChangeRefInitValue', { data })` to MT
3. On MT side, `updateWorkletRefInitValueChanges(patch)` creates `{ current: initValue, _wvid }` in `_workletRefMap`

**Vue's fix** (a simpler approach):

- Added `INIT_MT_REF = 13` op code
- In the `MainThreadRef` constructor, directly `pushOp(OP.INIT_MT_REF, this._wvid, initValue)`
- Ops are sent along with the initial render batch to MT via `vuePatchUpdate`
- On MT side, the `INIT_MT_REF` handler in `applyOps` creates the entry in `_workletRefMap`

**Advantage**: Leverages the existing ops buffer channel, no need for a new `callLepusMethod` endpoint. INIT_MT_REF enters the buffer before CREATE/INSERT ops (since `useMainThreadRef` is called during the setup phase), ensuring registration before any worklet event fires.

#### 4. Build Pipeline: worklet-loader + VueMainThreadPlugin

The plan left two compilation approaches for Phase 2; the actual choice was the **`'main thread'` directive + SWC dual-pass** approach:

```
webpack loader chain (BG bundle):
  vue-loader → worklet-loader → webpack

worklet-loader performs two SWC transforms:
  Pass 1 (target: 'JS')    → replaces 'main thread' functions with worklet context objects
  Pass 2 (target: 'LEPUS') → generates registerWorkletInternal() calls

extractRegistrations() extracts registerWorkletInternal(...) calls from LEPUS output
→ passed to VueMainThreadPlugin via worklet-registry (globalThis shared Map)
→ VueMainThreadPlugin injects registration code into main-thread-bundled.js
```

**VueMainThreadPlugin's flat-bundle strategy**:

- rslib pre-compiles `entry-main.ts` -> `dist/main-thread-bundled.js` (~17 kB, containing ops-apply + worklet registrations)
- Plugin reads the file with `fs.readFileSync`, replacing the webpack asset
- Marks with `'lynx:main-thread': true` asset info -> `LynxTemplatePlugin` routes to Lepus bytecode
- This solves the issue of `chunkLoading: 'lynx'` causing `StartupChunkDependenciesPlugin` not to execute the module factory

#### 5. `runOnMainThread` implemented, `runOnBackground` not implemented

- `runOnMainThread(fn)(args)` implemented via `lynx.getCoreContext().dispatchEvent({ type: 'Lynx.Worklet.runWorkletCtx', ... })`
- `runOnBackground` requires an MT->BG callback channel with complex infrastructure; a **BG duplicate touch tracking** workaround was used instead (for swiper indicator synchronization)

#### 6. Swiper Demo validated complete MTS capabilities

The Swiper demo (3 progressive entries) is the "ultimate test" for MTS:

| Entry          | MTS Feature Coverage                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `swiper-empty` | No MTS, pure static layout                                                                                                        |
| `swiper-mts`   | MT touch handlers, element ref (`setStyleProperty`), value-only ref (offset state), `requestAnimationFrame` on MT                 |
| `swiper`       | All of the above + `runOnMainThread` (indicator click -> animate), BG+MT dual touch handler pattern, nested MT function calls     |

**Key technical pattern**:

```vue
<!-- Same element with both MT and BG touch handlers bound -->
<view
  :main-thread-bindtouchstart="handleTouchStart"   <!-- MT: zero-latency dragging -->
  :main-thread-bindtouchmove="handleTouchMove"
  :main-thread-bindtouchend="handleTouchEnd"
  @touchstart="onBGTouchStart"                      <!-- BG: indicator state sync -->
  @touchmove="onBGTouchMove"
  @touchend="onBGTouchEnd"
/>
```

#### 7. E2E Demo naming and evolution: `mts-demo/` -> `mts-draggable-raw/` + `mts-draggable/`

The `mts-demo/` from plan Step 7 was actually named **`mts-draggable-raw/`** in implementation -- a scroll-view + draggable box comparison demo (MT smooth vs BG laggy), using hand-crafted worklet context objects:

```typescript
// Hand-crafted worklet context (Phase 1 — no SWC transform)
const onMTScrollCtx = {
  _wkltId: 'mts-draggable-raw:onScroll',
  _workletType: 'main-thread',
  _c: {} as Record<string, unknown>,
};
onMTScrollCtx._c = { _mtRef: mtDraggableRef.toJSON() };
```

After Phase 2 SWC transform integration, **`mts-draggable/`** was created as a comparison version, using the `'main thread'` directive:

```typescript
// Phase 2 — SWC automatically handles closure capture + worklet registration
const onMTScroll = (event: { detail?: { scrollTop?: number } }) => {
  'main thread'
  const el = (mtDraggableRef as ...).current
  el?.setStyleProperty('transform', `translate(...)`)
}
```

`mts-draggable-raw/` is kept as a reference implementation for Phase 1 raw worklets, requiring the manual `registerWorkletInternal()` calls in `dev-worklet-registrations.ts` (now cleared, as all demos have migrated to the directive approach).

**Raw worklet migration in Gallery**: `GalleryComplete` and `GalleryScrollbarCompare` initially used Phase 1 raw worklet context (`_wkltId`, `_workletType`, `_c`), later migrated to the `'main thread'` directive. Other Gallery demos (GalleryList, GalleryAutoScroll, GalleryScrollbar) do not involve MTS and required no migration.

### Remaining Issues & Future Plans

1. **`runOnBackground` not implemented**: Requires MT->BG communication channel. React Lynx implements this via the `Lynx.Worklet.runOnBackground` event
2. **`<script main-thread>` SFC block**: Can still serve as future syntactic sugar, compiling to the `'main thread'` directive
3. **First-screen MTS optimization**: Currently value-only refs are registered via the ops buffer during the first flush; worklet execution before first-screen rendering is unprotected (in practice this does not occur, as there is no user interaction before first screen)
4. **worklet-runtime error boundaries**: When worklet functions on MT throw errors, error messages only appear in the LynxExplorer toast (DevTool cannot see Lepus logs), making debugging difficult
