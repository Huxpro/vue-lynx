---
"vue-lynx": minor
---

feat: support `v-bind()` in `<style>` blocks via Lynx-native `useCssVars`

Implements a Background Thread compatible `useCssVars` that merges CSS custom properties into the component root element's inline style via the ops pipeline; the Lynx engine propagates them to descendants (lynx-family/lynx#5912, closing #5889). Requires `enableCSSInlineVariables: true` in `lynx.config` and Lynx engine ≥ 3.8.1 (the release containing #5912). `enableCSSInheritance` is not required for `v-bind()` in CSS.
