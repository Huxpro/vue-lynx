---
"vue-lynx": minor
---

feat(dx): Volar plugin IDE diagnostics and full Lynx element type coverage

- All 19 Lynx built-in elements (`view`, `text`, `image`, `scroll-view`, `list`, `list-item`, `input`, `textarea`, `overlay`, `svg`, and others) now resolve via `GlobalComponents` with correct `VueLynxProps` types — no more "Unknown component" errors or incorrect HTML/SVG attribute types on hover
- Unsupported event modifier diagnostic: using `.capture` or `.passive` on `v-on` now shows a Lynx-specific IDE error at the modifier site
- `global-bind:*`, `global-catch:*`, and `main-thread:*` props typed via template literal index signatures (both kebab-case and camelCase forms) — no "unknown prop" errors, correct function type, completions work
- `main-thread-ref` and `mainThreadRef` explicitly typed as `string`
- `generate:native-tags` script regenerates the element list after upgrading `@lynx-js/types`
