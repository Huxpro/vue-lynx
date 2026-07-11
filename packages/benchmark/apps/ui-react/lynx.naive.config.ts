import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';

// NAIVE variant: AppNaive.tsx (no memo / no useCallback), no compiler.
export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      main: './src/index-naive.tsx',
    },
  },
  output: {
    distPath: {
      root: 'dist-naive',
    },
  },
  plugins: [pluginReactLynx()],
});
