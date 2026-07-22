import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

/**
 * Unified / graph-eng matrix cells (#301):
 *   BENCH_CELL=off|ifr|ifr-dense|ifr-sparse
 *
 * - off: vapor only (no IFR)
 * - ifr: IFR + sparse naming (product default; aliases ifr-sparse)
 * - ifr-dense: IFR + dense A1 (#297) — kill-switch cell
 * - ifr-sparse: IFR + sparse A2 (#298)
 *
 * Slots axis (#296): vapor INSERT stays on named insert-host holes.
 * Native ET (#299/#300): stub — not enabled here.
 */
const cell = process.env.BENCH_CELL ?? 'off';
const enableIFR =
  cell === 'ifr' || cell === 'ifr-dense' || cell === 'ifr-sparse';
// Dense (Named Tree) only when explicitly requested; product + `ifr` stay
// sparse (recovered Data-Template). #321 four-axis naming flag.
const templateNaming = cell === 'ifr-dense' ? 'dense' as const : 'sparse' as const;
const modeLabel =
  cell === 'off'
    ? 'vapor'
    : cell === 'ifr-dense'
    ? 'vapor-ifr-dense'
    : cell === 'ifr-sparse'
    ? 'vapor-ifr-sparse'
    : 'vapor-ifr';
const distRoot =
  cell === 'off'
    ? 'dist'
    : cell === 'ifr'
    ? 'dist-ifr'
    : cell === 'ifr-dense'
    ? 'dist-ifr-dense'
    : 'dist-ifr-sparse';

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
      enableIFR,
      templateNaming,
      // Explicit: vapor never enables VDOM element templates.
      enableElementTemplates: false,
    }),
  ],
});
