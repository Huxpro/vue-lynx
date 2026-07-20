/**
 * Canonical unified benchmark matrix.
 *
 * Three historical campaigns lived in different packages with overlapping
 * claims and non-comparable scales. This file is the single source of truth
 * for *what* we measure, *where*, and *which numbers may be compared*.
 *
 * Axes
 * ----
 *   architecture × environment × workload × scale × cpu
 *
 * Environments are NOT interchangeable. Numbers from different environments
 * must never be ratioed against each other in docs.
 */

/** Product-relevant architectures under test. */
export const ARCHITECTURES = [
  {
    id: 'vdom',
    family: 'vue-vdom',
    ifr: false,
    et: false,
    label: 'Vue VDOM',
    tableDist: 'ui-vdom/dist',
    tableApp: 'ui-vdom',
  },
  {
    id: 'vdom-ifr',
    family: 'vue-vdom',
    ifr: true,
    et: false,
    label: 'Vue VDOM+IFR',
    tableDist: 'ui-vdom/dist-ifr',
    tableApp: 'ui-vdom',
  },
  {
    id: 'vdom-ifr-et',
    family: 'vue-vdom',
    ifr: true,
    et: true,
    label: 'Vue VDOM+IFR+ET',
    tableDist: 'ui-vdom/dist-ifr-et',
    tableApp: 'ui-vdom',
  },
  {
    id: 'vapor',
    family: 'vue-vapor',
    ifr: false,
    et: false,
    label: 'Vue Vapor',
    tableDist: 'ui-vapor/dist',
    tableApp: 'ui-vapor',
  },
  {
    id: 'vapor-ifr',
    family: 'vue-vapor',
    ifr: true,
    et: false,
    label: 'Vue Vapor+IFR',
    tableDist: 'ui-vapor/dist-ifr',
    tableApp: 'ui-vapor',
  },
  {
    id: 'vapor-ifr-et',
    family: 'vue-vapor',
    ifr: true,
    et: true,
    label: 'Vue Vapor+IFR+ET',
    tableDist: 'ui-vapor/dist-ifr-et',
    tableApp: 'ui-vapor',
  },
  {
    id: 'react',
    family: 'reactlynx',
    ifr: null,
    et: null,
    label: 'ReactLynx (hooks)',
    tableDist: 'ui-react/dist',
    tableApp: 'ui-react',
  },
  {
    id: 'react-naive',
    family: 'reactlynx',
    ifr: null,
    et: null,
    label: 'ReactLynx (naive)',
    tableDist: 'ui-react/dist-naive',
    tableApp: 'ui-react',
  },
  {
    id: 'react-compiler',
    family: 'reactlynx',
    ifr: null,
    et: null,
    label: 'ReactLynx (compiler)',
    tableDist: 'ui-react/dist-compiler',
    tableApp: 'ui-react',
  },
];

/**
 * Measurement environments. Each has its own scale semantics.
 *
 * lynx-web     — Playwright + <lynx-view> + @lynx-js/web-core (dual-thread)
 * bare-dom     — Playwright + plain DOM (no Lynx); calibration only
 * node-jitless — Node V8 --jitless strategy ladder; MICRO render-cost only
 */
export const ENVIRONMENTS = {
  'lynx-web': {
    id: 'lynx-web',
    comparableWith: ['lynx-web'],
    primary: true,
    description:
      'Lynx for Web in Chromium. Real worker BG + postMessage IPC. Primary product scale.',
  },
  'bare-dom': {
    id: 'bare-dom',
    comparableWith: ['bare-dom'],
    primary: false,
    description:
      'Plain browser DOM (Preact / Vue / Vapor). Same host, no Lynx. Use to bound framework-only cost.',
  },
  'node-jitless': {
    id: 'node-jitless',
    comparableWith: ['node-jitless'],
    primary: false,
    description:
      'Node V8 --jitless PAPI stubs. Strategy microbenchmark — NOT comparable to browser FCP.',
  },
};

/** Shared scale ladder (element / row counts). */
export const SCALE_LADDER = ['1k', '3k', '5k', '10k', '20k', '30k'];

export const CPU_THROTTLES = [1, 4];

/**
 * Workloads. A cell is (architecture, environment, workload, scale, cpu).
 * Not every cell is valid — see `isCellValid`.
 */
export const WORKLOADS = {
  /**
   * js-framework-benchmark table app. Interaction latency + storms.
   * Lives in packages/benchmark apps/ui-*.
   */
  table: {
    id: 'table',
    envs: ['lynx-web', 'bare-dom'],
    metrics: [
      'startup_ms',
      'create_ms',
      'update10th_ms',
      'select_ms',
      'update_storm_ms',
      'select_storm_ms',
      'bundle_web_gzip',
      'bundle_mt_gzip',
      'heap_mb',
    ],
    // Instrumented Vue-only extras (packages/benchmark apps/vdom|vapor):
    extraInstrumented: ['bg_ms', 'e2e_ms', 'ops_count', 'ops_bytes'],
  },
  /**
   * Dense content-card first screen (sfc-probe). FCP / settled.
   * Lives in packages/ifr-bench/sfc-probe.
   */
  'content-probe': {
    id: 'content-probe',
    envs: ['lynx-web'],
    metrics: ['fcp_ms', 'settled_ms', 'bundle_web_gzip', 'bundle_mt_gzip'],
    architectures: [
      'vdom',
      'vdom-ifr',
      'vdom-ifr-et',
      'vapor',
      'vapor-ifr',
      'vapor-ifr-et',
      'react',
    ],
  },
  /**
   * Strategy ladder scenes (~1k–1.4k els). Node microbenchmark.
   * Lives in packages/ifr-bench/src.
   */
  'strategy-scenes': {
    id: 'strategy-scenes',
    envs: ['node-jitless'],
    metrics: ['warm_render_ms', 'cold_render_ms', 'ops_payload_bytes'],
    note: 'Prototype variants (ifr-direct, ifr-vapor bound, papi-floor) are retained here only.',
  },
};

/** Schema version for unified result JSON. */
export const SCHEMA_VERSION = 1;

export function archById(id) {
  const a = ARCHITECTURES.find((x) => x.id === id);
  if (!a) throw new Error(`unknown architecture: ${id}`);
  return a;
}

export function isCellValid({ architecture, environment, workload }) {
  const w = WORKLOADS[workload];
  if (!w) return false;
  if (!w.envs.includes(environment)) return false;
  if (w.architectures && !w.architectures.includes(architecture)) return false;
  // ReactLynx has Snapshot+IFR always-on — valid on content-probe as `react`,
  // but not on the Vue-only strategy ladder.
  if (architecture.startsWith('react') && workload === 'strategy-scenes') {
    return false;
  }
  return true;
}

/**
 * Claims previously published across the three docs — reevaluated by
 * `synthesize.mjs` against the unified result set.
 */
export const CLAIMS = [
  {
    id: 'vapor-update-bg-5-10x',
    claim:
      'Vapor wins update ops 5.8–9.8× on BG thread vs VDOM (instrumented).',
    sources: ['benchmark-vapor', 'packages/benchmark/results/latest.md'],
    challenge:
      'Does the black-box e2e / storm ladder reproduce a similar ratio, or is BG advantage frame-floor masked?',
  },
  {
    id: 'vapor-create-parity',
    claim: 'Vapor creation is roughly parity with VDOM (slightly slower e2e).',
    sources: ['benchmark-vapor'],
    challenge: 'Hold across 1k→30k black-box create? React still leads create?',
  },
  {
    id: 'ifr-fcp-minus-19',
    claim: 'Default IFR wins median −19% FCP on real threads (content scene).',
    sources: ['ifr-benchmarks', 'UNIFIED-RERUN'],
    challenge:
      'Survives scale (10k–30k) and CPU×4? Separating IFR-sans-ET from IFR+ET?',
  },
  {
    id: 'et-is-inflection',
    claim:
      'Element Templates are the render-cost inflection; IFR without ET is dangerous at scale.',
    sources: ['ifr-benchmarks', 'UNIFIED-RERUN'],
    challenge: 'Confirm on same ladder as playground; check tiny-screen web FCP tax.',
  },
  {
    id: 'react-create-vue-update',
    claim:
      'React leads creation; Vue/Vapor lead sustained updates (storms).',
    sources: ['benchmark-playground'],
    challenge: 'Do IFR Vue builds change that story for updates or only startup?',
  },
  {
    id: 'single-process-flat-fcp',
    claim:
      'Single-process FCP is flat across IFR configs — proves dual-thread necessity.',
    sources: ['ifr-benchmarks'],
    challenge:
      'Valid negative control, but must not be sold as evidence of native benefit.',
  },
  {
    id: 'same-scale',
    claim:
      'The three benchmarks are on comparable scales / can be read as one story.',
    sources: ['docs cross-links'],
    challenge:
      'Instrumented BG ms ≠ black-box click-to-DOM ≠ Node --jitless warm render ≠ FCP.',
  },
];

/** Default focused campaign used by `unified.mjs --campaign focused`. */
export const FOCUSED_CAMPAIGN = {
  /** New coverage: IFR flag × table storms (previously never measured). */
  tableStormModes: [
    'vdom',
    'vdom-ifr',
    'vdom-ifr-et',
    'vapor',
    'vapor-ifr',
    'vapor-ifr-et',
  ],
  tableStormScales: ['1k', '10k', '30k'],
  tableStormReps: 2,
  /** Startup on the empty table shell across IFR cells. */
  tableStartupModes: [
    'vdom',
    'vdom-ifr',
    'vdom-ifr-et',
    'vapor',
    'vapor-ifr',
    'vapor-ifr-et',
    'react',
  ],
  tableStartupCount: 5,
  /** Reuse committed ifr-bench scale FCP + prior cross-storms for synthesis. */
  ingestExisting: true,
};
