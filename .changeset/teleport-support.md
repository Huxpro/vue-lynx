---
"vue-lynx": minor
---

feat(runtime): support `<Teleport>` component

Implement `querySelector` via BG-side `idRegistry` to enable `<Teleport to="#target">`
pattern without cross-thread infrastructure changes.

- `to` supports `#id` string selectors
- Dev warning emitted for unsupported selector types
- idRegistry cleaned up on element removal
