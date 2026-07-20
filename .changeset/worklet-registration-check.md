---
"vue-lynx": minor
---

Add a build-time check that every worklet referenced on the background thread (`_wkltId`) is registered on the main thread (`registerWorkletInternal`). A mismatch is the usual cause of the runtime crash `cannot read property 'bind' of undefined` on first interaction, which nothing surfaced at build time before. Controlled by the new `checkWorkletRegistrations` option (`'warn'` by default, `'error'` to fail the build, `'off'` to disable).
