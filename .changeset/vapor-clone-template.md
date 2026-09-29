---
"vue-lynx": patch
---

Vapor creation-path optimizations:

- Only-child text nodes are aliased onto their host element, so no separate Main Thread text node is created.
- Template instantiation uses the new `REGISTER_TREE`/`CLONE_TREE` ops. The static structure crosses the thread boundary once, and each instance is a single op with deterministically assigned element ids. Only the slots a template actually addresses are named on the Main Thread.

Vapor create-1k-rows drops from 25,000 ops / 428 KB to 7,000 ops / 160 KB per flush (vdom: 17,000 / 327 KB).
