import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

// Identical to apps/vapor, except `vaporBuildTimeTemplates: true` — this app
// exists to measure the effect of the issue #234 Part A flag (build-time
// structured templates) against the otherwise-identical apps/vapor workload.
export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      main: './src/index.ts',
    },
    define: {
      __BENCH_MODE__: '"vapor-bt"',
    },
  },
  plugins: [
    pluginVueLynx({
      optionsApi: false,
      vapor: true,
      vaporBuildTimeTemplates: true,
    }),
  ],
});
