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

/**
 * Five-axis coordinates (terminology v2) per legacy bench id.
 * canonical = the vue-lynx/internal/matrix legalCells() id.
 * Coordinate columns: staging/naming/addressing/provider/lifetime.
 */
const CELLS = {
  'vdom': { canonical: 'vdom-ops-node', coord: 'ops/node/random-access/BTS/persistent', term: 'Op Stream' },
  'vdom-ifr': { canonical: 'vdom-ops-node-ifr', coord: 'ops/node/random-access/BTS+MTS/persistent+ephemeral', term: 'Op Stream + IFR' },
  'vdom-et': { canonical: 'vdom-code-block', coord: 'code/block/random-access/BTS/persistent', term: 'Code-Template' },
  'vdom-ifr-et': { canonical: 'vdom-code-block-ifr', coord: 'code/block/random-access/BTS+MTS/persistent+ephemeral', term: 'Code-Template + IFR' },
  'vapor': { canonical: 'vapor-tree-block', coord: 'tree/block/traversal+recover/BTS/persistent', term: 'Tree-Template' },
  'vapor-dense': { canonical: 'vapor-tree-node', coord: 'tree/node/traversal/BTS/persistent', term: 'Named Tree' },
  'vapor-engine': { canonical: 'vapor-native-block', coord: 'native/block/traversal+recover/Engine/persistent (N/A on web)', term: 'Engine-Template (N/A)' },
  'vapor-ifr': { canonical: 'vapor-tree-block-ifr', coord: 'tree/block/traversal+recover/BTS+MTS/persistent+ephemeral', term: 'Tree-Template + IFR' },
  'vapor-ifr-dense': { canonical: 'vapor-tree-node-ifr', coord: 'tree/node/traversal/BTS+MTS/persistent+ephemeral', term: 'Named Tree + IFR' },
  'vapor-ifr-sparse': { canonical: 'vapor-tree-block-ifr', aliasOf: 'vapor-ifr', coord: 'tree/block/traversal+recover/BTS+MTS/persistent+ephemeral', term: 'Tree-Template + IFR (alias)' },
  'vapor-ifr-engine-et': { canonical: 'vapor-tree-block-ifr-native-paint', coord: 'tree/block/traversal+recover/BTS+MTS/persistent+ephemeral(native-paint) (N/A on web)', term: 'Tree-Template + IFR native-paint (N/A)' },
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
  'staging ops→code (vdom, no-IFR)': ['vdom', 'vdom-et'],
  'staging ops→code (vdom, +IFR)': ['vdom-ifr', 'vdom-ifr-et'],
  'naming node→block (vapor, no-IFR)': ['vapor-dense', 'vapor'],
  'naming node→block (vapor, +IFR)': ['vapor-ifr-dense', 'vapor-ifr-sparse'],
  'staging tree→native (vapor, N/A on web)': ['vapor', 'vapor-engine'],
  'ifr off→on (vdom)': ['vdom', 'vdom-ifr'],
  'ifr off→on (vapor block)': ['vapor', 'vapor-ifr'],
  'ifrPaint plain→native-paint (N/A on web)': [
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
let md = '# Unified benchmark — five-axis per-cell create/update + factors (generated)\n\n';
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
