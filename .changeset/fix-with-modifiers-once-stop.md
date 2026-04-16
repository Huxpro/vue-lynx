---
"vue-lynx": minor
---

feat(events): implement `withModifiers` — `.once`, `.stop`, `.prevent`, `.self`

`withModifiers` was previously a no-op stub that returned the handler unchanged, so event modifiers had no effect at runtime.

This implements all four modifiers:

- `.once` — handler fires at most once; subsequent calls are silently dropped. The wrapper is cached on `fn._withMods` so the same `called` flag is reused across re-renders.
- `.stop` — calls `event.stopPropagation()` and sets `_lynxCatch` on the wrapper so `patchProp` registers a `catchEvent` binding (the native Lynx mechanism for stopping bubble propagation before JS handlers run).
- `.prevent` — calls `event.preventDefault()`.
- `.self` — skips the handler when the event originated from a child element (`event.target !== event.currentTarget`), using uid-based comparison for Lynx events and reference equality in DOM/test environments.

Also fixes `fireEvent` in `@vue-lynx/testing-library` to not `Object.assign` read-only `EventInit` keys (`bubbles`, `cancelable`, `composed`) onto constructed events; only Lynx-specific custom properties are assigned now.
