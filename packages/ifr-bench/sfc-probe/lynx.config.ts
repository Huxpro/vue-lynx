import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

// One config, multi-cell builds. build-matrix.mjs sets env per build:
//   SFC_PROBE_VAPOR=0|1     renderer mode
//   SFC_PROBE_IFR=0|1       enableIFR
//   SFC_PROBE_ET=0|1        enableElementTemplates (explicit; never rely on default)
//   SFC_PROBE_SPARSE=0|1    templateNaming sparse|dense (Named Tree vs Data-Template; #301/#321)
//   SFC_PROBE_STAGING=…     templateStaging override (e.g. 'engine' for the Engine-Template cell; #323)
//   SFC_PROBE_IFR_PAINT=…   ifrPaint ('plain'|'disposable-et'|'engine-et'; #324)
const enableIFR = process.env.SFC_PROBE_IFR === '1';
const enableElementTemplates = process.env.SFC_PROBE_ET === '1';
const templateNaming = process.env.SFC_PROBE_SPARSE === '0' ? 'dense' as const : 'sparse' as const;
const templateStaging = process.env.SFC_PROBE_STAGING as
  | 'opstream' | 'data' | 'code' | 'engine' | undefined;
const ifrPaint = process.env.SFC_PROBE_IFR_PAINT as
  | 'plain' | 'disposable-et' | 'engine-et' | undefined;

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
      templateNaming,
      templateStaging,
      ifrPaint,
    }),
  ],
});
