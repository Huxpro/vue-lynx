---
"vue-lynx": patch
---

Vapor creation-path optimizations: only-child text nodes are aliased onto
their host element (no separate Main-Thread text node), and template
instantiation uses new REGISTER_TEMPLATE/CLONE_TEMPLATE ops — the static
structure crosses the thread boundary once, each instance is a single op
with deterministically assigned element ids. Vapor create-1k-rows drops
from 25,000 ops / 428 KB to 7,000 ops / 160 KB per flush (vdom: 17,000 /
327 KB).
