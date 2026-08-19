import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginBabel } from '@rsbuild/plugin-babel';

// REACT COMPILER variant: the NAIVE source (AppNaive.tsx) auto-memoized by
// babel-plugin-react-compiler. target '18' makes the compiler emit imports
// from the `react-compiler-runtime` polyfill package (ReactLynx has no
// `react/compiler-runtime` export); the polyfill's own `import ... from
// 'react'` is aliased to @lynx-js/react below so its useMemo-based memo
// cache runs on ReactLynx's (preact) hooks.
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
  resolve: {
    alias: {
      react$: '@lynx-js/react',
    },
  },
  output: {
    distPath: {
      root: 'dist-compiler',
    },
  },
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        opts.plugins?.unshift(['babel-plugin-react-compiler', { target: '18' }]);
      },
    }),
    pluginReactLynx(),
  ],
});
