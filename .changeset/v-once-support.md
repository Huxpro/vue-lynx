---
"vue-lynx": minor
---

feat(v-once): verify and document `v-once` directive support

`v-once` works in Vue Lynx without any configuration. The SFC template compiler emits a `setBlockTracking(-1/+1)` pair around a `_cache` slot assignment; on subsequent renders the cached VNode is returned directly, so no ops enter the buffer and `callLepusMethod` is never called for that subtree.

`setBlockTracking` was already re-exported from `@vue/runtime-core` but was undocumented (`@hidden`). This change promotes it to a public, documented export so its role in `v-once` codegen is explicit.

In Lynx, `v-once` eliminates the entire cross-thread op batch for the cached subtree — not just DOM diffing — making it more impactful than in a browser environment.
