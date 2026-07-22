/**
 * Four-axis factor decomposition over the UNIFIED benchmark storms run
 * (#325). Consumes a cross.mjs storms result (real mouse-click driven
 * create / update10th / select / updateStorm / selectStorm per cell) and
 * emits per-cell create/update tables plus per-factor main effects
 * (marginal Δ, one axis moved at a time).
 *
 *   node harness/graph-eng-unified-factors.mjs [resultsFile] [outStem]
 *
 * Defaults: results/cross-storms-graph-eng-4axis.json →
 *           results/unified/graph-eng-unified-factors.{json,md}
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inFile = process.argv[2]
  ?? path.join(root, 'results/cross-storms-graph-eng-4axis.json');
const outStem = process.argv[3]
  ?? path.join(root, 'results/unified/graph-eng-unified-factors');

const data = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const perOp = data.perOp;

/** Four-axis coordinates per unified cell id. */
const CELLS = {
  'vdom': { coord: 'OpStream/Dense/intrinsic/Split·Durable', term: 'Op Stream' },
  'vdom-ifr': { coord: 'OpStream/Dense/intrinsic/Split·Durable+Ephemeral', term: 'Op Stream + IFR' },
  'vdom-et': { coord: 'Code/Sparse/intrinsic/Split·Durable', term: 'Code-Template' },
  'vdom-ifr-et': { coord: 'Code/Sparse/intrinsic/Split·Durable+Ephemeral', term: 'Code-Template + IFR' },
  'vapor': { coord: 'Data/Sparse/recovered/Split·Durable', term: 'Data-Template' },
  'vapor-dense': { coord: 'Data/Dense/—/Split·Durable', term: 'Named Tree' },
  'vapor-engine': { coord: 'Engine/Sparse/recovered/Split·Durable (STUB on web)', term: 'Engine-Template (stub)' },
  'vapor-ifr': { coord: 'Data/Sparse/recovered/Split·Durable+Ephemeral', term: 'Data-Template + IFR' },
  'vapor-ifr-dense': { coord: 'Data/Dense/—/Split·Durable+Ephemeral', term: 'Named Tree + IFR' },
  'vapor-ifr-sparse': { coord: 'Data/Sparse/recovered/Split·Durable+Ephemeral', term: 'Data-Template + IFR' },
  'vapor-ifr-engine-et': { coord: 'Data/Sparse/recovered/Split·Durable+Ephemeral(engine-et)', term: 'Data-Template + IFR engine-et paint (stub)' },
};

const modes = Object.keys(perOp).filter((m) => CELLS[m]);
const sizes = [...new Set(
  modes.flatMap((m) =>
    Object.keys(perOp[m]).map((op) => op.split('@')[1]),
  ),
)];
const OPS = ['create', 'update10th', 'select', 'updateStorm', 'selectStorm'];

const med = (mode, op, size) => {
  const s = perOp[mode]?.[`${op}@${size}`];
  return s && s.median != null ? +s.median.toFixed(1) : null;
};

// Per-cell table.
const perCell = modes.map((m) => {
  const row = { cell: m, ...CELLS[m] };
  for (const size of sizes) {
    for (const op of OPS) row[`${op}@${size}`] = med(m, op, size);
  }
  return row;
});

// Factor pairs — one axis moved at a time.
const PAIRS = {
  'render vdom→vapor (no-IFR)': ['vdom', 'vapor'],
  'staging opstream→code (vdom, no-IFR)': ['vdom', 'vdom-et'],
  'staging opstream→code (vdom, +IFR)': ['vdom-ifr', 'vdom-ifr-et'],
  'naming dense→sparse (vapor, no-IFR)': ['vapor-dense', 'vapor'],
  'naming dense→sparse (vapor, +IFR)': ['vapor-ifr-dense', 'vapor-ifr-sparse'],
  'staging data→engine (vapor, STUB on web)': ['vapor', 'vapor-engine'],
  'ifr off→on (vdom)': ['vdom', 'vdom-ifr'],
  'ifr off→on (vapor sparse)': ['vapor', 'vapor-ifr'],
  'ifrPaint plain→engine-et (vapor, STUB on web)': [
    'vapor-ifr-sparse',
    'vapor-ifr-engine-et',
  ],
};

const factors = {};
for (const [name, [a, b]] of Object.entries(PAIRS)) {
  if (!perOp[a] || !perOp[b]) continue;
  factors[name] = {};
  for (const size of sizes) {
    for (const op of OPS) {
      const va = med(a, op, size);
      const vb = med(b, op, size);
      if (va == null || vb == null) continue;
      factors[name][`${op}@${size}`] = {
        from: va,
        to: vb,
        deltaMs: +(vb - va).toFixed(1),
        deltaPct: +(((vb - va) / va) * 100).toFixed(1),
      };
    }
  }
}

const out = {
  source: path.basename(inFile),
  meta: data.meta,
  note:
    'Real mouse-click-driven unified table app on dual-thread Lynx-for-Web. '
    + 'create = Create N rows; update = update10th / updateStorm (50 ticks); '
    + 'engine cells run with __VUE_LYNX_ENGINE_ET_STATUS__ = stub (family '
    + 'absent on web) — their deltas are probe overhead, not engine wins.',
  perCell,
  factors,
};

fs.mkdirSync(path.dirname(outStem), { recursive: true });
fs.writeFileSync(`${outStem}.json`, `${JSON.stringify(out, null, 2)}\n`);

// Markdown.
let md = '# Unified benchmark — four-axis per-cell create/update + factors (generated)\n\n';
md += `source: \`${path.basename(inFile)}\` (${data.meta?.date ?? ''}, reps=${data.meta?.stormReps})\n\n`;
for (const size of sizes) {
  md += `## Per-cell @${size} (median ms)\n\n`;
  md += '| cell | coordinate | create | update10th | updateStorm | select | selectStorm |\n';
  md += '|---|---|--:|--:|--:|--:|--:|\n';
  for (const c of perCell) {
    md += `| ${c.cell} | ${c.coord} | ${c[`create@${size}`] ?? '—'} | ${
      c[`update10th@${size}`] ?? '—'
    } | ${c[`updateStorm@${size}`] ?? '—'} | ${c[`select@${size}`] ?? '—'} | ${
      c[`selectStorm@${size}`] ?? '—'
    } |\n`;
  }
  md += '\n';
}
md += '## Main effects (marginal Δ%, one axis at a time)\n\n';
for (const size of sizes) {
  md += `### @${size}\n\n`;
  md += '| factor | create | update10th | updateStorm | select | selectStorm |\n';
  md += '|---|--:|--:|--:|--:|--:|\n';
  for (const [name, f] of Object.entries(factors)) {
    const cell = (op) => {
      const d = f[`${op}@${size}`];
      return d ? `${d.deltaPct}%` : '—';
    };
    md += `| ${name} | ${cell('create')} | ${cell('update10th')} | ${
      cell('updateStorm')
    } | ${cell('select')} | ${cell('selectStorm')} |\n`;
  }
  md += '\n';
}
md += `> ${out.note}\n`;
fs.writeFileSync(`${outStem}.md`, md);
console.log(md);
