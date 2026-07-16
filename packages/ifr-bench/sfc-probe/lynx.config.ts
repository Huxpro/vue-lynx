import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

// One config, four builds. build-matrix.mjs sets the env pair per build:
//   SFC_PROBE_VAPOR=0|1   renderer mode (vdom custom renderer vs pure Vapor)
//   SFC_PROBE_IFR=0|1     enableIFR
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
      vapor: process.env.SFC_PROBE_VAPOR === '1',
      enableIFR: process.env.SFC_PROBE_IFR === '1',
    }),
  ],
});
