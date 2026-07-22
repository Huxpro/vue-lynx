---
"vue-lynx": patch
---

Fix event-registry leaks when `<Transition>` / `<TransitionGroup>` without an explicit `duration` is interrupted before `transitionend`/`animationend`. `whenTransitionEnds()` now arms a bounded fallback cleanup with a per-element generation guard so stranded handlers are unregistered.
