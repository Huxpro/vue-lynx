---
"vue-lynx": patch
---

Fix a Main Thread memory leak: the element registry now releases removed
subtrees (deferred to batch end so KeepAlive/Teleport moves are unaffected).
Previously every removed element was retained forever, degrading repeated
large list create/clear cycles from ~1.2s to ~27s per create through GC
pressure.
