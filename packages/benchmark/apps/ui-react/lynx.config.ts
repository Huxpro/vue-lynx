import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';

const autoRowsRaw = process.env.BENCH_AUTOROWS;
const autoRows = autoRowsRaw === undefined ? 0 : Number(autoRowsRaw);
if (autoRowsRaw?.trim() === '' || !Number.isSafeInteger(autoRows) || autoRows < 0) {
  throw new Error('BENCH_AUTOROWS must be a non-negative safe integer');
}

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      main: './src/index.tsx',
    },
    define: {
      __BENCH_AUTOROWS__: JSON.stringify(autoRows),
    },
  },
  plugins: [pluginReactLynx()],
});
