---
"vue-lynx": patch
---

Fix explicit `<page>` roots by reusing Lynx's existing native page instead of creating a second page element. Root attributes, styles, events, scope IDs, and refs are forwarded to the native root, ownership hands off between wrappers across route swaps / `<Transition>` / `<KeepAlive>`, and nesting `<page>` inside a native element fails at compile time. Development builds now preserve the Main Thread bootstrap. Flushes fall back to a bounded timer only until the engine delivers its first real `vuePatchUpdate` acknowledgement, so `nextTick()` keeps its strict "applied on the main thread" guarantee on healthy engines.
