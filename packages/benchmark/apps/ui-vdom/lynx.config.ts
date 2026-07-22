import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

// Unified matrix cells (explicit flags — never rely on enableIFR→ET default):
//   BENCH_CELL=off|ifr|ifr-et|et
// 'et' = intrinsic Code-Template WITHOUT IFR — the four-axis matrix's
// create-benefit cell (#321/#325).
const cell = process.env.BENCH_CELL ?? 'off';
const enableIFR = cell === 'ifr' || cell === 'ifr-et';
const enableElementTemplates = cell === 'ifr-et' || cell === 'et';
const modeLabel =
  cell === 'off'
    ? 'vdom'
    : cell === 'ifr'
    ? 'vdom-ifr'
    : cell === 'et'
    ? 'vdom-et'
    : 'vdom-ifr-et';
const distRoot =
  cell === 'off'
    ? 'dist'
    : cell === 'ifr'
    ? 'dist-ifr'
    : cell === 'et'
    ? 'dist-et'
    : 'dist-ifr-et';

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
      enableIFR,
      enableElementTemplates,
    }),
  ],
});
