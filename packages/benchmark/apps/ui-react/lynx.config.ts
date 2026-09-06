import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';

// Keep the product-default comparator and the experimental Element Template
// comparator on the same source and toolchain. The benchmark build sets this
// variable explicitly and records the selected capability in its manifest.
const useElementTemplate = process.env.BENCH_ENABLE_ET === '1';
const autoRows = Number(process.env.BENCH_AUTOROWS ?? '0');

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
  plugins: [
    pluginReactLynx({
      experimental_useElementTemplate: useElementTemplate,
    }),
  ],
});
