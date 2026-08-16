---
"vue-lynx": patch
---

Reduce per-element Background Thread memory by sharing the immutable empty
scope and transition class state until a class is first added.
