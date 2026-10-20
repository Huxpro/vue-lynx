---
"vue-lynx": minor
---

Add `move` to `<TransitionGroup>`: children that change position animate from their previous place (FLIP), on the main thread. The main thread has no synchronous bounds call, so every keyed child's last laid-out rect is remembered from its `layoutchange` event; a reorder sends FLIP_MOVE in the same batch, and the next `layoutchange` of a moved child animates the delta back to zero with the engine's own `__ElementAnimate`. `move` is `true` for 300ms or a duration in milliseconds, `moveEasing` is the timing function; `moveClass` stays unused on Lynx. Nothing crosses back to the background thread.
