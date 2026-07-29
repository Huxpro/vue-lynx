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
      main: './src/index.ts',
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
    assetPrefix: `https://vue.lynxjs.org/examples/${exampleName}/dist/`,
  },
});
