# vue-lynx

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
