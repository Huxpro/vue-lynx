# Vue 3 on Lynx -- Dual-Thread MVP via ShadowElement Custom Renderer

## Context

We analyzed the vue-vine `exp/vue-vine-lynx` branch. It puts the entire Vue runtime (VDOM, reconciler, reactive) on the Main Thread (Lepus), while the Background Thread is nearly idle, only serving as an event relay. This leads to:

- An extra cross-thread round-trip for every regular event (Native -> BG -> forward -> Main)
- Excessive JS load on the Main Thread
- BG bundle carrying the full Vue runtime but unused

This plan implements a more reasonable architecture: **Vue core runs on the BG Thread, Main Thread only executes PAPI operations**.

---

## Goals

1. **Vue runtime-core runs on Background Thread**: reactive, VDOM diff, component lifecycle, event handlers all on BG
2. **Main Thread only executes PAPI operations**: receives flat operation arrays, executing `__CreateView`/`__AppendElement`/`__SetAttribute` etc. one by one
3. **Events need no cross-thread forwarding**: Native delivers to BG -> handler executes directly -> reactive update -> generates ops -> sends to Main
4. **Vue Block Tree takes effect automatically**: during updates, only dynamic nodes produce ops, zero traffic for static parts
5. **Pure `createRenderer` scope implementation**: no modifications to Vue runtime-core source code, only through RendererOptions nodeOps interface

## Non-Goals

1. **First-screen optimization (Snapshot mechanism)**: No independent Main Thread rendering of static skeletons. Initial render requires waiting for full BG ops. This needs the compiler to generate PAPI call functions (similar to ReactLynx Snapshot.create), beyond MVP scope
2. **Worklet / Main Thread events**: `'main thread'` directive function extraction, `main-thread:bindtap` and other high-frequency event optimizations are not implemented yet
3. **CSS handling**: No CSS scoping, CSS inheritance handling. Styles in properties are passed directly as objects/strings
4. **HMR / Dev Server**: No hot module replacement support
5. **List virtualization**: Lynx `<list>` component's callback-based rendering (`componentAtIndex`) is not supported yet
6. **Vue Vine template syntax**: No Vine compiler integration yet; validate core pipeline with pure `h()` render functions + `defineComponent`
7. **Template Ref cross-thread access**: `ref` gets ShadowElement, does not support direct PAPI calls

---

## Key Decisions & Principles

### D1: Rendering Thread Choice -- Vue on BG, PAPI on Main

**Reason**: Lynx Native delivers events to the BG Thread (`globalThis.publishEvent`), this is inherent platform behavior that cannot be changed. If Vue is on the Main Thread, every event needs to be forwarded from BG to Main, adding a cross-thread overhead. When Vue is on BG, events are directly handled upon arrival, no forwarding needed.

**Trade-off**: Initial render and each update's ops need to be sent from BG to Main. But update volume is controlled by Block Tree optimization, typically very small.

### D2: ShadowElement as HostElement -- nodeOps Dual-Write

Vue's `createRenderer` requires `createElement` to synchronously return a node reference, and `parentNode()`/`nextSibling()` must return synchronously. Real Lynx elements are on the Main Thread, inaccessible synchronously from BG.

**Solution**: BG maintains a lightweight ShadowElement linked-list tree. Each nodeOps call does two things simultaneously:

1. Synchronously updates the ShadowElement tree structure (satisfying Vue's synchronous query needs)
2. Appends operations to the ops buffer (sent asynchronously to Main Thread)

This is exactly the same pattern as ReactLynx's `BackgroundSnapshotInstance`.

### D3: Ops Format -- Flat Array, Same as ReactLynx

```typescript
ops = [OP.CREATE, id, type, OP.INSERT, parentId, childId, anchorId, OP.SET_PROP, id, key, value, ...]
```

All numbers/strings/simple values, naturally serializable. Does not use JSON object arrays, avoiding extra GC pressure.

### D4: Event Handlers Use Sign Mechanism

Functions are not serializable. When `patchProp(el, 'onTap', null, handler)`:

- BG side: `sign = register(handler)` stores into Map, sends `[OP.SET_EVENT, el.id, eventName, sign]`
- Main side: `__AddEvent(element, 'bindEvent', eventName, sign)`
- Event trigger: Native -> BG `publishEvent(sign, data)` -> BG looks up Map -> directly executes handler

Handlers always stay on the BG Thread, no cross-thread transfer.

### D5: Cross-Thread Transport -- Reuse `callLepusMethod`

ReactLynx uses `lynx.getNativeApp().callLepusMethod(lifecycleConstant, {data: JSON.stringify(patchList)}, callback)` to send ops from BG to Main Thread. We reuse the same mechanism, registering our own lifecycle constant.

### D6: Flush Timing -- Hook into Vue's `queuePostFlushCb`

Send ops only after all reactive updates are complete, ensuring only one send per tick. Same principle as ReactLynx hooking Preact's `options._commit`.

### D7: Block Tree Takes Effect Automatically

No additional implementation needed. Vue's Block Tree optimization decides "whether to call nodeOps" at the VNode diff level. Static nodes reuse VNode references -> `oldVNode === newVNode` -> skip -> no nodeOps calls -> no ops produced. Our ShadowElement layer is completely transparent.

---

## Architecture

```
Background Thread (JS Runtime)           Main Thread (Lepus)
┌────────────────────────────────┐      ┌─────────────────────────────┐
│  Vue 3 runtime-core            │      │  ops-apply.ts (~70 lines)   │
│  ┌──────────────────────────┐  │      │                             │
│  │ Reactive System          │  │      │  const elements = Map<id,   │
│  │ VDOM / Reconciler        │  │      │    LynxElement>             │
│  │ Component Lifecycle      │  │      │                             │
│  └──────────┬───────────────┘  │      │  switch(op) {               │
│             │ nodeOps calls    │      │    CREATE → __CreateView()  │
│  ┌──────────▼───────────────┐  │      │    INSERT → __AppendElement │
│  │ ShadowElement nodeOps    │  │      │    REMOVE → __RemoveElement │
│  │ ┌─────────┐ ┌──────────┐│  │      │    SET_PROP → __SetAttr     │
│  │ │ Shadow  │ │ ops      ││  │      │    SET_EVENT → __AddEvent   │
│  │ │ Tree    │ │ buffer   ││  │      │    SET_TEXT → __SetAttr     │
│  │ │ (sync)  │ │ (async)  ││  │      │  }                          │
│  │ └─────────┘ └────┬─────┘│  │      │  __FlushElementTree()       │
│  └──────────────────┼──────┘  │      │                             │
│                     │         │      └──────────▲──────────────────┘
│  Event Registry     │ flush   │                 │
│  Map<sign, handler> │         │                 │
│       ▲             │         │   callLepusMethod('vuePatchUpdate',
│       │ direct exec │         │     {data: ops}, callback)
│  publishEvent(sign) ▼         │                 │
│  (from Native)   ─────────────┼─────────────────┘
└────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create package `packages/vue/runtime` (BG Thread)

Vue custom renderer + ShadowElement + ops buffer + event registry.

**Files:**

#### `src/shadow-element.ts` (~80 lines)

Doubly-linked list node, maintains tree structure for Vue's synchronous queries.

```typescript
class ShadowElement {
  static nextId = 1;
  id: number;
  type: string;
  parent: ShadowElement | null = null;
  firstChild: ShadowElement | null = null;
  lastChild: ShadowElement | null = null;
  prev: ShadowElement | null = null;
  next: ShadowElement | null = null;

  insertBefore(child, anchor) {/* linked list operations */}
  removeChild(child) {/* linked list operations */}
}
```

#### `src/ops.ts` (~40 lines)

Operation encoding and buffer management.

```typescript
export const OP = {
  CREATE: 0, // [0, id, type]
  CREATE_TEXT: 1, // [1, id, text]
  INSERT: 2, // [2, parentId, childId, anchorId (-1 = append)]
  REMOVE: 3, // [3, parentId, childId]
  SET_PROP: 4, // [4, id, key, value]
  SET_TEXT: 5, // [5, id, text]
  SET_EVENT: 6, // [6, id, eventType, eventName, sign]
  REMOVE_EVENT: 7, // [7, id, eventType, eventName]
  SET_STYLE: 8, // [8, id, styleKey, styleValue]
  SET_CLASS: 9, // [9, id, classString]
  SET_ID: 10, // [10, id, idString]
} as const;

let buffer: unknown[] = [];
export function pushOp(...args: unknown[]) {
  buffer.push(...args);
}
export function takeOps() {
  const b = buffer;
  buffer = [];
  return b;
}
```

#### `src/node-ops.ts` (~100 lines)

`RendererOptions` implementation. Each method: updates the ShadowElement tree + pushes ops.

- `createElement(type)` -> `new ShadowElement(type)` + `pushOp(OP.CREATE, el.id, type)`
- `createText(text)` -> `new ShadowElement('#text')` + `pushOp(OP.CREATE_TEXT, el.id, text)`
- `insert(child, parent, anchor)` -> `parent.insertBefore(child, anchor)` + `pushOp(OP.INSERT, ...)`
- `remove(child)` -> `parent.removeChild(child)` + `pushOp(OP.REMOVE, ...)`
- `parentNode(node)` -> `return node.parent` (synchronous shadow tree read)
- `nextSibling(node)` -> `return node.next` (synchronous shadow tree read)
- `patchProp(el, key, prev, next)` -> categorized handling:
  - event (`/^on[A-Z]/`, `bind*`, `catch*`, `global-bind*`) -> sign registration + `pushOp(OP.SET_EVENT, ...)`
  - `style` -> `pushOp(OP.SET_STYLE, ...)` or iterate style object
  - `class` -> `pushOp(OP.SET_CLASS, ...)`
  - `id` -> `pushOp(OP.SET_ID, ...)`
  - others -> `pushOp(OP.SET_PROP, ...)`
- `setText(node, text)` -> `pushOp(OP.SET_TEXT, node.id, text)`
- `setElementText(el, text)` -> clear children + create text node (update shadow tree + push ops)

#### `src/event-registry.ts` (~50 lines)

Sign-based handler registration and lookup, purely BG Thread local.

```typescript
const handlers = new Map<string, Function>()
export function register(handler) → sign
export function unregister(sign)
export function execute(sign, data)
export function publishEvent(sign, data) { execute(sign, data) }
```

#### `src/flush.ts` (~30 lines)

Uses Vue's `queuePostFlushCb` to send ops after all reactive updates complete.

```typescript
import { queuePostFlushCb } from '@vue/runtime-core';
let scheduled = false;
export function scheduleFlush() {
  if (scheduled) return;
  scheduled = true;
  queuePostFlushCb(() => {
    scheduled = false;
    const ops = takeOps();
    if (ops.length) {
      lynx.getNativeApp().callLepusMethod('vuePatchUpdate', {
        data: JSON.stringify(ops),
      });
    }
  });
}
```

#### `src/index.ts` (~20 lines)

Creates renderer, exposes `createApp`.

```typescript
import { createRenderer } from '@vue/runtime-core';
const { createApp, render } = createRenderer(nodeOps);
export { createApp, render };
export * from '@vue/runtime-core';
```

#### `src/entry-background.ts` (~20 lines)

BG Thread bootstrap entry:

- Injects `globalThis.publishEvent = publishEvent` (from event-registry)
- Injects `globalThis.renderPage` and other Lynx lifecycle callbacks
- Triggers Vue's initial render + flush in `renderPage`

### Step 2: Create package `packages/vue/main-thread` (Main Thread)

Pure PAPI executor, does not contain Vue.

**Files:**

#### `src/ops-apply.ts` (~80 lines)

Receives ops array, executes PAPI operations one by one.

```typescript
const elements = new Map<number, LynxElement>();

export function applyOps(ops: unknown[]) {
  let i = 0;
  while (i < ops.length) {
    switch (ops[i++]) {
      case OP.CREATE: {/* __CreateView / __CreateText / ... */}
      case OP.INSERT: {/* __AppendElement / __InsertElementBefore */}
      case OP.REMOVE: {/* __RemoveElement */}
      case OP.SET_PROP: {/* __SetAttribute */}
      case OP.SET_EVENT: {/* __AddEvent */}
      case OP.SET_TEXT: {/* __SetAttribute(el, 'text', text) */}
      case OP.SET_STYLE: {/* __AddInlineStyle */}
      case OP.SET_CLASS: {/* __SetClasses */}
      case OP.SET_ID: {/* __SetID */}
    }
  }
  __FlushElementTree();
}
```

#### `src/entry-main.ts` (~15 lines)

Main Thread bootstrap:

- Registers `globalThis.vuePatchUpdate = ({data}) => applyOps(JSON.parse(data))`
- Registers `globalThis.renderPage` -> `__CreatePage()` + marks ready

### Step 3: Create build plugin `packages/vue/rspeedy-plugin`

Based on ReactLynx's `plugin-react` pattern, simplified version.

**Core logic:**

- Splits each entry into `{name}__main-thread` (layer: `vue:main-thread`) and `{name}` (layer: `vue:background`)
- Main thread entry imports: `packages/vue/main-thread/entry-main` + user code
- Background entry imports: `packages/vue/runtime/entry-background` + user code
- Injects `__MAIN_THREAD__` / `__BACKGROUND__` macros (via SWC optimizer globals)
- Configures `RuntimeWrapperWebpackPlugin` (excludes main-thread.js)
- Configures `LynxEncodePlugin` + `LynxTemplatePlugin`
- Configures `DefinePlugin` (`__DEV__`, `__VUE_OPTIONS_API__`, etc.)

**Can heavily reuse the structure of `plugin-react/src/entry.ts`**, replacing React-specific parts (`ReactWebpackPlugin` -> not needed, worklet -> not needed).

### Step 4: Create demo app `packages/vue/e2e-lynx`

Demo to validate the complete pipeline:

```typescript
// index.ts
import {
  createApp,
  ref,
  h,
  defineComponent,
} from '@anthropic-ai/vue-lynx-runtime';

const App = defineComponent({
  setup() {
    const count = ref(0);
    return () =>
      h('view', { style: { display: 'flex', flexDirection: 'column' } }, [
        h('text', null, `Count: ${count.value}`),
        h('view', {
          bindtap: () => {
            count.value++;
          },
        }, [
          h('text', null, 'Tap to increment'),
        ]),
      ]);
  },
});

const app = createApp(App);
app.mount();
```

### Step 5: Verify

1. **Build verification**: `rspeedy build` produces `.lynx.bundle`, containing `main-thread.js` and `background.js`
2. **Bundle content verification**:
   - `background.js` contains Vue runtime-core + user components + ShadowElement
   - `main-thread.js` only contains ops-apply (~80 lines) + entry bootstrap
   - `__MAIN_THREAD__` / `__BACKGROUND__` macros are correctly substituted
3. **Runtime verification**: On Lynx simulator or real device:
   - Static rendering: `<text>` displays text
   - Reactive update: `setInterval` updates ref -> text changes
   - Event handling: `bindtap` -> count increments -> text updates
4. **Ops traffic verification**: After initial render, observe that the ops array for updates only contains changed `SET_TEXT` / `SET_PROP`, not operations for static nodes

---

## File Structure

```
packages/vue/
  runtime/                     # BG Thread — Vue custom renderer
    src/
      shadow-element.ts        # ShadowElement doubly-linked list
      ops.ts                   # Operation encoding + buffer
      node-ops.ts              # RendererOptions implementation
      event-registry.ts        # Sign-based handler registry
      flush.ts                 # queuePostFlushCb → callLepusMethod
      index.ts                 # createApp, render exports
      entry-background.ts      # BG bootstrap
    package.json
    tsdown.config.ts

  main-thread/                 # Main Thread — PAPI executor
    src/
      ops-apply.ts             # Operation executor
      entry-main.ts            # Main Thread bootstrap
    package.json
    tsdown.config.ts

  rspeedy-plugin/              # Build plugin
    src/
      index.ts                 # Plugin entry
      entry.ts                 # Dual-bundle entry splitting
      constants.ts             # Layer names, plugin names
      define.ts                # __MAIN_THREAD__ / __BACKGROUND__ macros
    package.json
    tsdown.config.ts

  e2e-lynx/                    # Demo app
    src/
      index.ts                 # App entry
    lynx.config.ts
    package.json
    tsconfig.json
```

## Key References (existing code to follow/reuse)

| Pattern                                            | Reference File                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Dual-bundle entry splitting                        | `packages/rspeedy/plugin-react/src/entry.ts`                       |
| `__MAIN_THREAD__`/`__BACKGROUND__` macro injection | `packages/webpack/react-webpack-plugin/src/loaders/options.ts`     |
| Operation enum + flat array format                 | `packages/react/runtime/src/lifecycle/patch/snapshotPatch.ts`      |
| BG->Main transmission via `callLepusMethod`        | `packages/react/runtime/src/lifecycle/patch/commit.ts` (L169)      |
| Main Thread ops apply loop                         | `packages/react/runtime/src/lifecycle/patch/snapshotPatchApply.ts` |
| BG shadow tree (BackgroundSnapshotInstance)         | `packages/react/runtime/src/backgroundSnapshot.ts`                 |
| Event sign lookup from BG                          | `packages/react/runtime/src/lynx/tt.ts` (L204-249)                 |
| PAPI type declarations                             | `.context/vue-vine/packages/runtime-lynx/src/shims.d.ts`           |

---

## Post-Implementation Summary

### Actual Implementation vs Plan Deviations

#### 1. Build tool: tsdown -> rslib

The plan used `tsdown.config.ts` to bundle the three packages (runtime/main-thread/rspeedy-plugin). The actual implementation uses **rslib** (`@rslib/core`), consistent with other packages in the monorepo.

Key configuration: `bundle: false` -- the runtime package cannot be bundled into a single bundle because multiple entry points share singleton state (ops buffer, event registry).

#### 2. Immediate mounting, no waiting for renderPage

The plan stated "trigger Vue's initial render in `renderPage`". In practice, Lynx **does not call `renderPage` on the BG Thread** -- that is the Main Thread's job.

**BG Thread lifecycle**: `__init_card_bundle__(lynxCoreInject)` -> AMD wrapper executes -> entry-background.ts initializes. At this point, the Main Thread's `renderPage` has already run (page root id=1 already created), so Vue can **directly `app.mount()`**, no waiting needed.

#### 3. Duplicate bundle evaluation issue

Lynx calls `__init_card_bundle__` twice (two independent globalThis/lynxCoreInject). Guards on the BG side are ineffective (each has its own independent scope), causing ops to be sent in duplicate.

**Solution**: On the MT side, `applyOps` checks at the beginning: if the first CREATE op's id already exists in the elements Map, it means it's a duplicate batch, and the entire ops array is skipped.

#### 4. `ShadowElement.nextId` starts from 2

The page root element on MT always has id=1 (created by `renderPage`). BG-side `ShadowElement.nextId` starts from 2 to avoid id conflicts.

#### 5. entry-background.ts needs dual-path publishEvent setup

Event callbacks need to set both `lynxCoreInject.tt.publishEvent` **and** `globalThis.publishEvent`. Lynx calls from the `lynxCoreInject.tt` path, but some scenarios use `globalThis`. `lynxCoreInject` is an AMD closure variable, not on globalThis.

#### 6. `VueMainThreadPlugin` flat-bundle approach

The plan assumed main-thread code would be bundled directly through webpack entry. In practice, the issue of **`chunkLoading: 'lynx'` causing module factory not to execute** was encountered (`StartupChunkDependenciesPlugin`'s `hasChunkEntryDependentChunks(chunk)` returns false).

**Solution**: rslib pre-compiles main-thread -> `dist/main-thread-bundled.js`, `VueMainThreadPlugin` reads it in using `fs.readFileSync` at the `PROCESS_ASSETS_STAGE_ADDITIONAL` phase and replaces the webpack asset.

#### 7. Comment node -> `__CreateRawText('')`

Vue's Fragment/v-if anchors use comment nodes. Lynx has no comment element type, so `__CreateRawText('')` creates a zero-size text node as an invisible placeholder.

### Verified MVP Capabilities

| Capability                        | Status | Verification Method                        |
| --------------------------------- | ------ | ------------------------------------------ |
| Basic rendering (view/text/image) | Done   | counter demo, todomvc                      |
| CSS inline styles                 | Done   | backgroundColor, padding, fontSize, etc.   |
| Reactive updates                  | Done   | setInterval auto-increment counter         |
| Events (bindtap)                  | Done   | Physical tap triggers handler              |
| CSS class + selector              | Done   | gallery demo (enableCSSSelector: true)      |
| v-if / v-for                      | Done   | todomvc                                    |
| `<list>` virtual list             | Done   | gallery waterfall list                     |
| MTS worklet events                | Done   | mts-demo, swiper                           |
| MainThreadRef element binding     | Done   | mts-draggable, swiper                      |
| MainThreadRef value state         | Done   | swiper (INIT_MT_REF fix)                   |
| runOnMainThread                   | Done   | swiper indicator click                     |
