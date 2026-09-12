import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';

// Keep the product-default comparator and the experimental Element Template
// comparator on the same source and toolchain. The benchmark build sets this
// variable explicitly and records the selected capability in its manifest.
const useElementTemplate = process.env.BENCH_ENABLE_ET === '1';
const autoRows = Number(process.env.BENCH_AUTOROWS ?? '0');
const listRows = Number(process.env.BENCH_LIST_ROWS ?? '0');
if (autoRows > 0 && listRows > 0) {
  throw new TypeError('BENCH_AUTOROWS and BENCH_LIST_ROWS are mutually exclusive.');
}

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      main: listRows > 0 ? './src/list-index.tsx' : './src/index.tsx',
    },
    define: {
      __BENCH_AUTOROWS__: JSON.stringify(autoRows),
      __BENCH_LIST_ROWS__: JSON.stringify(listRows),
    },
  },
  output: listRows > 0 ? { distPath: { root: `dist-list-rows${listRows}` } } : {},
  plugins: [
    pluginReactLynx({
      experimental_useElementTemplate: useElementTemplate,
    }),
  ],
});
