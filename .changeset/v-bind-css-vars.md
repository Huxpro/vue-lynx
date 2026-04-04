---
"vue-lynx": minor
---

feat: support `v-bind()` in `<style>` blocks via Lynx-native `useCssVars`

Implements a Background Thread compatible `useCssVars` that merges CSS custom properties into element inline styles via the ops pipeline. Requires `enableCSSInlineVariables: true` and `enableCSSInheritance: true` in `lynx.config`.
