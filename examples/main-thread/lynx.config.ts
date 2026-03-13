import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      'background-draggable': './src/background-draggable/index.ts',
      'main-thread-draggable': './src/main-thread-draggable/index.ts',
      'main-thread-draggable-raw': './src/main-thread-draggable-raw/index.ts',
      'cross-thread-calls': './src/cross-thread-calls/index.ts',
    },
  },
  plugins: [
    pluginVueLynx({
      optionsApi: false,
      enableCSSSelector: true,
    }),
  ],
  output: {
    filename: '[name].[platform].bundle',
  },
});
