# Vue Vine x Lynx Implementation Analysis

## Overview

The `vue-vine/exp/vue-vine-lynx` branch implements a "Vue on Lynx" solution based on Vue Vine through 18 commits. The core approach is: leverage Vue 3's Custom Renderer API to build a complete rendering pipeline for Lynx's dual-thread architecture (Main Thread + Background Thread), while reusing Vue Vine's functional component syntax.

### New Packages

| Package                             | Purpose                                                         |
| ----------------------------------- | --------------------------------------------------------------- |
| `@vue-vine/runtime-lynx`            | Vue 3 custom renderer + dual-thread event system + Worklet runtime |
| `@vue-vine/rspeedy-plugin-vue-vine` | Rspeedy/Rsbuild build plugin, handles dual-bundle splitting     |
| `packages/e2e-lynx`                 | Demo/test application (progressive showcase from day-1 to day-4) |

### Modified Core Modules

| Module                   | Changes                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `packages/compiler`      | Added Lynx transform (worklet extraction), `'main thread'` / `'background only'` directive analysis |
| `packages/rspack-loader` | Inject `LYNX_BUILTIN_COMPONENTS` as custom elements                                          |
| `packages/vue-vine`      | Added `lynx-shims.d.ts` type definitions                                                     |

---

## 1. Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Lynx Native Platform                    │
├────────────────────────────┬────────────────────────────────┤
│     Main Thread (Lepus)    │     Background Thread          │
│  ┌──────────────────────┐  │  ┌──────────────────────────┐  │
│  │ Vue 3 Custom Renderer│  │  │ Only handles event       │  │
│  │ (PAPI access)        │  │  │ forwarding               │  │
│  │                      │  │  │ (no PAPI access)         │  │
│  │ - createElement      │  │  │                          │  │
│  │ - patchProp          │  │  │ publishEvent()           │  │
│  │ - insert/remove      │  │  │   → forwardToMainThread  │  │
│  │ - event handlers     │  │  │                          │  │
│  │ - worklet runtime    │  │  │ re-export @vue/runtime-  │  │
│  └──────────────────────┘  │  │   core (for types)       │  │
│           ↑                │  └──────────────────────────┘  │
│           └────── dispatchEvent('vue-vine-event') ──────────│
└─────────────────────────────────────────────────────────────┘
```

**Key Design Decision: Vue rendering runs on the Main Thread.**

Unlike ReactLynx (where rendering logic is on the Background Thread, syncing to the Main Thread via element tree diff), the Vue Vine approach runs the entire Vue Custom Renderer on the Main Thread (Lepus) -- because Lepus has PAPI access and can directly call native APIs like `__CreateView()`, `__AppendElement()`, etc. The Background Thread is simplified to a pure event relay layer.

---

## 2. Runtime-Lynx Details

### 2.1 Custom Renderer (renderer/)

**`renderer/index.ts`** -- Creates a Vue custom renderer using `createRenderer<LynxElement, LynxElement>()`, exposing a `createLynxApp()` factory function.

Core design: **Deferred mounting**

```typescript
// app.mount() does not execute immediately, only marks as pending
const mount = (): ComponentPublicInstance => {
  __mountPending = true;
  return __mountedInstance ?? {};
};

// Actual mounting happens when Lynx Native calls renderPage()
function executeMountToPage(page: LynxElement) {
  const vnode = createVNode(rootComponent, rootProps);
  render(vnode, page);
  __FlushElementTree();
}
```

**`renderer/node-ops.ts`** -- Maps Vue DOM operations to Lynx PAPI:

| Vue Operation                   | Lynx PAPI                                      |
| ------------------------------- | ---------------------------------------------- |
| `createElement('view')`         | `__CreateView(componentId)`                    |
| `createElement('text')`         | `__CreateText(componentId)`                    |
| `createElement('image')`        | `__CreateImage(componentId)`                   |
| `createElement('scroll-view')`  | `__CreateScrollView(componentId)`              |
| `createText(str)`               | `__CreateRawText(str)`                         |
| `insert(child, parent)`         | `__AppendElement(parent, child)`               |
| `insert(child, parent, anchor)` | `__InsertElementBefore(parent, child, anchor)` |
| `remove(child)`                 | `__RemoveElement(parent, child)`               |
| `setText(node, text)`           | `__SetAttribute(node, 'text', text)`           |

Each operation is followed by a call to `scheduleLynxFlush()` for batch submission.

**`renderer/patch-prop.ts`** -- Property updates, supporting 4 event binding modes:

1. **Vue-style events** (`onTap`, `onClick` -> `/^on[A-Z]/`)
   - Converted to Lynx event names: `onTap` -> `tap`
   - Handler registered in registry, obtains a sign, calls `__AddEvent(el, 'bindEvent', eventName, sign)`

2. **Lynx native events** (`bindtap`, `catchtap`, `global-bindscroll`)
   - Regex matching: `/^(global-bind|bind|catch|...)(\w+)/i`
   - Also registered via the sign mechanism

3. **Main Thread Worklet events** (`main-thread:bindtap`)
   - Regex matching: `/^main-thread:(global-bind|bind|catch|...)(\w+)/i`
   - After detecting `isWorklet(nextValue)`, the worklet object is passed directly to `__AddEvent`

4. **Regular properties**: `class` -> `__SetClasses()`, `style` -> `__AddInlineStyle()` (camelCase to kebab-case), `id` -> `__SetID()`, others -> `__SetAttribute()`

### 2.2 Event System

**Three-layer architecture:**

```
Background Thread                Main Thread
┌───────────────────┐           ┌──────────────────────────┐
│ publishEvent-     │           │ event-registry.ts        │
│   Background()    │           │ ┌──────────────────────┐ │
│                   │           │ │ Map<sign, handler>   │ │
│ → forwardEvent-   │  dispatch │ │                      │ │
│   ToMainThread()  ├──────────→│ │ executeEventHandler()│ │
│                   │ 'vue-vine │ └──────────────────────┘ │
│ event-forward.ts  │  -event'  │                          │
└───────────────────┘           │ event-receive.ts         │
                                │ setupEventsReceive()     │
                                └──────────────────────────┘
```

- **Sign mechanism**: Each event handler generates a 6-character random sign upon registration (`Math.random().toString(36)`), used to reference handlers across threads
- **Cross-thread communication**: `lynx.getCoreContext().dispatchEvent({type: 'vue-vine-event', data: JSON.stringify({handlerSign, eventData})})`
- **Main Thread reception**: `lynx.getJSContext().addEventListener('vue-vine-event', callback)`

### 2.3 Worklet Runtime

`worklet-runtime.ts` implements high-performance event handling on the Main Thread (no cross-thread overhead):

- **Worklet object structure**: `{ _wkltId: string, _c?: object }` (closure context)
- **Registration**: `registerWorklet("main-thread", id, fn)` stores into global `_workletMap`
- **Execution**: `runWorklet(worklet, params)` looks up and executes the function; `elementRefptr` in parameters is automatically wrapped as `MainThreadElement`
- **`MainThreadElement`** wrapper class: provides `setAttribute()`, `setStyleProperty()`, `setStyleProperties()` methods, directly calling PAPI with batch flush

### 2.4 Scheduler

```typescript
let flushScheduled = false;
function scheduleLynxFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  queuePostFlushCb(() => {
    flushScheduled = false;
    __FlushElementTree();
  });
}
```

Uses Vue's `queuePostFlushCb()` to ensure that after all reactive updates complete, `__FlushElementTree()` is called only once.

### 2.5 Entry Files

**Main Thread (`entry-main.ts`)**:

1. `setupLynxEnv()` -- Initializes `lynx.__initData`, `lynx.reportError`, `processData`
2. `injectCalledByNative()` -- Injects Lynx lifecycle callbacks like `renderPage()`, `updatePage()`
3. `initWorkletRuntime()` -- Initializes worklet mapping and event listeners
4. `setupEventsReceive()` -- Listens for cross-thread events
5. Exports `createLynxApp` and `render`

**Background Thread (`entry-background.ts`)**:

- Only injects `publishEvent` -> `forwardEventToMainThread()`
- Re-exports all content from `@vue/runtime-core`

---

## 3. Compiler Changes

### 3.1 `'main thread'` / `'background only'` Directive

**Analysis phase** (`analyze.ts`): Traverses all function declarations/arrow functions/function expressions, detecting directives in function bodies:

```typescript
function handler() {
  'main thread'; // <- Recognized as VineLynxDirectiveType
  // ...
}
```

**Transform phase** (`transform/lynx.ts`):

For `'main thread'` functions:

1. Extract function body as internal variable `__vine_wklt_${fnName}_fn`
2. Replace original variable with worklet object `{ _wkltId: "${md5Hash}:${index}" }`
3. Inject conditional registration code:

```javascript
if (typeof __MAIN_THREAD__ !== 'undefined' && __MAIN_THREAD__) {
  globalThis.registerWorklet?.(
    'main-thread',
    '${wkltId}',
    __vine_wklt_handler_fn,
  );
}
```

For `'background only'` functions:

- Wrapped in `if (__BACKGROUND__) { ... }`, tree-shaken out in the Main Thread bundle

### 3.2 Template Compilation Adaptation

In `template/compose.ts`, when `lynx.enabled`:

- `runtimeModuleName` changes from `'vue'` to `'@vue-vine/runtime-lynx'`
- Avoids importing `@vue/runtime-dom` (contains DOM APIs, unavailable in Lepus)

### 3.3 Import Management

In `transform/steps.ts` and `transform.ts`:

- Dynamically selects runtime module based on `lynx.enabled`
- `import { defineComponent, ... } from '@vue-vine/runtime-lynx'` (instead of `'vue'`)

### 3.4 Custom Element Registration

In `rspack-loader/context.ts`:

```typescript
if (compilerOptions.lynx?.enabled) {
  compilerOptions.vueCompilerOptions.isCustomElement = (tag) =>
    LYNX_BUILTIN_COMPONENTS.includes(tag); // view, text, image, scroll-view, ...
}
```

Prevents Vue from treating Lynx native components as custom components.

---

## 4. Build System (rspeedy-plugin-vue-vine)

### 4.1 Dual-Bundle Splitting

The plugin splits each entry into two rspack entries:

| Entry                 | Layer                  | Entry File                                                   | Output           |
| --------------------- | ---------------------- | ------------------------------------------------------------ | ---------------- |
| `{name}__main-thread` | `vue-vine:main-thread` | `@vue-vine/runtime-lynx/entry-main` + user code             | `main-thread.js` |
| `{name}`              | `vue-vine:background`  | `@vue-vine/runtime-lynx/entry-background` + user code       | `background.js`  |

### 4.2 Compile-Time Macros

Compile-time constant substitution via SWC optimizer's `globals`:

| Macro                 | Main Thread | Background      |
| --------------------- | ----------- | --------------- |
| `__MAIN_THREAD__`     | `true`      | `false`         |
| `__BACKGROUND__`      | `false`     | `true`          |
| `__DEV__`             | Per env     | Per env         |
| `__VUE_OPTIONS_API__` | `true`      | `true`          |

### 4.3 Loader Pipeline

Each layer has independent loader rules:

```
.vine.ts files:  vine-loader → swc-loader (macro injection)
Regular .ts files:  swc-loader (macro injection only)
```

`vine-loader` uses `compilerOptions: { lynx: { enabled: true } }` to trigger Lynx compilation mode.

### 4.4 Webpack Plugin Chain

1. **`MainThreadAssetMarkerPlugin`** -- Marks Main Thread output with `lynx:main-thread: true`
2. **`RuntimeWrapperWebpackPlugin`** -- Wraps background JS into Lynx-executable format
3. **`LynxEncodePlugin`** -- Inline script encoding
4. **`LynxTemplatePlugin`** -- Generates `.lynx.bundle` (targetSdkVersion: '3.2')
5. **`DefinePlugin`** -- Injects shared compile-time constants

---

## 5. Demo Application Progression

| Phase | File            | Capabilities                                                                                                                    |
| ----- | --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Day 1 | `day-1.ts`      | Pure `h()` render function, static `<view>` + `<text>`, validates basic rendering pipeline                                      |
| Day 2 | `day-2.ts`      | `ref()` reactivity + `setInterval` periodic updates + `bindtap` event binding                                                   |
| Day 3 | `day-3.vine.ts` | Vue Vine template syntax `vine\`...\``, component composition, template interpolation                                           |
| Day 4 | `day-4.vine.ts` | **Core breakthrough**: Background vs Main Thread event comparison, `scroll-view` + `global-bindscroll`, Main Thread direct `setStyleProperty()` manipulation |

Day 4 simultaneously demonstrates the performance difference between two event handling modes:

- **Background mode**: `global-bindscroll` -> update `ref()` -> trigger re-render -> cross-thread sync
- **Main Thread mode**: `main-thread:global-bindscroll` -> worklet directly calls PAPI -> zero latency

---

## 6. Comparison with ReactLynx

| Dimension             | Vue Vine on Lynx                   | ReactLynx                      |
| --------------------- | ---------------------------------- | ------------------------------ |
| **Rendering Thread**  | Main Thread (Lepus)                | Background Thread              |
| **Cross-Thread Sync** | Events from BG -> Main (one-way)   | Element Tree diff from BG -> Main |
| **PAPI Access**       | Direct calls in renderer           | Indirect via diff              |
| **Bundle Count**      | 2 (main-thread.js + background.js) | 2 (same)                       |
| **BG Thread Role**    | Event forwarding only              | Runs React + generates element tree |
| **MT Thread Role**    | Vue rendering + event handling + Worklet | Applies diff + event forwarding |
| **Worklet**           | Compiler extracts `'main thread'` functions | `'main thread'` directive + compiler |
| **Template Syntax**   | `vine\`<view>...\``               | JSX `<view>...`                |

**Core Difference**: The Vue Vine approach centralizes all UI logic on the Main Thread, leveraging Lepus's PAPI to directly manipulate the element tree, simplifying cross-thread communication. The trade-off is heavier JS load on the Main Thread, but it avoids the element tree diff and synchronization mechanism required by ReactLynx.

---

## 7. Key Implementation Insights

1. **Sign-based event registration**: Uses 6-character random strings as cross-thread event references, avoiding function serialization
2. **Deferred mounting pattern**: `app.mount()` only marks as pending; the actual VNode tree creation happens when the `renderPage()` callback fires
3. **Single-flush strategy**: All DOM operations call `scheduleLynxFlush()` afterward, using `queuePostFlushCb` to ensure `__FlushElementTree()` is called only once per tick
4. **Compiler worklet extraction**: Uses MD5(fileId:fnName:index) to generate deterministic worklet IDs, ensuring stability across builds
5. **Minimal Background Bundle**: The background thread only contains `event-forward.ts` (~30 lines), excluding the Vue renderer
6. **`isCustomElement` injection**: Automatically marks `view/text/image/...` as custom elements at the rspack-loader layer, avoiding Vue compilation warnings
