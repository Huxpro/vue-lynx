// Smoke test for the unified shared core. Node-only, no build step.
//   node core/verify-core.mjs
import assert from 'node:assert';
import vm from 'node:vm';
import {
  stats,
  slopeFit,
  geomean,
  aggregate,
  percentile,
} from './stats.mjs';
import {
  elementsForRows,
  rowsForElements,
  elementsForCards,
  cardsForElements,
  resolveLadder,
  LADDER,
  rungLabel,
} from './scale.mjs';
import { ALL_CELLS, selectCells, SFC_ARCHITECTURES, cellById } from './matrix.mjs';
import { DRIVER_CLIENT_JS } from './driver-client.mjs';
import { NEUTRALIZE_LYNX_PROFILE } from './neutralize.mjs';

let pass = 0;
const ok = (name, fn) => {
  fn();
  pass++;
  console.log(`✓ ${name}`);
};

// -- scale: the N-in-elements fix -------------------------------------------
ok('table row geometry: 1000 rows = 4028 elements, round-trips', () => {
  assert.equal(elementsForRows(1000), 4028);
  assert.equal(rowsForElements(4028), 1000);
});
ok('content card geometry matches generate.mjs (4 + nCards*8)', () => {
  // sfc-probe/generate.mjs: elements = 4 + nCards*8; 125 cards -> 1004
  assert.equal(elementsForCards(125), 1004);
  assert.equal(cardsForElements(1004), 125);
});
ok('unified ladder lands table & content on the SAME element target', () => {
  const rungs = resolveLadder(LADDER);
  for (const r of rungs) {
    // realized element counts within 4 (table)/8 (content) of the target
    assert.ok(Math.abs(r.rowsElements - r.nElements) <= 4, `rows ${r.label}`);
    assert.ok(Math.abs(r.cardsElements - r.nElements) <= 8, `cards ${r.label}`);
  }
  // the bug this fixes: at rung "1k" both workloads are ~1000 elements, NOT
  // 4028 (rows) vs 1004 (cards) as the old separate ladders had it.
  const oneK = rungs[0];
  assert.equal(oneK.nElements, 1000);
  assert.ok(oneK.rows < 250, `rows for 1k elements should be ~243, got ${oneK.rows}`);
});
ok('rungLabel', () => {
  assert.equal(rungLabel(1000), '1k');
  assert.equal(rungLabel(30000), '30k');
});

// -- stats -------------------------------------------------------------------
ok('median even/odd', () => {
  assert.equal(stats([3, 1, 2]).median, 2);
  assert.equal(stats([4, 1, 2, 3]).median, 2.5);
});
ok('percentile', () => {
  assert.equal(percentile([1, 2, 3, 4, 5], 50), 3);
});
ok('slopeFit recovers α on synthetic y = N^0.8', () => {
  const points = [1000, 3000, 5000, 10000, 20000, 30000].map((N) => ({
    N,
    value: Math.pow(N, 0.8),
  }));
  const a = slopeFit(points);
  assert.ok(Math.abs(a - 0.8) < 1e-6, `α=${a}`);
});
ok('geomean', () => {
  assert.ok(Math.abs(geomean([2, 8]) - 4) < 1e-9);
});
ok('aggregate counts DNF separately', () => {
  const out = aggregate([
    { samples: [{ op: 'x', ms: 10 }, { op: 'x', ms: 20 }, { op: 'y', dnf: true }] },
  ]);
  assert.equal(out.x.median, 15);
  assert.equal(out.y.dnf, 1);
});

// -- matrix ------------------------------------------------------------------
ok('matrix: 14 cells (8 classic + 6 four-axis), react has no ifr', () => {
  assert.equal(ALL_CELLS.length, 14);
  assert.equal(selectCells({ framework: 'vue', ifr: 'ifr-et' }).length, 1);
  assert.equal(selectCells({ framework: 'reactlynx' }).length, 3);
  assert.equal(cellById('vue-vapor-ifr').flags.enableElementTemplates, false);
  assert.equal(cellById('vue-vapor-dense').flags.templateNaming, 'dense');
  assert.equal(cellById('vue-vapor-engine').flags.templateStaging, 'engine');
  assert.equal(cellById('vue-vapor-ifr-engine-et').flags.ifrPaint, 'engine-et');
});
ok('matrix: every vue cell sets vapor + enableIFR explicitly', () => {
  for (const c of selectCells({ framework: 'vue' })) {
    assert.equal(typeof c.flags.enableIFR, 'boolean');
    assert.equal(typeof c.flags.vapor, 'boolean');
  }
});

// -- injected client scripts parse ------------------------------------------
ok('driver-client + neutralize are syntactically valid scripts', () => {
  new vm.Script(DRIVER_CLIENT_JS);
  new vm.Script(NEUTRALIZE_LYNX_PROFILE);
});

console.log(`\n${pass} checks passed.`);
