// Generate a krausest-style (js-framework-benchmark) results table as a
// single self-contained HTML file, from the committed results JSON:
//   - results/cross-storms-latest.json         (react / vdom / vapor)
//   - results/cross-storms-react-variants.json (react-naive / react-compiler)
//   - results/cross-run3-neutralized.json      (sustained scenario, cold, startup, bundles)
//
// Cells show median ms with the slowdown factor vs the row's best; the cell
// tint encodes the factor bucket (numbers are always printed — color is
// redundant). Usage: node harness/report-table.mjs [--out path.html]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: { out: { type: 'string', default: 'results/cross-table.html' } },
});

const storms = JSON.parse(
  fs.readFileSync(path.join(root, 'results/cross-storms-latest.json'), 'utf-8'),
);
const variants = JSON.parse(
  fs.readFileSync(path.join(root, 'results/cross-storms-react-variants.json'), 'utf-8'),
);
const base = JSON.parse(
  fs.readFileSync(path.join(root, 'results/cross-run3-neutralized.json'), 'utf-8'),
);
const webBaselinePath = path.join(root, 'results/web-baseline-latest.json');
const webBaseline = fs.existsSync(webBaselinePath)
  ? JSON.parse(fs.readFileSync(webBaselinePath, 'utf-8'))
  : null;

// ---------------------------------------------------------------------------
// data assembly
// ---------------------------------------------------------------------------

const COLUMNS = [
  { key: 'vapor', label: 'Vue Vapor', perOp: storms.perOp.vapor },
  { key: 'vdom', label: 'Vue VDOM', perOp: storms.perOp.vdom },
  { key: 'react', label: 'React (hooks)', perOp: storms.perOp.react },
  {
    key: 'react-naive',
    label: 'React (naive)',
    perOp: storms.perOp['react-naive'] ?? variants.perOp['react-naive'],
  },
  {
    key: 'react-compiler',
    label: 'React (compiler)',
    perOp: storms.perOp['react-compiler'] ?? variants.perOp['react-compiler'],
  },
];

// Only rows whose durations exceed the one-frame observation floor — the
// sub-frame @1k one-shots are frame-phase noise and deliberately excluded.
const STORM_ROWS = [
  { key: 'updateStorm@1k', label: 'update storm ×50 · 1k rows' },
  { key: 'selectStorm@1k', label: 'select storm ×30 · 1k rows' },
  { key: 'update10th@10k', label: 'update every 10th · 10k rows' },
  { key: 'select@10k', label: 'select row · 10k rows' },
  { key: 'updateStorm@10k', label: 'update storm ×50 · 10k rows' },
  { key: 'selectStorm@10k', label: 'select storm ×30 · 10k rows' },
];

const BASE_ROWS = [
  { key: 'create1k', label: 'create 1,000 rows' },
  { key: 'update10th', label: 'update every 10th row' },
  { key: 'select', label: 'select row' },
  { key: 'swap', label: 'swap rows' },
  { key: 'remove', label: 'remove row' },
  { key: 'append1k', label: 'append 1,000 rows' },
  { key: 'create10k', label: 'create 10,000 rows' },
  { key: 'clear10k', label: 'clear 10,000 rows' },
];
const BASE_COLUMNS = [
  { key: 'vapor', label: 'Vue Vapor', perOp: base.perOp.vapor },
  { key: 'vdom', label: 'Vue VDOM', perOp: base.perOp.vdom },
  { key: 'react', label: 'React (hooks)', perOp: base.perOp.react },
];

// ---------------------------------------------------------------------------
// rendering
// ---------------------------------------------------------------------------

const fmtMs = (v) =>
  v >= 10000
    ? `${(v / 1000).toFixed(1)} s`
    : v >= 1000
    ? `${(v / 1000).toFixed(2)} s`
    : `${v.toFixed(1)} ms`;

// Factor buckets → fixed status palette (good/warning/serious/critical).
// Numbers are always printed; the tint is redundant encoding.
function bucketClass(factor) {
  if (factor <= 1.15) return 'good';
  if (factor <= 2.5) return 'warn';
  if (factor <= 10) return 'serious';
  return 'critical';
}

function renderTable(rows, columns) {
  const factorsByCol = Object.fromEntries(columns.map((c) => [c.key, []]));
  let html = '<table><thead><tr><th>scenario</th>';
  for (const c of columns) html += `<th>${c.label}</th>`;
  html += '</tr></thead><tbody>';

  for (const row of rows) {
    const cells = columns.map((c) => c.perOp?.[row.key] ?? null);
    const best = Math.min(
      ...cells.filter((s) => s?.median != null).map((s) => s.median),
    );
    html += `<tr><td class="op">${row.label}</td>`;
    for (const [i, s] of cells.entries()) {
      if (s?.median != null) {
        const factor = s.median / best;
        factorsByCol[columns[i].key].push(factor);
        html += `<td class="c ${bucketClass(factor)}"><b>${fmtMs(s.median)}</b>`
          + `<span class="f">(${factor.toFixed(2)})</span></td>`;
      } else if (s?.dnf) {
        html += `<td class="c dnf">DNF <span class="f">&gt;240 s</span></td>`;
      } else {
        html += `<td class="c na">—</td>`;
      }
    }
    html += '</tr>';
  }

  // krausest signature: geometric mean of the slowdown factors
  html += `<tr class="geo"><td class="op">slowdown geometric mean</td>`;
  for (const c of columns) {
    const f = factorsByCol[c.key];
    if (f.length === 0) {
      html += `<td class="c na">—</td>`;
      continue;
    }
    const geo = Math.exp(f.reduce((a, b) => a + Math.log(b), 0) / f.length);
    const note = f.length < rows.length ? `<span class="f">${f.length}/${rows.length} rows</span>` : '';
    html += `<td class="c ${bucketClass(geo)}"><b>${geo.toFixed(2)}</b>${note}</td>`;
  }
  html += '</tr></tbody></table>';
  return html;
}

function renderPlainTable(headers, rows) {
  let html = '<table><thead><tr>';
  for (const h of headers) html += `<th>${h}</th>`;
  html += '</tr></thead><tbody>';
  for (const r of rows) {
    html += `<tr><td class="op">${r[0]}</td>${
      r.slice(1).map((v) => `<td class="c plain">${v}</td>`).join('')
    }</tr>`;
  }
  return `${html}</tbody></table>`;
}

const gz = (mode) => {
  const dir = { vapor: 'ui-vapor', vdom: 'ui-vdom', react: 'ui-react' }[mode];
  const entry = base.bundles?.[dir] ?? base.bundles?.[`${dir}/dist`];
  return entry?.['main.lynx.bundle']?.gzip;
};
const kb = (b) => (b == null ? '—' : `${(b / 1024).toFixed(1)} KB`);
const stMed = (m) => base.startup?.[m]?.median?.toFixed(1) ?? '—';
const coldRow = (op) =>
  ['vapor', 'vdom', 'react'].map((m) => {
    const s = base.fresh?.[m]?.[op];
    return s ? fmtMs(s.median) : '—';
  });

const otherTable = renderPlainTable(
  ['dimension', 'Vue Vapor', 'Vue VDOM', 'React (hooks)'],
  [
    ['first screen (median, ms)', stMed('vapor'), stMed('vdom'), stMed('react')],
    ['cold create 1k (fresh app)', ...coldRow('create1k')],
    ['cold create 10k (fresh app)', ...coldRow('create10k')],
    ['bundle gzip (main.lynx.bundle)', kb(gz('vapor')), kb(gz('vdom')), kb(gz('react'))],
  ],
);


// ---------------------------------------------------------------------------
// scale curves: x = create N rows (ms), y = storm per-tick (ms), log-log.
// One polyline per framework through sizes 1k -> 3k -> 5k -> 10k.
// ---------------------------------------------------------------------------

const SIZES = ['1k', '3k', '5k', '10k', '20k', '30k'];
const SIZE_N = { '1k': 1000, '3k': 3000, '5k': 5000, '10k': 10000, '20k': 20000, '30k': 30000 };
const TICKS_OF = { updateStorm: 50, selectStorm: 30 };

function seriesPoints(col, stormOp) {
  const pts = [];
  for (const size of SIZES) {
    const create = col.perOp?.[`create@${size}`]?.median;
    const storm = col.perOp?.[`${stormOp}@${size}`]?.median;
    if (create == null || storm == null) continue;
    pts.push({ size, x: create, y: storm / TICKS_OF[stormOp] });
  }
  return pts;
}

function renderScaleChart(stormOp, titleText, subText) {
  const allPts = COLUMNS.flatMap((c) => seriesPoints(c, stormOp));
  if (allPts.length === 0) return '';
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  const pad = 1.35;
  const xmin = Math.min(...xs) / pad, xmax = Math.max(...xs) * pad;
  const ymin = Math.min(...ys) / pad, ymax = Math.max(...ys) * pad;
  const W = 480, H = 380, ML = 52, MR = 118, MT = 14, MB = 40;
  const px = (v) => ML + ((Math.log10(v) - Math.log10(xmin)) / (Math.log10(xmax) - Math.log10(xmin))) * (W - ML - MR);
  const py = (v) => H - MB - ((Math.log10(v) - Math.log10(ymin)) / (Math.log10(ymax) - Math.log10(ymin))) * (H - MT - MB);
  const tickVals = (lo, hi) =>
    [0.3, 1, 3, 10, 30, 100, 300, 1000, 3000, 10000].filter((t) => t >= lo && t <= hi);
  const fmtTick = (t) => (t >= 1000 ? `${t / 1000}s` : `${t}ms`);

  let g = '';
  for (const t of tickVals(xmin, xmax)) {
    g += `<line x1="${px(t)}" y1="${MT}" x2="${px(t)}" y2="${H - MB}" class="grid"/>`
      + `<text x="${px(t)}" y="${H - MB + 16}" class="tick" text-anchor="middle">${fmtTick(t)}</text>`;
  }
  for (const t of tickVals(ymin, ymax)) {
    g += `<line x1="${ML}" y1="${py(t)}" x2="${W - MR}" y2="${py(t)}" class="grid"/>`
      + `<text x="${ML - 6}" y="${py(t) + 3.5}" class="tick" text-anchor="end">${fmtTick(t)}</text>`;
  }

  let marks = '';
  const labelYs = [];
  for (const [i, col] of COLUMNS.entries()) {
    const pts = seriesPoints(col, stormOp);
    if (pts.length === 0) continue;
    const cls = `s${i + 1}`;
    const path = pts.map((p, k) => `${k ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join('');
    marks += `<path d="${path}" class="line ${cls}"/>`;
    for (const p of pts) {
      marks += `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="4.5" class="dot ${cls}">`
        + `<title>${col.label} · ${p.size} rows\ncreate ${fmtMs(p.x)} · ${stormOp === 'updateStorm' ? 'update' : 'select'} ${p.y.toFixed(1)} ms/tick</title></circle>`;
      if (i === 0) {
        marks += `<text x="${px(p.x).toFixed(1)}" y="${(py(p.y) + 15).toFixed(1)}" class="ptlabel" text-anchor="middle">${p.size}</text>`;
      }
    }
    // direct label at the last point, nudged to avoid collisions
    const last = pts[pts.length - 1];
    let ly = py(last.y) + 4;
    while (labelYs.some((v) => Math.abs(v - ly) < 13)) ly += 13;
    labelYs.push(ly);
    marks += `<text x="${(px(last.x) + 9).toFixed(1)}" y="${ly.toFixed(1)}" class="slabel ${cls}">${col.label}</text>`;
  }

  return `<div class="chart"><h3>${titleText}</h3><p class="sub">${subText}</p>
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${titleText}">
${g}
<text x="${(ML + (W - ML - MR) / 2).toFixed(0)}" y="${H - 6}" class="axis" text-anchor="middle">create N rows — ms, log</text>
<text x="12" y="${(MT + (H - MT - MB) / 2).toFixed(0)}" class="axis" text-anchor="middle" transform="rotate(-90 12 ${(MT + (H - MT - MB) / 2).toFixed(0)})">${stormOp === 'updateStorm' ? 'update' : 'select'} storm — ms per tick, log</text>
${marks}
</svg></div>`;
}

function scaleTableView() {
  let md = '<table><thead><tr><th>framework · size</th><th>create</th><th>update ms/tick</th><th>select ms/tick</th></tr></thead><tbody>';
  for (const col of COLUMNS) {
    for (const size of SIZES) {
      const c = col.perOp?.[`create@${size}`]?.median;
      const u = col.perOp?.[`updateStorm@${size}`]?.median;
      const sel = col.perOp?.[`selectStorm@${size}`]?.median;
      if (c == null) continue;
      md += `<tr><td class="op">${col.label} · ${size}</td><td class="c plain">${fmtMs(c)}</td>`
        + `<td class="c plain">${u == null ? '—' : (u / 50).toFixed(1)}</td>`
        + `<td class="c plain">${sel == null ? '—' : (sel / 30).toFixed(1)}</td></tr>`;
    }
  }
  return md + '</tbody></table>';
}

// log-log slope (scaling exponent alpha in cost ~ N^alpha) via least squares
function slopeFit(pairs) {
  // pairs: [n, ms]
  const pts = pairs.filter(([n, v]) => n > 0 && v > 0)
    .map(([n, v]) => [Math.log10(n), Math.log10(v)]);
  if (pts.length < 3) return null;
  const m = pts.length;
  const sx = pts.reduce((a, p) => a + p[0], 0);
  const sy = pts.reduce((a, p) => a + p[1], 0);
  const sxx = pts.reduce((a, p) => a + p[0] * p[0], 0);
  const sxy = pts.reduce((a, p) => a + p[0] * p[1], 0);
  return (m * sxy - sx * sy) / (m * sxx - sx * sx);
}

function slopeOf(perOp, opPrefix) {
  const pairs = SIZES.map((sz) => [SIZE_N[sz], perOp?.[`${opPrefix}@${sz}`]?.median])
    .filter(([, v]) => v != null);
  return slopeFit(pairs);
}

const WEB_COLUMNS = webBaseline
  ? [
    { key: 'vapor-web', label: 'Vue Vapor (DOM)', perOp: webBaseline.perOp['vapor-web'] },
    { key: 'vue-web', label: 'Vue VDOM (DOM)', perOp: webBaseline.perOp['vue-web'] },
    { key: 'preact-web', label: 'Preact hooks (DOM)', perOp: webBaseline.perOp['preact-web'] },
  ]
  : [];

function slopeTable() {
  const rows = [
    ['create', 'create'],
    ['update storm (per tick)', 'updateStorm'],
    ['select storm (per tick)', 'selectStorm'],
  ];
  const cols = [...COLUMNS, ...WEB_COLUMNS];
  let html = '<table><thead><tr><th>metric ~ N<sup>α</sup></th>';
  for (const c of cols) html += `<th>${c.label}</th>`;
  html += '</tr></thead><tbody>';
  for (const [label, op] of rows) {
    html += `<tr><td class="op">${label}</td>`;
    for (const c of cols) {
      const a = slopeOf(c.perOp, op);
      html += `<td class="c plain">${a == null ? '—' : 'α=' + a.toFixed(2)}</td>`;
    }
    html += '</tr>';
  }
  return html + '</tbody></table>';
}

function lynxTaxSection() {
  if (!webBaseline) return '';
  const PAIRS = [
    ['vapor', 'vapor-web', 'Vue Vapor'],
    ['vdom', 'vue-web', 'Vue VDOM'],
    ['react', 'preact-web', 'React ↔ Preact'],
  ];
  const opDefs = [
    ['create @10k', 'create@10k', 1],
    ['update storm per tick @10k', 'updateStorm@10k', 50],
    ['select storm per tick @10k', 'selectStorm@10k', 30],
  ];
  let html = '<table><thead><tr><th>metric</th>';
  for (const [, , label] of PAIRS) html += `<th>${label}<br>Lynx / DOM / ratio</th>`;
  html += '</tr></thead><tbody>';
  for (const [label, key, div] of opDefs) {
    html += `<tr><td class="op">${label}</td>`;
    for (const [lynxKey, webKey] of PAIRS) {
      const l = storms.perOp[lynxKey]?.[key]?.median;
      const w = webBaseline.perOp[webKey]?.[key]?.median;
      if (l == null || w == null) {
        html += '<td class="c na">—</td>';
        continue;
      }
      html += `<td class="c plain">${(l / div).toFixed(1)} / ${(w / div).toFixed(1)} / ${(l / w).toFixed(1)}×</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return `<h2>Same protocol on plain DOM (no Lynx) — the pipeline tax</h2>
<p class="sub">preact-hooks is ReactLynx's web reference (ReactLynx is preact-based). ms; per-tick values for storms. "ratio" = Lynx ÷ DOM for the same framework family — the cost of the dual-thread pipeline at that op.</p>
<div class="scroll">${html}</div>`;
}


const scaleSection = (() => {
  const c1 = renderScaleChart('updateStorm', 'Creation vs update throughput',
    'Right = slower creation at that scale; up = slower update ticks. Lower-left dominates.');
  const c2 = renderScaleChart('selectStorm', 'Creation vs selection throughput',
    'Selection isolates fine-grained updates: two class changes per tick.');
  if (!c1 && !c2) return '';
  return `<h2>Scaling curves (1k → 30k rows)</h2>
<div class="charts">${c1}${c2}</div>
<details class="tv"><summary>table view</summary><div class="scroll">${scaleTableView()}</div></details>
<h2>Scaling exponents (least-squares fit of cost ∝ N<sup>α</sup> across sizes)</h2>
<p class="sub">α ≈ 1 is linear scaling; α &gt; 1 superlinear. Fitted over all sizes with data (up to 1k–30k).</p>
<div class="scroll">${slopeTable()}</div>
${lynxTaxSection()}`;
})();


const meta = storms.meta;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lynx framework benchmark — React vs Vue VDOM vs Vue Vapor</title>
<style>
  :root {
    --surface: #fcfcfb; --ink: #0b0b0b; --ink-2: #52514e; --line: #e4e3df;
    --good: #0ca30c; --warn: #fab219; --serious: #ec835a; --critical: #d03b3b;
    --tint: 18%;
  }
  @media (prefers-color-scheme: dark) {
    :root { --surface: #1a1a19; --ink: #ffffff; --ink-2: #c3c2b7; --line: #3a3a37; --tint: 30%; }
  }
  :root[data-theme="dark"] { --surface: #1a1a19; --ink: #ffffff; --ink-2: #c3c2b7; --line: #3a3a37; --tint: 30%; }
  :root[data-theme="light"] { --surface: #fcfcfb; --ink: #0b0b0b; --ink-2: #52514e; --line: #e4e3df; --tint: 18%; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 20px 16px 32px; background: var(--surface); color: var(--ink);
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  h1 { font-size: 19px; margin: 0 0 2px; }
  h2 { font-size: 15px; margin: 26px 0 8px; }
  .sub { color: var(--ink-2); font-size: 12.5px; margin: 0 0 14px; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; min-width: 640px; width: 100%; }
  th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: right; white-space: nowrap; }
  th { font-size: 12.5px; color: var(--ink-2); font-weight: 600; }
  th:first-child, td.op { text-align: left; }
  td.op { color: var(--ink-2); font-size: 13px; }
  td.c b { font-weight: 600; }
  td.c .f { display: block; font-size: 11px; color: var(--ink-2); }
  td.good     { background: color-mix(in srgb, var(--good) var(--tint), var(--surface)); }
  td.warn     { background: color-mix(in srgb, var(--warn) var(--tint), var(--surface)); }
  td.serious  { background: color-mix(in srgb, var(--serious) var(--tint), var(--surface)); }
  td.critical { background: color-mix(in srgb, var(--critical) var(--tint), var(--surface)); }
  td.dnf { background: var(--critical); color: #fff; font-weight: 600; }
  td.dnf .f { color: #ffffffcc; }
  td.na { color: var(--ink-2); }
  tr.geo td { border-top: 2px solid var(--line); }
  .legend { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 0; font-size: 12px; color: var(--ink-2); }
  .legend span { display: inline-flex; align-items: center; gap: 5px; }
  .legend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  /* categorical series palette (validated slot order; dark steps selected) */
  :root { --s1: #2a78d6; --s2: #1baf7a; --s3: #eda100; --s4: #008300; --s5: #4a3aa7; }
  @media (prefers-color-scheme: dark) {
    :root { --s1: #3987e5; --s2: #199e70; --s3: #c98500; --s4: #008300; --s5: #9085e9; }
  }
  :root[data-theme="dark"] { --s1: #3987e5; --s2: #199e70; --s3: #c98500; --s4: #008300; --s5: #9085e9; }
  :root[data-theme="light"] { --s1: #2a78d6; --s2: #1baf7a; --s3: #eda100; --s4: #008300; --s5: #4a3aa7; }
  .charts { display: flex; flex-wrap: wrap; gap: 18px; }
  .chart { flex: 1 1 380px; max-width: 560px; }
  .chart h3 { font-size: 13.5px; margin: 8px 0 2px; }
  .chart svg { width: 100%; height: auto; }
  .grid { stroke: var(--line); stroke-width: 1; }
  .tick, .axis, .ptlabel { fill: var(--ink-2); font-size: 10.5px; }
  .axis { font-size: 11px; }
  .ptlabel { font-size: 9.5px; }
  .line { fill: none; stroke-width: 2; }
  .dot { stroke: var(--surface); stroke-width: 2; }
  .slabel { font-size: 11px; font-weight: 600; }
  .line.s1 { stroke: var(--s1); } .dot.s1, .slabel.s1 { fill: var(--s1); }
  .line.s2 { stroke: var(--s2); } .dot.s2, .slabel.s2 { fill: var(--s2); }
  .line.s3 { stroke: var(--s3); } .dot.s3, .slabel.s3 { fill: var(--s3); }
  .line.s4 { stroke: var(--s4); } .dot.s4, .slabel.s4 { fill: var(--s4); }
  .line.s5 { stroke: var(--s5); } .dot.s5, .slabel.s5 { fill: var(--s5); }
  .tv { margin-top: 8px; font-size: 12.5px; color: var(--ink-2); }
  .notes { margin-top: 22px; font-size: 12.5px; color: var(--ink-2); max-width: 860px; }
  .notes li { margin: 4px 0; }
  a { color: inherit; }
</style>
</head>
<body>
<h1>Lynx framework benchmark — React vs Vue VDOM vs Vue Vapor</h1>
<p class="sub">
  Black-box protocol on Lynx for Web: real clicks → composed-DOM end state.
  Median per-click latency; <b>(n.nn)</b> = slowdown factor vs the row's best.
  ${meta.date.slice(0, 10)} · @lynx-js/react ${meta.reactLynxVersion} · vue ${meta.vueVersion} · web-core ${meta.webCoreVersion} · headless Chromium.
</p>

<h2>Update-heavy scenarios (above the one-frame observation floor)</h2>
<p class="sub">Storms: one click triggers N sequential state→render→DOM ticks in the app (update ×50, select ×30). Fresh app per repetition.</p>
<div class="scroll">${renderTable(STORM_ROWS, COLUMNS)}</div>
<div class="legend">
  <span><i style="background:color-mix(in srgb, var(--good) var(--tint), var(--surface))"></i>≤ 1.15×</span>
  <span><i style="background:color-mix(in srgb, var(--warn) var(--tint), var(--surface))"></i>≤ 2.5×</span>
  <span><i style="background:color-mix(in srgb, var(--serious) var(--tint), var(--surface))"></i>≤ 10×</span>
  <span><i style="background:color-mix(in srgb, var(--critical) var(--tint), var(--surface))"></i>&gt; 10×</span>
  <span><i style="background:var(--critical)"></i>DNF = did not finish</span>
  <span>— = not reached (run aborted at an earlier DNF)</span>
</div>

${scaleSection}

<h2>Sustained krausest scenario (70 consecutive operations per load)</h2>
<p class="sub">The classic js-framework-benchmark op set, run back-to-back in one session.</p>
<div class="scroll">${renderTable(BASE_ROWS, BASE_COLUMNS)}</div>

<h2>Other dimensions</h2>
<div class="scroll">${otherTable}</div>

<div class="notes">
  <ul>
    <li><b>How this differs from <a href="https://github.com/krausest/js-framework-benchmark">js-framework-benchmark</a>:</b>
      the target is Lynx's dual-thread runtime (framework in a background worker → ops → main-thread DOM), not the browser's single-threaded DOM;
      latency is measured from a real click to the composed-DOM end state (resolution ≈ one animation frame), not via devtools paint tracing;
      and beyond krausest's fresh-instance protocol it adds sustained-session dimensions — storms (throughput), within-session drift, and DNF.</li>
    <li><b>Correction & runtime artifact (2026-07-11):</b> earlier revisions of this table showed ReactLynx at
      minutes/DNF for storms. A credibility audit (triggered by real-device tests showing React ≈ Vue) traced that
      entirely to <code>@lynx-js/web-core</code>'s <code>lynx.profile</code> shim: it treats "performance exists" as
      an active tracing session and maps every framework profiling call onto <code>performance.mark/measure/clearMarks</code>
      without ever clearing measures — unbounded timeline growth makes each call O(entries). ReactLynx profiles per
      rendered snapshot, Vue never calls the API, hence a React-only, web-only artifact that does not exist on native
      Lynx. The harness now neutralizes <code>lynx.profile:</code> entries identically for every framework; all numbers
      above are measured with the fix.</li>
    <li><b>Should React vs Vue differ this much? They don't.</b> With the artifact removed, one-shot ops are at
      parity at 1k rows and within ~1.5–2× at 10k; storm throughput puts ReactLynx at ~3–5× Vue — the same order of
      magnitude, consistent with js-framework-benchmark expectations and real-device behavior.
      Manual memo/useCallback still helps; React Compiler ≈ naive on ReactLynx's preact-based reconciler.</li>
    <li>Harness: Lynx for Web (not a native device) in headless Chromium; identical byte-level protocol for every framework; each framework uses its idiomatic implementation (immutable + memo for React, the official benchmark's shallowRef style for Vue).</li>
    <li>Reproduce: <code>pnpm --filter vue-lynx-benchmark bench:storms</code> · raw data in <code>packages/benchmark/results/</code>.</li>
  </ul>
</div>
</body>
</html>
`;

const outPath = path.isAbsolute(args.out) ? args.out : path.join(root, args.out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log(`[report-table] wrote ${outPath}`);
