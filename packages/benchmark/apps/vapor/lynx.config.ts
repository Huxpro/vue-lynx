import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

/**
 * Instrumented vapor app. BENCH_CELL selects the delivery/staging cell so
 * the wire-bytes counters (#338 acceptance) can compare:
 *   off    — Data-Template, runtime REGISTER_TREE delivery (default)
 *   bundle — `+b!` (#338): templateDelivery 'bundle'
 *   code   — `+b:c` (#337): templateStaging 'code'
 */
const cell = process.env.BENCH_CELL ?? 'off';
const modeLabel = cell === 'off' ? 'vapor' : `vapor-${cell}`;
const distRoot = cell === 'off' ? 'dist' : `dist-${cell}`;

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
      templateStaging: cell === 'code' ? 'code' : undefined,
      templateDelivery: cell === 'bundle' ? 'bundle' : undefined,
    }),
  ],
});
