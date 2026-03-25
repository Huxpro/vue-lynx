# TodoMVC Codex

A closer TodoMVC reference clone for Vue Lynx, rebuilt against the canonical Vue TodoMVC behavior instead of the original one-shot prototype.

## What It Demonstrates

- TodoMVC-style add / edit / toggle / clear-completed flows
- Deep-persisted todo state via a storage adapter
- Route-driven filters with `vue-router`
- Web hash routing parity (`#/`, `#/active`, `#/completed`)
- Lynx-safe fallback to `createMemoryHistory()`
- Lynx-native input binding with `:value + @input`
- Tap the todo text to enter editing

## Reference Targets

- TodoMVC Vue reference: <https://github.com/tastejs/todomvc/tree/gh-pages/examples/vue>
- Deployed example: <https://todomvc.com/examples/vue/dist/#/>

## Lynx Adaptations

- Web uses `createWebHashHistory()` so filters behave like the TodoMVC reference.
- Lynx uses `createMemoryHistory()` because there is no `window.location`.
- Native `<input>` still uses manual binding, so the data flow is explicit.
- Editing is intentionally bound to tapping the todo text area, which is simpler and consistent across platforms.
