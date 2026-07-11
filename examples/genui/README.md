# GenUI examples (A2UI + OpenUI)

Vue Lynx port of the upstream `@lynx-js/genui` playground Lynx demos
(`playground/lynx-src`), extended with a standalone demo picker.

Two entries:

- **`a2ui`** — renders the A2UI v0.9 gallery mock streams through
  `vue-lynx-genui/a2ui`'s `<A2UI>` with a mock agent (streamed message
  pacing, action mocks, theme toggle).
- **`openui`** — renders the OpenUI Lang v0.5 scenarios through
  `vue-lynx-genui/openui`'s `OpenUiRenderer`, including `Query()`/
  `Mutation()` demos backed by a mock tool provider.

```bash
pnpm dev    # rspeedy dev server (lynx + web)
pnpm build  # dist/{a2ui,openui}.{lynx,web}.bundle
```

Recognized `globalProps` (parity with the upstream preview contract):
`messages` / `rawText` (inline payload), `demo` / `scenario` (picker
preselect), `instant`, `speed`, `theme`, and `chromeless` (hide the picker
toolbar; used by the screenshot comparison harness).
