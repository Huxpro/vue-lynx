---
"vue-lynx": minor
---

feat: support `v-bind()` in `<style>` blocks via Lynx-native `useCssVars`

Implements a Background Thread compatible `useCssVars` that merges CSS custom properties into every element's inline style via the ops pipeline. Requires `enableCSSInlineVariables: true` in `lynx.config`. `enableCSSInheritance` is not required — CSS vars are stamped directly on each element rather than relying on the Lynx engine's CSS var inheritance.
