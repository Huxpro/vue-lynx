import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

// Unified matrix cells:
//   BENCH_CELL=off|ifr|ifr-et
//   ifr     — IFR on, ET off (dense CLONE; bisect)
//   ifr-et  — IFR on, ET on  (sparse IFR×ET; product default with IFR)
const cell = process.env.BENCH_CELL ?? 'off';
const enableIFR = cell === 'ifr' || cell === 'ifr-et';
const enableElementTemplates = cell === 'ifr-et';
const modeLabel =
  cell === 'off' ? 'vapor' : cell === 'ifr-et' ? 'vapor-ifr-et' : 'vapor-ifr';
const distRoot =
  cell === 'off' ? 'dist' : cell === 'ifr-et' ? 'dist-ifr-et' : 'dist-ifr';

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
      enableElementTemplates,
    }),
  ],
});
