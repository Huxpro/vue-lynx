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
      ScrollViewBasic: './src/ScrollViewBasic/index.ts',
      ListBasic: './src/ListBasic/index.ts',
      ListWaterfall: './src/ListWaterfall/index.ts',
      ListInfinite: './src/ListInfinite/index.ts',
    },
  },
  plugins: [
    pluginVueLynx({
      optionsApi: false,
    }),
  ],
});
