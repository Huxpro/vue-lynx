---
"vue-lynx": patch
---

Add compile-time Vapor addressing analysis: each vapor `template()` factory is annotated with `__vlxAddressing` `{ holes, addressed, slotCount }` (REGISTER_TREE preorder slots). Metadata only — runtime behavior unchanged until sparse A1→A2 consumes it.
