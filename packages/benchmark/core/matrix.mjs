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
    flags: { vapor: true, enableIFR: true, enableElementTemplates: false },
    label: 'Vapor+IFR',
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

export const ALL_CELLS = [...VUE_CELLS, ...REACT_CELLS];

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
