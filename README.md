# vue-lynx

Vue 3 custom renderer for building [Lynx](https://lynxjs.org) apps.

> [!WARNING]
> **Pre-Alpha** — Expect bugs and enjoy! This project is in active early development. APIs may change without notice.

[![Pre-Alpha](https://img.shields.io/badge/status-pre--alpha-orange)](https://vue.lynxjs.org)
[![Website](https://img.shields.io/badge/docs-vue.lynxjs.org-blue)](https://vue.lynxjs.org)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)

## Installation

```bash
npm install vue-lynx
```

### Peer Dependencies

```bash
npm install @rsbuild/core @rsbuild/plugin-vue
```

## Quick Start

Create `lynx.config.ts`:

```ts
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

export default defineConfig({
  plugins: [pluginVueLynx()],
});
```

Create `src/App.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue-lynx';

const count = ref(0);
</script>

<template>
  <view>
    <text :style="{ fontSize: '20px' }">Count: {{ count }}</text>
    <view :bindtap="() => count++">
      <text>Tap to increment</text>
    </view>
  </view>
</template>
```

Create `src/index.ts`:

```ts
import { createApp } from 'vue-lynx';
import App from './App.vue';

createApp(App).mount();
```

## Documentation

Visit **[vue.lynxjs.org](https://vue.lynxjs.org)** for full documentation, including:

- [Introduction](https://vue.lynxjs.org/guide/introduction.html)
- [Quick Start](https://vue.lynxjs.org/guide/quick-start.html)
- [Swiper Tutorial](https://vue.lynxjs.org/tutorials/swiper.html)
- [Gallery Tutorial](https://vue.lynxjs.org/tutorials/gallery.html)

## Examples

See the [`examples/`](examples/) directory for complete working examples.

## Contributing

```bash
git clone https://github.com/AimWhy/vue-lynx.git
cd vue-lynx
pnpm install
pnpm build
```

Run tests:

```bash
pnpm test
```

Run examples locally:

```bash
cd examples/basic
pnpm install
pnpm dev
```

## License

[Apache-2.0](LICENSE)
