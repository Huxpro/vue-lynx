# vue-lynx-genui

Generative UI primitives for [Vue Lynx](https://vue.lynxjs.org) — a port of
[`@lynx-js/genui`](https://github.com/lynx-family/lynx-stack/tree/main/packages/genui)
(ReactLynx) to Vue. It exposes **A2UI v0.9** rendering and **OpenUI Lang
v0.5** rendering from one package.

See [`PORTING.md`](../../PORTING.md) at the repository root for the full
parity tracker against the upstream package.

## Installation

```bash
pnpm add vue-lynx-genui vue-lynx
```

## A2UI

A2UI renders agent-generated UI messages that follow the A2UI v0.9 protocol.
Create a message store, push protocol messages into it from your transport,
and render the latest surface with `<A2UI>`.

```ts
import { defineComponent, h } from 'vue-lynx';
import {
  A2UI,
  Button,
  Text,
  createMessageStore,
} from 'vue-lynx-genui/a2ui';

const messageStore = createMessageStore();

export const GenUIScreen = defineComponent({
  setup() {
    return () =>
      h(A2UI, {
        messageStore,
        catalogs: [Text, Button],
        onAction: (action) => {
          // Send the action back to your agent, then push response
          // messages into the same messageStore.
        },
      });
  },
});
```

In SFC templates the render-prop overrides are also available as slots:
`#empty`, `#fallback`, `#error="{ error }"`, `#unsupported="{ info }"`, and
`#surface="{ children, surfaceId }"` (the slot analogue of `wrapSurface`).

Use the A2UI style entry when you want the packaged component styles:

```ts
import 'vue-lynx-genui/a2ui/styles/theme.css';
```

## OpenUI

OpenUI renders OpenUI Lang v0.5 responses through a configurable component
library.

```ts
import { defineComponent, h } from 'vue-lynx';
import { OpenUiRenderer, createOpenUiLibrary } from 'vue-lynx-genui/openui';

const library = createOpenUiLibrary();
const response = 'root = Stack([TextContent("Hello")])';

export const OpenUIScreen = defineComponent({
  setup() {
    return () => h(OpenUiRenderer, { response, library });
  },
});
```

## Demos

`examples/genui` in this repository hosts runnable A2UI and OpenUI demo
apps (`pnpm dev` → `a2ui` and `openui` entries) with the upstream gallery
mock streams and OpenUI scenarios.

## Testing

```bash
pnpm test:unit   # ported upstream store/component suites (vitest)
pnpm test:dom    # dual-thread render tests via vue-lynx-testing-library
```

## License

Apache-2.0
