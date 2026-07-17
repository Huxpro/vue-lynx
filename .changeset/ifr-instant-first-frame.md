---
"vue-lynx": minor
---

feat: Instant First-Frame Rendering (IFR)

Port of ReactLynx's IFR (首屏直出) to Vue Lynx. With `pluginVueLynx({ enableIFR: true })`, the main-thread bundle carries the full Vue runtime + app code, and the first screen is rendered synchronously on the main thread inside `renderPage` — during `loadTemplate`, before any background JavaScript runs — eliminating the blank first frame.

When the background thread boots, it renders the same app and its initial ops batches are *hydrated* against the recorded main-thread ops stream instead of re-applied: identical batches are skipped, value-level differences are patched in place, and structural divergence falls back to a full re-render (correctness never depends on the two renders matching). Element ids and event handler signs are deterministic across both threads, so events bound during the first frame route to background handlers with no re-binding.

Enabling IFR also enables element templates by default (see the companion changeset); opt out with `enableElementTemplates: false` for debugging/bisection. The new public `isIfrMainThread()` predicate lets network-driven screens opt out of the IFR mount while keeping module evaluation (worklet/template registration) intact.

Constraints (matching ReactLynx IFR): first-screen render output should be deterministic and thread-agnostic; side effects belong in Composition API lifecycle hooks (`onMounted`, watchers), which never run during the main-thread render (Options API `mounted()` is not yet suppressed there).
