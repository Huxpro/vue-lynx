import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig, type Rspack } from '@lynx-js/rspeedy';

const autoRowsRaw = process.env.BENCH_AUTOROWS;
const autoRows = autoRowsRaw === undefined ? 0 : Number(autoRowsRaw);
if (autoRowsRaw?.trim() === '' || !Number.isSafeInteger(autoRows) || autoRows < 0) {
  throw new Error('BENCH_AUTOROWS must be a non-negative safe integer');
}
const artifactMarker =
  `vue-lynx-bench-artifact-v1|mode=react|rows=${autoRows}|ifr=0|et=0`;

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  tools: {
    rspack(_config, { appendPlugins }) {
      appendPlugins({
        apply(compiler: Rspack.Compiler) {
          new compiler.webpack.BannerPlugin({
            banner: artifactMarker,
            entryOnly: true,
            raw: false,
            stage:
              compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_HASH
              - 1,
            test: /background\.[^/]+\.js$/,
          }).apply(compiler);
        },
      });
    },
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
