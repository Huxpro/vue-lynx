# vue-lynx

## 0.4.0

### Minor Changes

- feat(runtime): support `<KeepAlive>` component (#153) ([`a8ad5ba`](https://github.com/Huxpro/vue-lynx/commit/a8ad5bab11f397f14aa2471f553923fc18512405))

  Caches inactive component instances instead of destroying them. When a component is toggled back in, its state is preserved.

  - `include`, `exclude`, and `max` props are all supported
  - `onActivated` and `onDeactivated` lifecycle hooks fire as expected

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
