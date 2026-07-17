/**
 * Canonical benchmark dimensions. Keep policy here; runners only collect data.
 * A comparison is valid only when every dimension in COMPARABILITY_KEYS agrees.
 */
export const COMPARABILITY_KEYS = [
  'environment',
  'workload',
  'scale',
  'metric',
  'boundary',
  'unit',
  'revision',
];

export const suites = {
  internal: {
    description: 'Vue VDOM vs Vapor with framework-internal timing and ops telemetry',
    command: ['node', 'harness/run.mjs'],
    quickArgs: ['--loads', '1', '--startup-count', '2'],
    environment: 'lynx-for-web',
    modes: ['vue-vdom', 'vue-vapor'],
    boundaries: ['bg-next-tick', 'mt-ack', 'ops-stream', 'view-attach-to-content'],
  },
  cross: {
    description: 'Black-box ReactLynx vs Vue, driven and observed through the UI',
    command: ['node', 'harness/cross.mjs'],
    quickArgs: ['--loads', '1', '--count', '5', '--heavy-count', '2', '--startup-count', '2', '--fresh-count', '1'],
    environment: 'lynx-for-web',
    modes: ['react', 'vue-vdom', 'vue-vapor'],
    boundaries: ['pointerdown-to-dom-predicate', 'view-attach-to-content'],
  },
  scale: {
    description: 'Black-box size sweep and sustained-update storms',
    command: ['node', 'harness/cross.mjs', '--storms'],
    quickArgs: ['--storm-reps', '1'],
    environment: 'lynx-for-web',
    modes: ['react', 'vue-vdom', 'vue-vapor'],
    boundaries: ['pointerdown-to-dom-predicate'],
  },
  'ifr-model': {
    description: 'IFR strategy cost model with counting PAPI (not user-visible latency)',
    command: ['node', '../ifr-bench/run.mjs'],
    quickArgs: ['--quick'],
    environment: 'node-counting-papi',
    modes: ['vue-vdom'],
    boundaries: ['synchronous-render'],
  },
};

export const profiles = {
  quick: ['internal', 'cross', 'ifr-model'],
  standard: ['internal', 'cross', 'scale', 'ifr-model'],
};
