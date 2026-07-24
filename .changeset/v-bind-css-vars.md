---
"vue-lynx": minor
---

feat: support `v-bind()` in `<style>` blocks via Lynx-native `useCssVars`

Implements a Background Thread compatible `useCssVars` that merges CSS custom properties into the component root element's inline style via the ops pipeline; the Lynx engine propagates them to descendants (lynx-family/lynx#5912, closing #5889). Requires `enableCSSInlineVariables: true` in `lynx.config` and Lynx engine ≥ 3.9.0 (the first tagged release containing the #5912 propagation code). `enableCSSInheritance` is not required for `v-bind()` in CSS.
