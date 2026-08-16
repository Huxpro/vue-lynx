---
"vue-lynx": patch
---

Release event-prop registrations when a removed subtree reaches the ops-batch
boundary. This prevents removed VDOM and Vapor trees from retaining handlers
while preserving registrations when a subtree is detached and reinserted in
the same batch.
