# vue-lynx

Vue 3 custom renderer for building [Lynx](https://lynxjs.org) apps.

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

- [Swiper Tutorial](docs/tutorial-swiper.md) ([中文](docs/tutorial-swiper-zh.md))
- [Gallery Tutorial](docs/tutorial-gallery.md) ([中文](docs/tutorial-gallery-zh.md))

## Examples

See the [`examples/`](examples/) directory for complete working examples.

## License

[Apache-2.0](LICENSE)
