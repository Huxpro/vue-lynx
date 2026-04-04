---
"vue-lynx": patch
---

fix(dev): prebuild internal package before watch mode

`pnpm dev` now runs `tsc` for `internal/` before starting watch mode, fixing failures on a clean clone.
