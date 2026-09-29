---
"vue-lynx": patch
---

Fix three event and build issues:

- When a component's root element has its own event listener and the parent
  also passes one for the same event (for example, both use `@tap`), both
  handlers now run. Before this fix, the merged listener array broke dispatch
  and neither handler fired.
- Setting a `.stop` handler (`@tap.stop`, `@tap.once.stop`) to `null` now
  removes its native `catchEvent` listener on the Main Thread. Before this
  fix, the listener stayed registered.
- The plugin now aliases `vue` to an absolute path to the vue-lynx runtime
  entry (`vue-lynx/vapor` when Vapor is enabled). Apps using pnpm strict
  layouts, where dependencies such as vue-router cannot see `vue-lynx` in
  `node_modules`, now build.
