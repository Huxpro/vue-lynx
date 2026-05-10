# vue-lynx

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
