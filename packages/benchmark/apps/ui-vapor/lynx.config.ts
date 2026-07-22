import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

/**
 * Unified / graph-eng four-axis matrix cells (#301/#321/#325/#337/#338):
 *   BENCH_CELL=off|dense|engine|code|bundle|ifr|ifr-dense|ifr-sparse|ifr-engine-et
 *
 * - off: Data-Template sparse, no IFR (product no-IFR default)
 * - dense: Named Tree, no IFR — naming main-effect anchor
 * - engine: templateStaging 'engine' probe, no IFR — stub on web
 *   (__VUE_LYNX_ENGINE_ET_STATUS__ reports honestly)
 * - code: vapor `+b:c` (#337) — templateStaging 'code': build-time-parsed
 *   create() baked into the MT bundle, INSTANTIATE_TEMPLATE on the wire
 * - bundle: vapor `+b!` (#338) — templateDelivery 'bundle': structure AST
 *   baked into the MT bundle, REGISTER_TREE_BUNDLE (hash only) on the wire
 * - ifr: IFR + sparse naming (product default; aliases ifr-sparse)
 * - ifr-dense: IFR + Named Tree (kill-switch cell)
 * - ifr-sparse: IFR + Data-Template
 * - ifr-engine-et: IFR + ifrPaint 'engine-et' (stub fallback on web)
 */
const cell = process.env.BENCH_CELL ?? 'off';
const enableIFR =
  cell === 'ifr' || cell === 'ifr-dense' || cell === 'ifr-sparse'
  || cell === 'ifr-engine-et';
const templateNaming =
  cell === 'dense' || cell === 'ifr-dense'
    ? 'dense' as const
    : 'sparse' as const;
const templateStaging = cell === 'engine'
  ? 'engine' as const
  : cell === 'code'
  ? 'code' as const
  : undefined;
const templateDelivery = cell === 'bundle' ? 'bundle' as const : undefined;
const ifrPaint = cell === 'ifr-engine-et' ? 'engine-et' as const : undefined;
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
      enableIFR,
      templateNaming,
      templateStaging,
      templateDelivery,
      ifrPaint,
      // Explicit: vapor never enables VDOM element templates.
      enableElementTemplates: false,
    }),
  ],
});
