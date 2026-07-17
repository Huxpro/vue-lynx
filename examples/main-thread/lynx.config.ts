import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

const exampleName = path.basename(path.dirname(fileURLToPath(import.meta.url)));

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
      'shared-module': './src/shared-module/index.ts',
    },
  },
  plugins: [
    pluginVueLynx({
      // IFR: render the first screen on the main thread during
      // loadTemplate, then hydrate when the background thread boots.
      enableIFR: true,
      optionsApi: false,
      enableCSSSelector: true,
    }),
  ],
  output: {
    filename: '[name].[platform].bundle',
    assetPrefix: `https://vue.lynxjs.org/examples/${exampleName}/dist/`,
  },
});
