---
"vue-lynx": patch
---

CSS `v-bind()` in `<style>` no longer requires `enableCSSInheritance`. `useCssVars` writes the custom properties onto the component root's inline style through the ops pipeline, and the Lynx engine propagates them to descendants (lynx-family/lynx#5912). Requires `enableCSSInlineVariables: true` and Lynx engine ≥ 3.9.0. The css-features example now covers per-row and cross-thread `v-bind()` cases.
