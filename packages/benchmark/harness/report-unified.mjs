/**
 * Human-facing unified benchmark report — same visual language as
 * report-table.mjs (krausest cells + scale charts), covering the full
 * architecture × IFR × FCP matrix and claim reevaluation.
 *
 *   node harness/report-unified.mjs [--out results/unified/report.html]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: {
    out: { type: 'string', default: 'results/unified/report.html' },
  },
});

function readJson(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const unified = readJson('results/unified/latest.json');
if (!unified) {
  throw new Error('Run bench:synthesize first — missing results/unified/latest.json');
}

const ifrStorms = readJson('results/cross-storms-unified-ifr.json');
const reactStorms = readJson('results/cross-storms-unified-react.json');
const scale6 = readJson('results/cross-storms-scale6.json');

// Merge perOp the same way synthesize prefers newest.
function mergePerOp(...sources) {
  const out = {};
  const dated = [];
  for (const src of sources) {
    if (!src?.perOp) continue;
    dated.push({ date: src.meta?.date ?? '1970', perOp: src.perOp });
  }
  dated.sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const { perOp } of dated) {
    for (const [mode, ops] of Object.entries(perOp)) {
      out[mode] = { ...(out[mode] ?? {}), ...ops };
    }
  }
  return out;
}

const perOp = mergePerOp(scale6, ifrStorms, reactStorms);

// `react` = ReactLynx optimized variant: Snapshot+IFR (always on in RL) +
// manual memo/useCallback row. Not the naive or compiler builds.
const COLUMNS = [
  { key: 'vapor', label: 'Vue Vapor' },
  { key: 'vapor-ifr', label: 'Vapor+IFR' },
  { key: 'vdom', label: 'Vue VDOM' },
  { key: 'vdom-ifr', label: 'VDOM+IFR' },
  { key: 'vdom-ifr-et', label: 'VDOM+IFR+ET' },
  { key: 'react', label: 'ReactLynx (memo)' },
].map((c) => ({ ...c, perOp: perOp[c.key] }));

const STORM_ROWS = [
  { key: 'create@1k', label: 'create · 1k rows' },
  { key: 'updateStorm@1k', label: 'update storm ×50 · 1k' },
  { key: 'selectStorm@1k', label: 'select storm ×30 · 1k' },
  { key: 'create@10k', label: 'create · 10k rows' },
  { key: 'update10th@10k', label: 'update every 10th · 10k' },
  { key: 'select@10k', label: 'select row · 10k' },
  { key: 'updateStorm@10k', label: 'update storm ×50 · 10k' },
  { key: 'selectStorm@10k', label: 'select storm ×30 · 10k' },
  { key: 'create@30k', label: 'create · 30k rows' },
  { key: 'updateStorm@30k', label: 'update storm ×50 · 30k' },
  { key: 'selectStorm@30k', label: 'select storm ×30 · 30k' },
];

const FCP_ARCHS = [
  { key: 'vdom', label: 'VDOM', color: '#6b7280' },
  { key: 'vdom-ifr', label: 'VDOM+IFR', color: '#2563eb' },
  { key: 'vdom-ifr-et', label: 'VDOM+IFR+ET', color: '#7c3aed' },
  { key: 'vapor', label: 'Vapor', color: '#059669' },
  { key: 'vapor-ifr', label: 'Vapor+IFR', color: '#d97706' },
];
const FCP_SCALES = ['1k', '3k', '5k', '10k', '20k', '30k'];
const SIZE_N = {
  '1k': 1000,
  '3k': 3000,
  '5k': 5000,
  '10k': 10000,
  '20k': 20000,
  '30k': 30000,
};

function cellMetric(arch, scale, metric, cpu = 1) {
  return unified.cells.find(
    (c) =>
      c.architecture === arch &&
      c.scale === scale &&
      c.metric === metric &&
      c.workload === 'content-probe' &&
      c.cpuThrottle === cpu,
  )?.median;
}

const fmtMs = (v) =>
  v >= 10000
    ? `${(v / 1000).toFixed(1)} s`
    : v >= 1000
      ? `${(v / 1000).toFixed(2)} s`
      : `${v.toFixed(1)} ms`;

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
    const nums = cells.filter((s) => s?.median != null).map((s) => s.median);
    const best = nums.length ? Math.min(...nums) : null;
    html += `<tr><td class="op">${row.label}</td>`;
    for (const [i, s] of cells.entries()) {
      if (s?.median != null && best != null) {
        const factor = s.median / best;
        factorsByCol[columns[i].key].push(factor);
        html += `<td class="c ${bucketClass(factor)}"><b>${fmtMs(s.median)}</b>`
          + `<span class="f">(${factor.toFixed(2)})</span></td>`;
      } else if (s?.dnf) {
        html += `<td class="c dnf">DNF</td>`;
      } else {
        html += `<td class="c na">—</td>`;
      }
    }
    html += '</tr>';
  }

  html += `<tr class="geo"><td class="op">slowdown geometric mean</td>`;
  for (const c of columns) {
    const f = factorsByCol[c.key];
    if (!f.length) {
      html += `<td class="c na">—</td>`;
      continue;
    }
    const geo = Math.exp(f.reduce((a, b) => a + Math.log(b), 0) / f.length);
    html += `<td class="c ${bucketClass(geo)}"><b>${geo.toFixed(2)}</b></td>`;
  }
  html += '</tr></tbody></table>';
  return html;
}

function renderFcpTable(cpu) {
  let html = '<table><thead><tr><th>scale</th>';
  for (const a of FCP_ARCHS) html += `<th>${a.label}</th>`;
  html += '</tr></thead><tbody>';
  for (const scale of FCP_SCALES) {
    const vals = FCP_ARCHS.map((a) => cellMetric(a.key, scale, 'fcp', cpu));
    const nums = vals.filter((v) => v != null);
    const best = nums.length ? Math.min(...nums) : null;
    html += `<tr><td class="op">${scale} elements</td>`;
    for (const v of vals) {
      if (v == null || best == null) {
        html += `<td class="c na">—</td>`;
      } else {
        const factor = v / best;
        html += `<td class="c ${bucketClass(factor)}"><b>${fmtMs(v)}</b>`
          + `<span class="f">(${factor.toFixed(2)})</span></td>`;
      }
    }
    html += '</tr>';
  }
  return `${html}</tbody></table>`;
}

function niceLinearTicks(lo, hi, maxTicks = 6) {
  if (!(hi > lo)) return [lo];
  const span = hi - lo;
  const step0 = span / Math.max(1, maxTicks - 1);
  const mag = 10 ** Math.floor(Math.log10(step0));
  const residual = step0 / mag;
  const step =
    residual <= 1.5 ? mag : residual <= 3 ? 2 * mag : residual <= 7 ? 5 * mag : 10 * mag;
  const start = Math.ceil((lo - step * 1e-9) / step) * step;
  const ticks = [];
  for (let t = start; t <= hi + step * 1e-6; t += step) ticks.push(t);
  return ticks;
}

function renderLineChart({
  title,
  sub,
  series,
  xLabel,
  yLabel,
  yFmt = (t) => (t >= 1000 ? `${t / 1000}s` : `${t}ms`),
}) {
  const all = series.flatMap((s) => s.pts);
  if (!all.length) return '';
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xmin = 0;
  const xmax = Math.max(...xs) * 1.08;
  const ymin = 0;
  const ymax = Math.max(...ys) * 1.08;
  const W = 560;
  const H = 380;
  const ML = 56;
  const MR = 130;
  const MT = 16;
  const MB = 44;
  const px = (v) => ML + ((v - xmin) / (xmax - xmin || 1)) * (W - ML - MR);
  const py = (v) => H - MB - ((v - ymin) / (ymax - ymin || 1)) * (H - MT - MB);

  let g = '';
  for (const t of niceLinearTicks(xmin, xmax)) {
    g += `<line x1="${px(t)}" y1="${MT}" x2="${px(t)}" y2="${H - MB}" class="grid"/>`
      + `<text x="${px(t)}" y="${H - MB + 16}" class="tick" text-anchor="middle">${
        t >= 1000 ? `${t / 1000}k` : t
      }</text>`;
  }
  for (const t of niceLinearTicks(ymin, ymax)) {
    g += `<line x1="${ML}" y1="${py(t)}" x2="${W - MR}" y2="${py(t)}" class="grid"/>`
      + `<text x="${ML - 6}" y="${py(t) + 3.5}" class="tick" text-anchor="end">${yFmt(t)}</text>`;
  }

  let marks = '';
  const labelYs = [];
  for (const [i, s] of series.entries()) {
    if (!s.pts.length) continue;
    const cls = `s${(i % 6) + 1}`;
    const d = s.pts
      .map((p, k) => `${k ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
      .join('');
    marks += `<path d="${d}" class="line ${cls}" style="stroke:${s.color}"/>`;
    for (const p of s.pts) {
      marks += `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="4.5" class="dot ${cls}" style="fill:${s.color}">`
        + `<title>${s.label} · ${p.label}\n${yLabel}: ${fmtMs(p.y)}</title></circle>`;
    }
    const last = s.pts[s.pts.length - 1];
    let ly = py(last.y) + 4;
    while (labelYs.some((v) => Math.abs(v - ly) < 13)) ly += 13;
    labelYs.push(ly);
    marks += `<text x="${(px(last.x) + 9).toFixed(1)}" y="${ly.toFixed(1)}" class="slabel" fill="${s.color}">${s.label}</text>`;
  }

  return `<div class="chart"><h3>${title}</h3><p class="sub">${sub}</p>
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">
${g}
<text x="${(ML + (W - ML - MR) / 2).toFixed(0)}" y="${H - 6}" class="axis" text-anchor="middle">${xLabel}</text>
<text x="14" y="${(MT + (H - MT - MB) / 2).toFixed(0)}" class="axis" text-anchor="middle" transform="rotate(-90 14 ${(MT + (H - MT - MB) / 2).toFixed(0)})">${yLabel}</text>
${marks}
</svg></div>`;
}

function stormSeries(op, ticks = 1) {
  return COLUMNS.map((c, i) => {
    const colors = ['#2a78d6', '#d97706', '#1baf7a', '#2563eb', '#7c3aed', '#eda100'];
    const pts = ['1k', '10k', '30k']
      .map((size) => {
        const v = c.perOp?.[`${op}@${size}`]?.median;
        if (v == null) return null;
        return { x: SIZE_N[size], y: v / ticks, label: size };
      })
      .filter(Boolean);
    return { label: c.label, color: colors[i], pts };
  }).filter((s) => s.pts.length);
}

function fcpSeries(cpu) {
  return FCP_ARCHS.map((a) => ({
    label: a.label,
    color: a.color,
    pts: FCP_SCALES.map((scale) => {
      const v = cellMetric(a.key, scale, 'fcp', cpu);
      if (v == null) return null;
      return { x: SIZE_N[scale], y: v, label: scale };
    }).filter(Boolean),
  })).filter((s) => s.pts.length);
}

const STATUS_CLASS = {
  holds: 'good',
  'holds-with-caveat': 'warn',
  'holds-locally': 'warn',
  'holds-as-negative-control': 'good',
  challenge: 'serious',
  weakened: 'serious',
  'needs-data': 'warn',
  'falsified-as-universal': 'critical',
  falsified: 'critical',
};

function renderVerdicts() {
  let html = '<div class="verdicts">';
  for (const v of unified.verdicts ?? []) {
    const cls = STATUS_CLASS[v.status] ?? 'warn';
    html += `<article class="verdict ${cls}">
      <header><code>${v.id}</code><span class="badge">${v.status}</span></header>
      <p class="claim">${escapeHtml(v.claim)}</p>
      <p class="detail">${escapeHtml(v.detail)}</p>
    </article>`;
  }
  return `${html}</div>`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderFindings() {
  const bullets = [
    'Absolute ms are <b>host-bound</b> — old playground quoted React selectStorm@10k ≈ 2544 ms; this host ≈ 1018 ms. Ratios travel.',
    'Vapor selectStorm@10k is <b>~8×</b> VDOM and <b>~23×</b> React on the same host. One-shot select stays near the frame floor.',
    'Plain IFR ≈ off for post-mount table ops (selectStorm@10k 1.01×). First-frame / bundle concern only.',
    '<b>IFR+ET is not first-frame-only</b> on this table: selectStorm@10k 0.72× vs off — template clone helps after mount.',
    '“−19% FCP” is not a constant: IFR without ET <b>loses ~20% at 10k–30k</b>; IFR+ET stays ahead across the ladder.',
  ];
  return `<ul class="findings">${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`;
}

function coverageTable() {
  const archs = unified.architectures ?? [];
  let html =
    '<table><thead><tr><th>architecture</th><th>table storms</th><th>content-probe FCP</th><th>instrumented BG/e2e</th></tr></thead><tbody>';
  for (const a of archs) {
    const storm = unified.cells.some(
      (c) => c.architecture === a.id && c.metric === 'selectStorm',
    );
    const fcp = unified.cells.some(
      (c) => c.architecture === a.id && c.metric === 'fcp',
    );
    const bg = unified.cells.some(
      (c) => c.architecture === a.id && c.instrumented,
    );
    html += `<tr><td class="op">${a.label} <code>${a.id}</code></td>`
      + `<td class="c plain">${storm ? '✓' : '—'}</td>`
      + `<td class="c plain">${fcp ? '✓' : '—'}</td>`
      + `<td class="c plain">${bg ? '✓' : '—'}</td></tr>`;
  }
  return `${html}</tbody></table>`;
}

const meta = unified.meta;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unified Vue Lynx benchmark matrix</title>
<style>
  :root {
    --surface: #fcfcfb; --ink: #0b0b0b; --ink-2: #52514e; --line: #e4e3df;
    --good: #0ca30c; --warn: #fab219; --serious: #ec835a; --critical: #d03b3b;
    --tint: 18%;
    --s1: #2a78d6; --s2: #d97706; --s3: #1baf7a; --s4: #2563eb; --s5: #7c3aed; --s6: #eda100;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --surface: #1a1a19; --ink: #ffffff; --ink-2: #c3c2b7; --line: #3a3a37; --tint: 30%;
      --s1: #3987e5; --s2: #f0a020; --s3: #199e70; --s4: #5b8def; --s5: #9085e9; --s6: #c98500;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 20px 16px 48px; background: var(--surface); color: var(--ink);
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 28px 0 8px; }
  .sub { color: var(--ink-2); font-size: 12.5px; margin: 0 0 14px; max-width: 920px; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; min-width: 720px; width: 100%; }
  th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: right; white-space: nowrap; }
  th { font-size: 12px; color: var(--ink-2); font-weight: 600; }
  th:first-child, td.op { text-align: left; }
  td.op { color: var(--ink-2); font-size: 13px; }
  td.op code { font-size: 11px; opacity: 0.75; }
  td.c b { font-weight: 600; }
  td.c .f { display: block; font-size: 11px; color: var(--ink-2); }
  td.good     { background: color-mix(in srgb, var(--good) var(--tint), var(--surface)); }
  td.warn     { background: color-mix(in srgb, var(--warn) var(--tint), var(--surface)); }
  td.serious  { background: color-mix(in srgb, var(--serious) var(--tint), var(--surface)); }
  td.critical { background: color-mix(in srgb, var(--critical) var(--tint), var(--surface)); }
  td.dnf { background: var(--critical); color: #fff; font-weight: 600; }
  td.na, td.plain { color: var(--ink-2); }
  tr.geo td { border-top: 2px solid var(--line); }
  .legend { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 0; font-size: 12px; color: var(--ink-2); }
  .legend span { display: inline-flex; align-items: center; gap: 5px; }
  .legend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  .charts { display: flex; flex-wrap: wrap; gap: 18px; }
  .chart { flex: 1 1 420px; max-width: 600px; }
  .chart h3 { font-size: 13.5px; margin: 8px 0 2px; }
  .chart svg { width: 100%; height: auto; }
  .grid { stroke: var(--line); stroke-width: 1; }
  .tick, .axis { fill: var(--ink-2); font-size: 10.5px; }
  .axis { font-size: 11px; }
  .line { fill: none; stroke-width: 2.4; }
  .dot { stroke: var(--surface); stroke-width: 2; }
  .slabel { font-size: 11px; font-weight: 600; }
  .verdicts {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px; margin: 8px 0 18px;
  }
  .verdict {
    border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px;
    background: color-mix(in srgb, var(--surface) 92%, var(--ink-2));
  }
  .verdict.good { border-left: 4px solid var(--good); }
  .verdict.warn { border-left: 4px solid var(--warn); }
  .verdict.serious { border-left: 4px solid var(--serious); }
  .verdict.critical { border-left: 4px solid var(--critical); }
  .verdict header { display: flex; justify-content: space-between; gap: 8px; align-items: center; margin-bottom: 6px; }
  .verdict code { font-size: 11.5px; }
  .badge {
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
    padding: 2px 7px; border-radius: 999px; background: var(--line); color: var(--ink);
  }
  .verdict.good .badge { background: color-mix(in srgb, var(--good) 28%, var(--surface)); }
  .verdict.warn .badge { background: color-mix(in srgb, var(--warn) 35%, var(--surface)); }
  .verdict.serious .badge { background: color-mix(in srgb, var(--serious) 35%, var(--surface)); }
  .verdict.critical .badge { background: color-mix(in srgb, var(--critical) 35%, var(--surface)); color: #fff; }
  .claim { font-size: 12.5px; color: var(--ink-2); margin: 0 0 8px; font-style: italic; }
  .detail { font-size: 13px; margin: 0; }
  .findings { margin: 0 0 8px; padding-left: 18px; max-width: 920px; }
  .findings li { margin: 6px 0; }
  .notes { margin-top: 24px; font-size: 12.5px; color: var(--ink-2); max-width: 920px; }
  .notes li { margin: 4px 0; }
  a { color: inherit; }
  .pillrow { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 18px; }
  .pill {
    font-size: 12px; border: 1px solid var(--line); border-radius: 999px;
    padding: 4px 10px; color: var(--ink-2);
  }
</style>
</head>
<body>
<h1>Unified Vue Lynx benchmark matrix</h1>
<p class="sub">
  One scale for IFR styles × VDOM/Vapor × React — same-host Lynx for Web reevaluation.
  Median latency; <b>(n.nn)</b> = slowdown vs the row's best.
  Generated ${meta.date.slice(0, 10)} · git ${meta.sha} · ${meta.cpus}× ${escapeHtml(meta.cpuModel)}.
</p>
<div class="pillrow">
  <span class="pill">env: lynx-web (primary)</span>
  <span class="pill">ladder: 1k → 30k</span>
  <span class="pill">cells: ${unified.cells.length}</span>
  <span class="pill">claims graded: ${(unified.verdicts ?? []).length}</span>
</div>

<h2>Claim reevaluation</h2>
<p class="sub">Published assumptions from the three old campaigns, graded against the unified result set.</p>
${renderVerdicts()}

<h2>Same-host findings</h2>
${renderFindings()}

<h2>Table storms — IFR × framework matrix</h2>
<p class="sub">
  Black-box protocol: real clicks → composed-DOM end state. Fresh app per (mode, size, rep).
  Vue IFR cells and ReactLynx measured on <b>this host</b> (2026-07-17).
  <b>ReactLynx (memo)</b> = Snapshot + IFR (always on — RL has no IFR-off) + manual
  <code>memo</code>/<code>useCallback</code> row. Sibling builds exist
  (<code>react-naive</code>, <code>react-compiler</code>) but are not columns here.
</p>
<div class="scroll">${renderTable(STORM_ROWS, COLUMNS)}</div>
<div class="legend">
  <span><i style="background:color-mix(in srgb, var(--good) var(--tint), var(--surface))"></i>≤ 1.15×</span>
  <span><i style="background:color-mix(in srgb, var(--warn) var(--tint), var(--surface))"></i>≤ 2.5×</span>
  <span><i style="background:color-mix(in srgb, var(--serious) var(--tint), var(--surface))"></i>≤ 10×</span>
  <span><i style="background:color-mix(in srgb, var(--critical) var(--tint), var(--surface))"></i>&gt; 10×</span>
</div>

<h2>Storm scaling (1k → 30k)</h2>
<p class="sub">Linear, zero baseline. Absolute gaps — not log-compressed.</p>
<div class="charts">
  ${renderLineChart({
    title: 'select storm vs table size',
    sub: 'Total wall time for 30 sequential selects. Vapor stays flat; React climbs hard; IFR+ET pulls VDOM down.',
    series: stormSeries('selectStorm'),
    xLabel: 'rows N — linear',
    yLabel: 'select storm — ms',
  })}
  ${renderLineChart({
    title: 'update storm vs table size',
    sub: 'Total wall time for 50 update passes. Creation cost is separate — this is sustained update throughput.',
    series: stormSeries('updateStorm'),
    xLabel: 'rows N — linear',
    yLabel: 'update storm — ms',
  })}
  ${renderLineChart({
    title: 'create vs table size',
    sub: 'React still leads creation. IFR+ET slightly helps VDOM create via template clone.',
    series: stormSeries('create'),
    xLabel: 'rows N — linear',
    yLabel: 'create — ms',
  })}
</div>

<h2>Content-probe FCP (IFR architecture ladder)</h2>
<p class="sub">
  Same generated <b>Vue</b> SFC, ~1k→30k elements — product configs for Vue Lynx IFR/ET only.
  ReactLynx is <b>not</b> on this ladder yet: the probe is one compiled Vue source with
  flag cells; RL would need a parallel same-content app (see <code>ifr-bench/rl-probe</code>
  for a small-screen control, not the 1k→30k matrix). This is the first-frame scale —
  <b>not</b> comparable to storm ms above. CPU ×1.
</p>
<div class="scroll">${renderFcpTable(1)}</div>
<div class="charts" style="margin-top:16px">
  ${renderLineChart({
    title: 'FCP vs content scale (CPU ×1)',
    sub: 'IFR without ET crosses above plain VDOM by 10k. IFR+ET stays lowest through 30k.',
    series: fcpSeries(1),
    xLabel: 'elements N — linear',
    yLabel: 'FCP — ms',
  })}
  ${renderLineChart({
    title: 'FCP vs content scale (CPU ×4)',
    sub: 'Throttled CPU amplifies MT bundle-parse cost. Plain IFR often regresses.',
    series: fcpSeries(4),
    xLabel: 'elements N — linear',
    yLabel: 'FCP — ms',
  })}
</div>

<h2>Coverage</h2>
<p class="sub">What each architecture has been measured for in the unified schema.</p>
<div class="scroll">${coverageTable()}</div>

<div class="notes">
  <ul>
    <li><b>Environments are not interchangeable.</b> Instrumented BG/e2e, black-box click→DOM, lynx-web FCP, and node <code>--jitless</code> warm render share ladder labels but not a metric scale. This page never ratios across them.</li>
    <li><b>How to read the tint:</b> same as the React vs Vue playground — color encodes slowdown vs the row best; the number is always authoritative.</li>
    <li><b>Reproduce:</b> <code>pnpm --filter vue-lynx-benchmark bench:unified</code> then <code>bench:synthesize</code> / <code>node harness/report-unified.mjs</code>.</li>
    <li>Raw: <code>packages/benchmark/results/unified/</code> · design: <code>packages/benchmark/UNIFIED.md</code>.</li>
  </ul>
</div>
</body>
</html>
`;

const outPath = path.isAbsolute(args.out) ? args.out : path.join(root, args.out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log(`[report-unified] wrote ${outPath}`);
