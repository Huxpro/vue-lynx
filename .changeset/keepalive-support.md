---
"vue-lynx": minor
---

feat(runtime): support `<KeepAlive>` component (#153)

Caches inactive component instances instead of destroying them. When a component is toggled back in, its state is preserved.

- `include`, `exclude`, and `max` props are all supported
- `onActivated` and `onDeactivated` lifecycle hooks fire as expected
