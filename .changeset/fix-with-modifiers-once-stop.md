---
"vue-lynx": minor
---

feat(events): implement `withModifiers` — `.once`, `.stop`, `.self`, `.prevent`

`withModifiers` was previously a no-op stub, so event modifiers had no effect at runtime. This implements all four:

- `.once` — handler fires at most once. The wrapper is cached on `fn._withMods` so the `called` flag is stable across re-renders. Also handles the compiler-emitted `onTapOnce` prop-key path in `node-ops.ts` with a stable `OnceWrapper` per registration.
- `.stop` — sets `_lynxCatch` on the wrapper so `patchProp` registers a native `catchEvent` binding (the only reliable mechanism since Lynx bubbling is decided on the Main Thread before BG-thread JS handlers run). Also calls `event.stopPropagation()` for DOM/test environments.
- `.self` — skips the handler when the event originated on a child. Compares by `uid` (Lynx native) or `uniqueId` (Lynx web preview, set by `createCrossThreadEvent`), falling back to reference equality in DOM/test environments. Fixes two bugs where `.self` was unconditionally blocking every event.
- `.prevent` — accepted as a compatibility no-op so web code runs unmodified. Lynx has no browser default actions to cancel.

Also fixes `fireEvent` in `@vue-lynx/testing-library` to not `Object.assign` read-only `EventInit` keys (`bubbles`, `cancelable`, `composed`) onto constructed events.
