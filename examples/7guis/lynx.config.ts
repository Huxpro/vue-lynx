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
  output: {
    assetPrefix: `https://vue.lynxjs.org/examples/${exampleName}/dist/`,
  },
  source: {
    entry: {
      counter: './src/counter/index.ts',
      'temperature-converter': './src/temperature-converter/index.ts',
      'flight-booker': './src/flight-booker/index.ts',
      timer: './src/timer/index.ts',
      crud: './src/crud/index.ts',
      'circle-drawer': './src/circle-drawer/index.ts',
      cells: './src/cells/index.ts',
    },
  },
  plugins: [
    pluginVueLynx({
      // IFR: render the first screen on the main thread during
      // loadTemplate, then hydrate when the background thread boots.
      enableIFR: true,
      optionsApi: false,
    }),
  ],
});
