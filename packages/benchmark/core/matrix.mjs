// Declarative variant matrix — the single source of truth for the
// renderer × ifr × framework product. Replaces the `off/ifr/ifr-et` lists
// hardcoded separately in ifr-bench's examples-sweep, sfc-probe, and
// scale-matrix, plus the ad-hoc mode lists in benchmark's cross.mjs.
// See plans/0717-1-unified-benchmark.md §1.

/**
 * A cell is one buildable product configuration. Fields:
 *   id          stable slug, e.g. "vue-vapor-ifr", "react-compiler"
 *   framework   "vue" | "reactlynx"
 *   renderer    "vdom" | "vapor" | null (react)
 *   ifr         "off" | "ifr" | "ifr-et" | null (react — ReactLynx architecture
 *               ships its own first-frame path; no IFR switch)
 *   flags       explicit build flags (never rely on defaults — post-#216
 *               enableIFR:true also turns ET on, so every cell is explicit)
 *   label       human label for tables
 */

const VUE_CELLS = [
  {
    id: 'vue-vdom-off',
    framework: 'vue',
    renderer: 'vdom',
    ifr: 'off',
    flags: { vapor: false, enableIFR: false, enableElementTemplates: false },
    label: 'VDOM',
  },
  {
    id: 'vue-vdom-ifr',
    framework: 'vue',
    renderer: 'vdom',
    ifr: 'ifr',
    flags: { vapor: false, enableIFR: true, enableElementTemplates: false },
    label: 'VDOM+IFR',
  },
  {
    id: 'vue-vdom-ifr-et',
    framework: 'vue',
    renderer: 'vdom',
    ifr: 'ifr-et',
    flags: { vapor: false, enableIFR: true, enableElementTemplates: true },
    label: 'VDOM+IFR+ET',
  },
  {
    id: 'vue-vapor-off',
    framework: 'vue',
    renderer: 'vapor',
    ifr: 'off',
    flags: { vapor: true, enableIFR: false, enableElementTemplates: false },
    label: 'Vapor',
  },
  {
    id: 'vue-vapor-ifr',
    framework: 'vue',
    renderer: 'vapor',
    ifr: 'ifr',
    // Vapor has no ET path — the REGISTER_TREE/CLONE_TREE protocol is always on.
    // Naming default is sparse, so this is also the vapor-ifr-sparse cell.
    flags: { vapor: true, enableIFR: true, enableElementTemplates: false, benchCell: 'ifr' },
    label: 'Vapor+IFR',
  },
];

// Four-axis graph-eng cells (#321/#325), added on top of the classic matrix so
// the runner covers every legal Naming × Staging × IFR × ifrPaint permutation
// the base (#327) models. benchCell mirrors the base app configs'
// BENCH_CELL value. Engine cells run as `stub` on web (no native engine) — an
// honest fallback-path cost, not a native-engine claim.
const FOUR_AXIS_CELLS = [
  {
    id: 'vue-vdom-et',
    framework: 'vue',
    renderer: 'vdom',
    ifr: 'et', // Code-Template WITHOUT IFR (create-benefit staging cell)
    flags: { vapor: false, enableIFR: false, enableElementTemplates: true, benchCell: 'et' },
    label: 'VDOM+ET (no IFR)',
  },
  {
    id: 'vue-vapor-dense',
    framework: 'vue',
    renderer: 'vapor',
    ifr: 'off',
    flags: { vapor: true, enableIFR: false, templateNaming: 'dense', benchCell: 'dense' },
    label: 'Vapor dense',
  },
  {
    id: 'vue-vapor-bang',
    framework: 'vue',
    renderer: 'vapor',
    ifr: 'off',
    // `+b!` (#338): delivery column flipped alone — structure AST baked into
    // the MT bundle, REGISTER_TREE_BUNDLE (hash only) on the wire.
    flags: { vapor: true, enableIFR: false, templateDelivery: 'bundle', benchCell: 'bundle' },
    label: 'Vapor +b! (bundle)',
  },
  {
    id: 'vue-vapor-code',
    framework: 'vue',
    renderer: 'vapor',
    ifr: 'off',
    // `+b:c` (#337): code staging — build-time-parsed create() in the MT
    // bundle, INSTANTIATE_TEMPLATE(id) on the wire.
    flags: { vapor: true, enableIFR: false, templateStaging: 'code', benchCell: 'code' },
    label: 'Vapor +b:c (code)',
  },
  {
    id: 'vue-vapor-engine',
    framework: 'vue',
    renderer: 'vapor',
    ifr: 'off',
    flags: { vapor: true, enableIFR: false, templateStaging: 'engine', benchCell: 'engine' },
    label: 'Vapor engine (stub)',
  },
  {
    id: 'vue-vapor-ifr-dense',
    framework: 'vue',
    renderer: 'vapor',
    ifr: 'ifr',
    flags: { vapor: true, enableIFR: true, templateNaming: 'dense', benchCell: 'ifr-dense' },
    label: 'Vapor+IFR dense',
  },
  {
    id: 'vue-vapor-ifr-sparse',
    framework: 'vue',
    renderer: 'vapor',
    ifr: 'ifr',
    flags: { vapor: true, enableIFR: true, templateNaming: 'sparse', benchCell: 'ifr-sparse' },
    label: 'Vapor+IFR sparse',
  },
  {
    id: 'vue-vapor-ifr-engine-et',
    framework: 'vue',
    renderer: 'vapor',
    ifr: 'ifr',
    flags: { vapor: true, enableIFR: true, ifrPaint: 'engine-et', benchCell: 'ifr-engine-et' },
    label: 'Vapor+IFR engine-et (stub)',
  },
];

const REACT_CELLS = [
  {
    id: 'react',
    framework: 'reactlynx',
    renderer: null,
    ifr: null,
    flags: { variant: 'react' },
    label: 'React (hooks)',
  },
  {
    id: 'react-naive',
    framework: 'reactlynx',
    renderer: null,
    ifr: null,
    flags: { variant: 'react-naive' },
    label: 'React (naive)',
  },
  {
    id: 'react-compiler',
    framework: 'reactlynx',
    renderer: null,
    ifr: null,
    flags: { variant: 'react-compiler' },
    label: 'React (compiler)',
  },
];

export const ALL_CELLS = [...VUE_CELLS, ...FOUR_AXIS_CELLS, ...REACT_CELLS];

/** Filter the matrix by axis. Each arg is a value or array; omit for "all". */
export function selectCells({ framework, renderer, ifr, id } = {}) {
  const want = (v, set) =>
    set === undefined || (Array.isArray(set) ? set.includes(v) : v === set);
  return ALL_CELLS.filter(
    (c) =>
      want(c.framework, framework)
      && want(c.renderer, renderer)
      && want(c.ifr, ifr)
      && want(c.id, id),
  );
}

/** The five same-source SFC architectures (ifr-bench sfc-probe lineage). */
export const SFC_ARCHITECTURES = VUE_CELLS.map((c) => c.id);

/** The cross-framework storm lineage (benchmark cross.mjs). */
export const CROSS_MODES = [
  'react',
  'react-naive',
  'react-compiler',
  'vue-vdom-off',
  'vue-vapor-off',
];

export function cellById(id) {
  return ALL_CELLS.find((c) => c.id === id) ?? null;
}
