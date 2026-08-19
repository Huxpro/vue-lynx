---
"vue-lynx": minor
---

Add Instant First-Frame Rendering to pure Vapor builds. Set `vapor: true` and `enableIFR: true` to render synchronous first-screen content during `loadTemplate`, then hydrate it with the authoritative Background render.

Vapor IFR uses deterministic `REGISTER_TEMPLATE` and `CLONE_TEMPLATE` replay. It skips matching operations, patches value differences, adopts Background worklet and ref state, and rebuilds from the complete Background stream after a structural mismatch.

In Vapor mode the build now rewrites free DOM constructor identifiers (`Node`, `Element`, `Text`, …) to ShadowElement-aware shim globals, matching the existing `document`/`window` rewrite. On Lynx for Web the Main-Thread chunk executes on the page's main thread, where real DOM globals otherwise capture runtime-vapor's `instanceof` classification and crash the IFR first frame into fallback.
