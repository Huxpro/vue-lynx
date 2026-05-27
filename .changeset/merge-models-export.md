---
"vue-lynx": patch
---

fix: export `mergeModels` compiler runtime helper

Vue 3.4+'s SFC compiler emits `import { mergeModels } from 'vue'` when `defineModel()` is used alongside an explicit `defineProps()` or `defineEmits()` call. `mergeModels` was missing from vue-lynx's re-exports, which caused an `ESModulesLinkingError` at build time. The helper is now re-exported so this `defineModel()` usage pattern works out of the box.
