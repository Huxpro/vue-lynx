import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      main: './src/index.ts',
    },
    define: {
      __BENCH_MODE__: '"vapor"',
    },
  },
  plugins: [
    pluginVueLynx({
      optionsApi: false,
      vapor: true,
    }),
  ],
});
