# vue-lynx

## 0.5.0

### Minor Changes

- feat: element templates (compile-time template lowering, route b) ([#216](https://github.com/Huxpro/vue-lynx/pull/216))

  With `pluginVueLynx({ enableElementTemplates: true })`, eligible template subtrees — plain elements with compile-time-known structure — are lowered into element templates: the static skeleton compiles to a straight-line element-creation function executed on the main thread via a single `INSTANTIATE_TEMPLATE` op, while interior dynamic parts ("holes") receive deterministic ids updated through the ordinary SET ops. One vnode and one op replace per-node vdom/ops/interpreter work.

  Structural features (components, v-if/v-for hosts, slots, refs, runtime directives, `<list>`) always stay on the normal vdom path; template roots keep all their props/directives on the vnode, so Transition/v-show/ref on lowered roots behave unchanged. Scoped-CSS ids are baked into skeletons at compile time. Lowered and unlowered renders produce identical documents, and lowered ops streams hydrate through IFR's fast path unchanged — the two features compose.

  In the interpreter-proxy benchmark this renders typical ~1000-element first screens 7–15× faster and shrinks the cross-thread ops payload 3–1000× (see packages/ifr-bench/REPORT.md). Defaults to following `enableIFR` (element templates attack exactly the cost IFR adds — the synchronous main-thread render); pass `enableElementTemplates: false` to opt out while keeping IFR, or `true` to enable them for the ordinary background pipeline alone. Zero behavior change when off.

- feat: Instant First-Frame Rendering (IFR) ([#216](https://github.com/Huxpro/vue-lynx/pull/216))

  Port of ReactLynx's IFR (首屏直出) to Vue Lynx. With `pluginVueLynx({ enableIFR: true })`, the main-thread bundle carries the full Vue runtime + app code, and the first screen is rendered synchronously on the main thread inside `renderPage` — during `loadTemplate`, before any background JavaScript runs — eliminating the blank first frame.

  When the background thread boots, it renders the same app and its initial ops batches are _hydrated_ against the recorded main-thread ops stream instead of re-applied: identical batches are skipped, value-level differences are patched in place, and structural divergence falls back to a full re-render (correctness never depends on the two renders matching). Element ids and event handler signs are deterministic across both threads, so events bound during the first frame route to background handlers with no re-binding.

  Enabling IFR also enables element templates by default (see the companion changeset); opt out with `enableElementTemplates: false` for debugging/bisection. The new public `isIfrMainThread()` predicate lets network-driven screens opt out of the IFR mount while keeping module evaluation (worklet/template registration) intact.

  Constraints (matching ReactLynx IFR): first-screen render output should be deterministic and thread-agnostic; side effects belong in Composition API lifecycle hooks (`onMounted`, watchers), which never run during the main-thread render (Options API `mounted()` is not yet suppressed there).

### Patch Changes

- Fix persisted CSS transitions used with `v-show` by running the Vue transition lifecycle before changing display state. Preserve the initial transition classes for a rendered frame on both Web and native Lynx so enter and leave animations work on every toggle. ([#249](https://github.com/Huxpro/vue-lynx/pull/249))

- Fix explicit `<page>` roots by reusing Lynx's existing native page instead of creating a second page element. Root attributes, styles, events, scope IDs, and refs are forwarded to the native root, ownership hands off between wrappers across route swaps / `<Transition>` / `<KeepAlive>`, and nesting `<page>` inside a native element fails at compile time. Development builds now preserve the Main Thread bootstrap. Flushes fall back to a bounded timer only until the engine delivers its first real `vuePatchUpdate` acknowledgement, so `nextTick()` keeps its strict "applied on the main thread" guarantee on healthy engines. ([#226](https://github.com/Huxpro/vue-lynx/pull/226))

## 0.4.2

### Patch Changes

- Route native `globalEventFromLepus` global events to `GlobalEventEmitter` and add the `useGlobalEvent` composable. ([#193](https://github.com/Huxpro/vue-lynx/pull/193))

- Fix MT worklet loader dropping non-relative imports from the module graph. Aliased, tsconfig-path, and package worklets are now resolved and followed, so they no longer fail at runtime. Imports inside comments and string/template literals are ignored when following the worklet graph. Adds opt-in `includeWorkletPackages` to follow worklet imports into named `node_modules` packages. ([#190](https://github.com/Huxpro/vue-lynx/pull/190))

- fix(runtime): suppress empty native layout anchors ([#201](https://github.com/Huxpro/vue-lynx/pull/201))

  Vue's renderer emits comment nodes (`v-if`/`v-for` fragment anchors) and empty text nodes as real host nodes. Previously these were materialized on the Lynx Main Thread as native elements. An empty native `<text>` still gets a default line box from Lynx's layout engine, so these anchors introduced phantom vertical spacing between rendered content.

  Comment anchors are now kept entirely off the Main Thread, and empty text nodes are materialized lazily — a native `<text>` element is created only while the node actually holds visible text, and is removed again when its content becomes empty. This eliminates the spurious gaps without changing the Background Thread VNode tree that Vue reconciles against.

- fix(v-model): apply programmatic value changes to native `<input>`/`<textarea>` ([#203](https://github.com/Huxpro/vue-lynx/pull/203))

  `vModelText` pushed value updates to the Main Thread via `OP.SET_PROP` →
  `__SetAttribute(el, 'value', …)`. Native (iOS/Android) treats an input's `value`
  prop as the _initial_ value only — a post-mount attribute write is ignored once
  the control is live — so programmatic model changes (a reset/clear button, or
  any code that reassigns the bound ref) never updated the on-screen field. Typing
  still worked, and web was unaffected because web-core reflects the `value`
  attribute live, which masked the gap.

  On a programmatic change `vModelText` now also invokes the platform's `setValue`
  UI method on the element, which is the supported way to set input text
  imperatively across iOS/Android/Harmony/Web. User keystrokes are unaffected
  (that path already no-ops the value push to avoid clobbering the caret), and the
  `SET_PROP` attribute write is retained for web and the initial value.

## 0.4.1

### Patch Changes

- fix: export `mergeModels` compiler runtime helper ([#187](https://github.com/Huxpro/vue-lynx/pull/187))

  Vue 3.4+'s SFC compiler emits `import { mergeModels } from 'vue'` when `defineModel()` is used alongside an explicit `defineProps()` or `defineEmits()` call. `mergeModels` was missing from vue-lynx's re-exports, which caused an `ESModulesLinkingError` at build time. The helper is now re-exported so this `defineModel()` usage pattern works out of the box.

- fix(types): re-export Vue core type aliases and drop stale Volar plugin entries ([#188](https://github.com/Huxpro/vue-lynx/pull/188))

  - Re-export `Ref`, `ComputedRef`, `WritableComputedRef`, `ShallowRef`, `UnwrapRef`, `UnwrapNestedRefs`, `MaybeRef`, `MaybeRefOrGetter`, `Reactive`, `DeepReadonly`, `VNode`, `VNodeRef`, `VNodeChild`, `DefineComponent`, `FunctionalComponent`, `ComponentInternalInstance`, `SetupContext`, `Plugin`, `Directive`, `InjectionKey`, `PropType`, `ExtractPropTypes`, `EmitsOptions`, `SlotsType`, `WatchOptions`, `WatchHandle`, `WatchStopHandle` from `vue-lynx` so consumers that alias `vue → vue-lynx` for types pick them up.
  - Drop the legacy Volar plugin handlers for Vue Language Tools ≤ 1.8.27 (EOL 2023) and ≤ 2.0.13 (Feb 2024). Only the modern `>= 2.0.14` handler remains; the legacy `version: 1` handler triggered a warning on every run, and the middle handler was strictly subsumed by the modern one.

## 0.4.0

### Minor Changes

- feat(events): implement `withModifiers` — `.once`, `.stop`, `.self`, `.prevent` ([#155](https://github.com/Huxpro/vue-lynx/pull/155))

  `withModifiers` was previously a no-op stub, so event modifiers had no effect at runtime. This implements all four:

  - `.once` — handler fires at most once. The wrapper is cached on `fn._withMods` so the `called` flag is stable across re-renders. Also handles the compiler-emitted `onTapOnce` prop-key path in `node-ops.ts` with a stable `OnceWrapper` per registration.
  - `.stop` — sets `_lynxCatch` on the wrapper so `patchProp` registers a native `catchEvent` binding (the only reliable mechanism since Lynx bubbling is decided on the Main Thread before BG-thread JS handlers run). Also calls `event.stopPropagation()` for DOM/test environments.
  - `.self` — skips the handler when the event originated on a child. Compares by `uid` (Lynx native) or `uniqueId` (Lynx web preview, set by `createCrossThreadEvent`), falling back to reference equality in DOM/test environments. Fixes two bugs where `.self` was unconditionally blocking every event.
  - `.prevent` — accepted as a compatibility no-op so web code runs unmodified. Lynx has no browser default actions to cancel.

  Also fixes `fireEvent` in `@vue-lynx/testing-library` to not `Object.assign` read-only `EventInit` keys (`bubbles`, `cancelable`, `composed`) onto constructed events.

- feat(runtime): support `<KeepAlive>` component (#153) ([`a8ad5ba`](https://github.com/Huxpro/vue-lynx/commit/a8ad5bab11f397f14aa2471f553923fc18512405))

  Caches inactive component instances instead of destroying them. When a component is toggled back in, its state is preserved.

  - `include`, `exclude`, and `max` props are all supported
  - `onActivated` and `onDeactivated` lifecycle hooks fire as expected

- feat: support `<style scoped>` in Vue SFCs (#78) ([#151](https://github.com/Huxpro/vue-lynx/pull/151))

  Bridges Vue's scoped CSS to Lynx's native `cssId` system:

  - Build-time: `VueScopedCSSIdPlugin` injects `?cssId=<N>` into vue scoped style module queries so `@lynx-js/css-extract-webpack-plugin` wraps CSS in `@cssId`
  - Build-time: `vueScopeStripCSSPlugin` removes `[data-v-xxx]` attribute selectors (unsupported by Lynx CSS engine)
  - Runtime: `scope-bridge.ts` converts `__scopeId` to numeric cssId and calls `__SetCSSId` on elements

- feat(runtime): support `<Teleport>` component ([#161](https://github.com/Huxpro/vue-lynx/pull/161))

  Implement `querySelector` via BG-side `idRegistry` to enable `<Teleport to="#target">`
  pattern without cross-thread infrastructure changes.

  - `to` supports `#id` string selectors
  - Dev warning emitted for unsupported selector types
  - idRegistry cleaned up on element removal

- feat(v-once): verify and document `v-once` directive support ([#176](https://github.com/Huxpro/vue-lynx/pull/176))

  `v-once` works in Vue Lynx without any configuration. The SFC template compiler emits a `setBlockTracking(-1/+1)` pair around a `_cache` slot assignment; on subsequent renders the cached VNode is returned directly, so no ops enter the buffer and `callLepusMethod` is never called for that subtree.

  `setBlockTracking` was already re-exported from `@vue/runtime-core` but was undocumented (`@hidden`). This change promotes it to a public, documented export so its role in `v-once` codegen is explicit.

  In Lynx, `v-once` eliminates the entire cross-thread op batch for the cached subtree — not just DOM diffing — making it more impactful than in a browser environment.

- feat(dx): Volar plugin IDE diagnostics and full Lynx element type coverage ([#169](https://github.com/Huxpro/vue-lynx/pull/169))

  - All 19 Lynx built-in elements (`view`, `text`, `image`, `scroll-view`, `list`, `list-item`, `input`, `textarea`, `overlay`, `svg`, and others) now resolve via `GlobalComponents` with correct `VueLynxProps` types — no more "Unknown component" errors or incorrect HTML/SVG attribute types on hover
  - Unsupported event modifier diagnostic: using `.capture` or `.passive` on `v-on` now shows a Lynx-specific IDE error at the modifier site
  - `global-bind*`, `global-catch*`, and `main-thread-*` props typed for both template source and Volar-normalised camelCase forms — no "unknown prop" errors, correct function/ref types, completions work
  - `main-thread-ref` and `mainThreadRef` typed as MainThreadRef-like objects
  - `generate:native-tags` script regenerates the element list after upgrading `@lynx-js/types`

### Patch Changes

- fix(types): widen `class` prop to accept Vue class binding forms ([#174](https://github.com/Huxpro/vue-lynx/pull/174))

## 0.3.1

### Patch Changes

- 83f9212: Include the built `types` output in the published package by running the `types` build as part of the `vue-lynx` package build and watch scripts.

## 0.3.0

### Minor Changes

- 735b678: feat: support `v-bind()` in `<style>` blocks via Lynx-native `useCssVars`

  Implements a Background Thread compatible `useCssVars` that merges CSS custom properties into element inline styles via the ops pipeline. Requires `enableCSSInlineVariables: true` and `enableCSSInheritance: true` in `lynx.config`.

### Patch Changes

- cea2324: fix(dev): prebuild internal package before watch mode

  `pnpm dev` now runs `tsc` for `internal/` before starting watch mode, fixing failures on a clean clone.

## 0.2.0

### Minor Changes

- 940509f: feat(v-model): implement vModelText directive for input/textarea
- 93f3a7d: Add Volar plugin and TypeScript type declarations for Lynx built-in components. Provides proper IDE IntelliSense for elements like `<view>`, `<text>`, `<image>`, etc., with auto-generated types from `@lynx-js/types` and Vue event convention transforms (`bindtap` → `onTap`).

### Patch Changes

- 47a45f2: fix(main-thread): lower rslib syntax to es2019 for LEPUS compatibility
- fix(dev): prebuild internal package before watch mode

  `pnpm dev` now runs `tsc` for `internal/` before starting watch mode, fixing failures on a clean clone.

- 940509f: fix(dx): detect Tailwind v3/v4 mismatch and improve error messages
- 940509f: fix(v-model): allow v-model and @input to coexist on the same element
