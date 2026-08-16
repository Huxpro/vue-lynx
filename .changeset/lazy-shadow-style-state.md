---
"vue-lynx": patch
---

Reduce per-element Background Thread memory by sharing an immutable empty
inline-style state until style mutation first requires owned storage.
