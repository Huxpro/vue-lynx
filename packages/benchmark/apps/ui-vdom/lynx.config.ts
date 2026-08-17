import { defineConfig, type Rspack } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

// Unified matrix cells (explicit flags — never rely on enableIFR→ET default):
//   BENCH_CELL=off|ifr|ifr-et|et
// 'et' = intrinsic Code-Template WITHOUT IFR — the four-axis matrix's
// create-benefit cell (#321/#325).
const cell = process.env.BENCH_CELL ?? 'off';
const autoRowsRaw = process.env.BENCH_AUTOROWS;
const autoRows = autoRowsRaw === undefined ? 0 : Number(autoRowsRaw);
if (autoRowsRaw?.trim() === '' || !Number.isSafeInteger(autoRows) || autoRows < 0) {
  throw new Error('BENCH_AUTOROWS must be a non-negative safe integer');
}
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
const artifactMarker =
  `vue-lynx-bench-artifact-v1|mode=${modeLabel}|rows=${autoRows}`
  + `|ifr=${Number(enableIFR)}|et=${Number(enableElementTemplates)}`;
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
      main: './src/index.ts',
    },
    define: {
      __BENCH_MODE__: JSON.stringify(modeLabel),
      __BENCH_AUTOROWS__: JSON.stringify(autoRows),
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
