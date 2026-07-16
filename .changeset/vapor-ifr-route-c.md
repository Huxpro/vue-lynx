---
"vue-lynx": minor
---

Add Instant First-Frame Rendering to pure Vapor builds. Set `vapor: true` and `enableIFR: true` to render synchronous first-screen content during `loadTemplate`, then hydrate it with the authoritative Background render.

Vapor IFR uses deterministic `REGISTER_TEMPLATE` and `CLONE_TEMPLATE` replay. It skips matching operations, patches value differences, adopts Background worklet and ref state, and rebuilds from the complete Background stream after a structural mismatch.
