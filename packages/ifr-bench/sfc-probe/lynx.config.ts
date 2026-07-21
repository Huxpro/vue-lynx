import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

// One config, multi-cell builds. build-matrix.mjs sets env per build:
//   SFC_PROBE_VAPOR=0|1     renderer mode
//   SFC_PROBE_IFR=0|1       enableIFR
//   SFC_PROBE_ET=0|1        enableElementTemplates (explicit; never rely on default)
//   SFC_PROBE_SPARSE=0|1    enableSparseNaming (vapor A1 dense vs A2 sparse; #301)
const enableIFR = process.env.SFC_PROBE_IFR === '1';
const enableElementTemplates = process.env.SFC_PROBE_ET === '1';
const enableSparseNaming = process.env.SFC_PROBE_SPARSE !== '0';

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
      enableIFR,
      enableElementTemplates,
      enableSparseNaming,
    }),
  ],
});
