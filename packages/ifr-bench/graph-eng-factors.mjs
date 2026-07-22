/**
 * Graph-eng four-axis factor decomposition (M4, #325).
 *
 * Reads:
 *  - results/browser-results-graph-eng-4axis.json      (×1 FCP per cell)
 *  - results/browser-results-graph-eng-4axis-x4.json   (×4 FCP per cell)
 *  - web-bundles/sfc-probe-sizes.json                  (bundle sizes + coords)
 *  - results/graph-eng-create-update.json              (ops-level factorial)
 *
 * Emits results/graph-eng-factors.{json,md}: the per-cell table plus
 * per-factor main effects (marginal Δ, one axis moved at a time from a
 * fixed baseline), covering the five axes the goal doc names:
 * render / naming / staging / ifr / ifrPaint.
 *
 *   node graph-eng-factors.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => path.join(_dirname, 'results', p);

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const x1 = read(R('browser-results-graph-eng-4axis.json'));
const x4 = read(R('browser-results-graph-eng-4axis-x4.json'));
const sizes = read(path.join(_dirname, 'web-bundles/sfc-probe-sizes.json'));
const opsBench = read(R('graph-eng-create-update.json'));

const fcpOf = (rows, cell) =>
  rows.find((r) => r.bundle === `${cell}.web.bundle`)?.fcpMedianMs ?? null;
const sizeOf = (cell) => sizes.cells.find((c) => c.cell === cell) ?? null;

const CELLS = sizes.cells.map((c) => c.cell);

const perCell = CELLS.map((cell) => {
  const s = sizeOf(cell);
  return {
    cell,
    coordinate: s?.flags?.coordinate ?? '',
    naming: s?.flags?.templateNaming ?? null,
    staging: s?.flags?.templateStaging ?? null,
    ifr: s?.flags?.enableIFR ?? null,
    ifrPaint: s?.flags?.ifrPaint ?? null,
    nativeEt: s?.flags?.nativeEt ?? null,
    webGzip: s?.webBundle?.gzip ?? null,
    fcpX1: fcpOf(x1, cell),
    fcpX4: fcpOf(x4, cell),
  };
});

// ---------------------------------------------------------------------------
// Main effects: move exactly one axis from a fixed anchor pair.
// ---------------------------------------------------------------------------

const cellRow = (name) => perCell.find((c) => c.cell === name);
const delta = (metric, from, to) => {
  const a = cellRow(from)?.[metric];
  const b = cellRow(to)?.[metric];
  if (a == null || b == null) return null;
  return {
    from,
    to,
    [`${metric}From`]: +a.toFixed(1),
    [`${metric}To`]: +b.toFixed(1),
    deltaMs: +(b - a).toFixed(1),
    deltaPct: +(((b - a) / a) * 100).toFixed(1),
  };
};

const factors = {
  // Axis: render model (same source, no IFR, default staging).
  'render vdom→vapor (no-IFR)': {
    x1: delta('fcpX1', 'content-vdom', 'content-vapor'),
    x4: delta('fcpX4', 'content-vdom', 'content-vapor'),
  },
  // Axis B: naming (vapor, IFR pair — the #313 anchor; plus no-IFR pair).
  'naming dense→sparse (vapor+IFR)': {
    x1: delta('fcpX1', 'content-vapor-ifr-dense', 'content-vapor-ifr-sparse'),
    x4: delta('fcpX4', 'content-vapor-ifr-dense', 'content-vapor-ifr-sparse'),
  },
  'naming dense→sparse (vapor no-IFR)': {
    x1: delta('fcpX1', 'content-vapor-dense', 'content-vapor'),
    x4: delta('fcpX4', 'content-vapor-dense', 'content-vapor'),
  },
  // Axis A: staging (VDOM opstream→code = ET; vapor data→engine[stub]).
  'staging opstream→code (vdom no-IFR)': {
    x1: delta('fcpX1', 'content-vdom', 'content-vdom-et'),
    x4: delta('fcpX4', 'content-vdom', 'content-vdom-et'),
  },
  'staging opstream→code (vdom+IFR)': {
    x1: delta('fcpX1', 'content-vdom-ifr', 'content-vdom-ifr-et'),
    x4: delta('fcpX4', 'content-vdom-ifr', 'content-vdom-ifr-et'),
  },
  'staging data→engine (vapor, STUB on web)': {
    x1: delta('fcpX1', 'content-vapor', 'content-vapor-engine'),
    x4: delta('fcpX4', 'content-vapor', 'content-vapor-engine'),
  },
  // Axis D: ifr on/off per render model.
  'ifr off→on (vdom)': {
    x1: delta('fcpX1', 'content-vdom', 'content-vdom-ifr'),
    x4: delta('fcpX4', 'content-vdom', 'content-vdom-ifr'),
  },
  'ifr off→on (vapor sparse)': {
    x1: delta('fcpX1', 'content-vapor', 'content-vapor-ifr'),
    x4: delta('fcpX4', 'content-vapor', 'content-vapor-ifr'),
  },
  // Axis D paint: plain→engine-et (STUB fallback on web).
  'ifrPaint plain→engine-et (vapor, STUB on web)': {
    x1: delta('fcpX1', 'content-vapor-ifr-sparse', 'content-vapor-ifr-engine-et'),
    x4: delta('fcpX4', 'content-vapor-ifr-sparse', 'content-vapor-ifr-engine-et'),
  },
};

const out = {
  generated: 'graph-eng-factors.mjs',
  runs: { x1: 'browser-results-graph-eng-4axis.json', x4: '…-x4.json' },
  note:
    'Engine/engine-et cells run with the native ET PAPI family ABSENT on '
    + 'Lynx-for-Web: __VUE_LYNX_ENGINE_ET_STATUS__ = stub, interpretation '
    + 'fallback. Their deltas measure probe/flag overhead only — NOT an '
    + 'engine win. Ops-level create/update factorial: see '
    + 'graph-eng-create-update.json.',
  perCell,
  factors,
  opsFactorial: opsBench.factors,
};

fs.writeFileSync(R('graph-eng-factors.json'), `${JSON.stringify(out, null, 2)}\n`);

// --- markdown ---------------------------------------------------------------

let md = '# Graph-eng four-axis factors (generated)\n\n## Per-cell\n\n';
md += '| cell | coordinate | web gz | FCP ×1 | FCP ×4 |\n|---|---|--:|--:|--:|\n';
for (const c of perCell) {
  md += `| ${c.cell} | ${c.coordinate} | ${c.webGzip ?? '—'} | ${
    c.fcpX1?.toFixed(1) ?? '—'
  } | ${c.fcpX4?.toFixed(1) ?? '—'} |\n`;
}
md += '\n## Main effects (marginal Δ, one axis at a time)\n\n';
md += '| factor | ×1 Δms | ×1 Δ% | ×4 Δms | ×4 Δ% |\n|---|--:|--:|--:|--:|\n';
for (const [name, f] of Object.entries(factors)) {
  md += `| ${name} | ${f.x1?.deltaMs ?? '—'} | ${f.x1?.deltaPct ?? '—'} | ${
    f.x4?.deltaMs ?? '—'
  } | ${f.x4?.deltaPct ?? '—'} |\n`;
}
md += `\n> ${out.note}\n`;
fs.writeFileSync(R('graph-eng-factors.md'), md);

console.log(md);
