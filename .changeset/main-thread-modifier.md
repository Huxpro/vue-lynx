---
"vue-lynx": minor
---

Add `.main-thread` template sugar for main thread script bindings: `@tap.main-thread="onTap"` compiles to `:main-thread-bindtap`, `@tap.main-thread.catch` to `:main-thread-catchtap`, and `:ref.main-thread="boxRef"` to `:main-thread-ref`. The handler still carries the `'main thread'` directive; only the template spelling changes, so existing `main-thread-*` props keep working. Combining `.main-thread` with another event modifier is a compile error rather than a silent drop. The Volar plugin applies the same rewrite so the IDE types the binding as the main thread prop.
