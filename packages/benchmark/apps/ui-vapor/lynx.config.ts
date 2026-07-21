import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

// Unified matrix cells (Vapor has no Element Templates path):
//   BENCH_CELL=off|ifr
const cell = process.env.BENCH_CELL ?? 'off';
const enableIFR = cell === 'ifr';
const modeLabel = cell === 'off' ? 'vapor' : 'vapor-ifr';
const distRoot = cell === 'off' ? 'dist' : 'dist-ifr';

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  output: {
    distPath: {
      root: distRoot,
    },
  },
  source: {
    entry: {
      main: './src/index.ts',
    },
    define: {
      __BENCH_MODE__: JSON.stringify(modeLabel),
    },
  },
  plugins: [
    pluginVueLynx({
      optionsApi: false,
      vapor: true,
      enableIFR,
      // Explicit: vapor never enables ET.
      enableElementTemplates: false,
    }),
  ],
});
