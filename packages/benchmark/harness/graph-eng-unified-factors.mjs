/**
 * Four-axis factor decomposition over the UNIFIED benchmark storms run
 * (#325). Consumes a cross.mjs storms result (real mouse-click driven
 * create / update10th / select / updateStorm / selectStorm per cell) and
 * emits per-cell create/update tables plus per-factor main effects
 * (marginal Δ, one axis moved at a time).
 *
 *   node harness/graph-eng-unified-factors.mjs [resultsFile] [outStem]
 *
 * Defaults: results/cross-storms-graph-eng-4axis-full.json
 *           (falls back to cross-storms-graph-eng-4axis.json) →
 *           results/unified/graph-eng-unified-factors.{json,md}
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultFull = path.join(root, 'results/cross-storms-graph-eng-4axis-full.json');
const defaultPartial = path.join(root, 'results/cross-storms-graph-eng-4axis.json');
const inFile = process.argv[2]
  ?? (fs.existsSync(defaultFull) ? defaultFull : defaultPartial);
const outStem = process.argv[3]
  ?? path.join(root, 'results/unified/graph-eng-unified-factors');

const data = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const perOp = data.perOp;

/**
 * Six-column coordinates (staging/naming/addressing/provider/lifetime/delivery) per legacy bench id.
 * canonical = the vue-lynx/internal/matrix legalCells() id.
 * Coordinate columns: staging/naming/addressing/provider/lifetime.
 */
const CELLS = {
  'vdom': { flag: 'vdom', canonical: 'vdom-ops-node', coord: 'ops/node/random-access/BTS/persistent/—', term: 'Op Stream' },
  'vdom-ifr': { flag: 'vdom +ifr', canonical: 'vdom-ops-node-ifr', coord: 'ops/node/random-access/BTS+MTS/persistent+ephemeral/—', term: 'Op Stream + IFR' },
  'vdom-et': { flag: 'vdom +b', canonical: 'vdom-code-block', coord: 'code/block/random-access/BTS/persistent/bundle', term: 'Code-Template' },
  'vdom-ifr-et': { flag: 'vdom +b +ifr', canonical: 'vdom-code-block-ifr', coord: 'code/block/random-access/BTS+MTS/persistent+ephemeral/bundle', term: 'Code-Template + IFR' },
  'vapor': { flag: 'vapor +b', canonical: 'vapor-data-block', coord: 'data/block/traversal+recover/BTS/persistent/runtime', term: 'Data-Template' },
  'vapor-dense': { flag: 'vapor', canonical: 'vapor-data-node', coord: 'data/node/traversal/BTS/persistent/runtime', term: 'Named Tree' },
  'vapor-bang': { flag: 'vapor +b!', canonical: 'vapor-data-block-bundle', coord: 'data/block/traversal+recover/BTS/persistent/bundle', term: 'Data-Template (bundle-delivered)' },
  'vapor-code': { flag: 'vapor +b:c', canonical: 'vapor-code-block', coord: 'code/block/traversal+recover/BTS/persistent/bundle', term: 'Code-Template (vapor)' },
  'vapor-engine': { flag: 'vapor +b:e', canonical: 'vapor-native-block', coord: 'native/block/traversal+recover/Engine/persistent/runtime (N/A on web)', term: 'Engine-Template (N/A)' },
  'vapor-ifr': { flag: 'vapor +b +ifr', canonical: 'vapor-data-block-ifr', coord: 'data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime', term: 'Data-Template + IFR' },
  'vapor-ifr-dense': { flag: 'vapor +ifr', canonical: 'vapor-data-node-ifr', coord: 'data/node/traversal/BTS+MTS/persistent+ephemeral/runtime', term: 'Named Tree + IFR' },
  'vapor-ifr-sparse': { flag: 'vapor +b +ifr (alias)', canonical: 'vapor-data-block-ifr', aliasOf: 'vapor-ifr', coord: 'data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime', term: 'Data-Template + IFR (alias)' },
  'vapor-ifr-engine-et': { flag: 'vapor +b +ifr:e', canonical: 'vapor-data-block-ifr-native-paint', coord: 'data/block/traversal+recover/BTS+MTS/persistent+ephemeral/runtime(native-paint) (N/A on web)', term: 'Data-Template + IFR native-paint (N/A)' },
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
// V4 flag-attribution pairs: each factor = turning ONE flag (or one flag
// parameter) on. Bare `+b`'s staging differs by render model (vdom→:c,
// vapor→:t) — the two `+b effect` rows are therefore NOT comparable to
// each other. The render factor compares the two BASELINES (no flags).
const PAIRS = {
  'render effect (vdom → vapor, baselines)': ['vdom', 'vapor-dense'],
  '+b effect (vdom, no ifr)': ['vdom', 'vdom-et'],
  '+b effect (vdom, with +ifr)': ['vdom-ifr', 'vdom-ifr-et'],
  '+b effect (vapor, no ifr)': ['vapor-dense', 'vapor'],
  '+b effect (vapor, with +ifr)': ['vapor-ifr-dense', 'vapor-ifr'],
  '+b! delivery effect (vapor)': ['vapor', 'vapor-bang'],
  '+b:d→c effect (vapor)': ['vapor', 'vapor-code'],
  '+b:d→e effect (vapor, N/A on web)': ['vapor', 'vapor-engine'],
  '+ifr effect (vdom)': ['vdom', 'vdom-ifr'],
  '+ifr effect (vapor +b)': ['vapor', 'vapor-ifr'],
  '+ifr:e paint effect (N/A on web)': [
    'vapor-ifr',
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

// Create-path wire-bytes counters (#337/#338 acceptance): serialized
// vuePatchUpdate buffer bytes per op from the instrumented vapor app
// (harness/wire-bytes.mjs), inlined so the factor data carries the
// delivery-column evidence next to the timing rows.
const wireBytesFile = path.join(root, 'results/wire-bytes-latest.json');
const wireBytes = fs.existsSync(wireBytesFile)
  ? JSON.parse(fs.readFileSync(wireBytesFile, 'utf8'))
  : null;

const out = {
  source: path.basename(inFile),
  meta: data.meta,
  note:
    'Real mouse-click-driven unified table app on dual-thread Lynx-for-Web. '
    + 'create = Create N rows; update = update10th / updateStorm (50 ticks); '
    + 'engine cells run with __VUE_LYNX_ENGINE_ET_STATUS__ = stub (family '
    + 'absent on web) — their deltas are probe overhead, not engine wins.',
  wireBytes: wireBytes
    ? { meta: wireBytes.meta, perCell: wireBytes.perCell }
    : undefined,
  perCell,
  factors,
};

fs.mkdirSync(path.dirname(outStem), { recursive: true });
fs.writeFileSync(`${outStem}.json`, `${JSON.stringify(out, null, 2)}\n`);

// Markdown.
let md = '# Unified benchmark — six-column per-cell create/update + factors (generated)\n\n';
md += `source: \`${path.basename(inFile)}\` (${data.meta?.date ?? ''}, reps=${data.meta?.stormReps})\n\n`;
for (const size of sizes) {
  md += `## Per-cell @${size} (median ms)\n\n`;
  md += '| flags | data key (legacy) | coordinate | create | update10th | updateStorm | select | selectStorm |\n';
  md += '|---|---|---|--:|--:|--:|--:|--:|\n';
  for (const c of perCell) {
    md += `| ${c.flag ?? c.cell} | ${c.cell} | ${c.coord} | ${c[`create@${size}`] ?? '—'} | ${
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
