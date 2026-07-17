---
"vue-lynx": patch
---

Seal the IFR first-screen ops snapshot when the sync mount returns, so Suspense / `defineAsyncComponent` resolves on the main thread cannot extend the hydration stream and wipe the tree on mismatch.
