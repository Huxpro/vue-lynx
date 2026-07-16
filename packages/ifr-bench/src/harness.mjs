/**
 * Single-configuration benchmark subprocess.
 *
 * Usage (spawned by run.mjs):
 *   node --import ./register-hooks.mjs [--jitless] src/harness.mjs '<json>'
 * where json = { variant, scene, size, iterations }
 *
 * Prints one JSON result line to stdout. The first iteration in the process
 * is reported as `coldMs` (fresh module state, fresh JIT); warm stats come
 * from the remaining iterations.
 */

import { performance } from 'node:perf_hooks';

import { makeCountingBackend } from './papi-backends.mjs';
import { prepareScene } from './prep.mjs';
import { SIZES, allScenes } from './scenes.mjs';
import { VARIANTS } from './variants.mjs';

const cfg = JSON.parse(process.argv[2]);
const { variant, scene, size, iterations = 30 } = cfg;

const backend = makeCountingBackend();
backend.install();

const sizeCfg = SIZES[size];
const sceneEntry = allScenes(sizeCfg).find((s) => s.name === scene);
if (!sceneEntry) throw new Error(`unknown scene ${scene}`);

const bundle = prepareScene(sceneEntry, sceneEntry.sizeArg);
const v = VARIANTS[variant](bundle);

function makeCtx() {
  const page = __CreatePage('0', 0);
  __SetCSSId([page], 0);
  return { page, pageUid: __GetElementUniqueID(page) };
}

const times = [];
let papiCallsPerRun = 0;

for (let i = 0; i < iterations; i++) {
  backend.reset();
  const ctx = makeCtx();
  v.reset(ctx);
  globalThis.gc?.();
  const t0 = performance.now();
  v.run();
  const t1 = performance.now();
  times.push(t1 - t0);
  if (i === 0) {
    const c = backend.counters;
    papiCallsPerRun = c.create + c.insert + c.setattr + c.event;
  }
}

const aux = v.collect?.() ?? {};

const warm = times.slice(Math.min(5, iterations - 1)).sort((a, b) => a - b);
const median = warm[Math.floor(warm.length / 2)];
const p95 = warm[Math.floor(warm.length * 0.95)];

process.stdout.write(
  `${
    JSON.stringify({
      variant,
      scene,
      size,
      nodeArg: sceneEntry.sizeArg,
      coldMs: times[0],
      warmMedianMs: median,
      warmP95Ms: p95,
      papiCalls: papiCallsPerRun,
      coverage: bundle.coverage,
      ...aux,
    })
  }\n`,
);
