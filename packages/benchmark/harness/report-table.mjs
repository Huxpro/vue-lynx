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
import {
  ARTIFACT_I18N_CSS,
  artifactHostScript,
  t,
  tHtml,
  tSvg,
} from '../../../scripts/artifact-host.mjs';

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
  { key: 'updateStorm@1k', en: 'update storm ×50 · 1k rows', zh: 'update storm ×50 · 1k 行' },
  { key: 'selectStorm@1k', en: 'select storm ×30 · 1k rows', zh: 'select storm ×30 · 1k 行' },
  { key: 'update10th@10k', en: 'update every 10th · 10k rows', zh: '每第 10 行更新 · 10k 行' },
  { key: 'select@10k', en: 'select row · 10k rows', zh: '选中行 · 10k 行' },
  { key: 'updateStorm@10k', en: 'update storm ×50 · 10k rows', zh: 'update storm ×50 · 10k 行' },
  { key: 'selectStorm@10k', en: 'select storm ×30 · 10k rows', zh: 'select storm ×30 · 10k 行' },
];

const BASE_ROWS = [
  { key: 'create1k', en: 'create 1,000 rows', zh: '创建 1,000 行' },
  { key: 'update10th', en: 'update every 10th row', zh: '每第 10 行更新' },
  { key: 'select', en: 'select row', zh: '选中行' },
  { key: 'swap', en: 'swap rows', zh: '交换行' },
  { key: 'remove', en: 'remove row', zh: '删除行' },
  { key: 'append1k', en: 'append 1,000 rows', zh: '追加 1,000 行' },
  { key: 'create10k', en: 'create 10,000 rows', zh: '创建 10,000 行' },
  { key: 'clear10k', en: 'clear 10,000 rows', zh: '清空 10,000 行' },
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
  let html = `<table><thead><tr><th>${t('scenario', '场景')}</th>`;
  for (const c of columns) html += `<th>${c.label}</th>`;
  html += '</tr></thead><tbody>';

  for (const row of rows) {
    const cells = columns.map((c) => c.perOp?.[row.key] ?? null);
    const best = Math.min(
      ...cells.filter((s) => s?.median != null).map((s) => s.median),
    );
    html += `<tr><td class="op">${t(row.en, row.zh)}</td>`;
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
  html += `<tr class="geo"><td class="op">${t('slowdown geometric mean', '减速几何平均')}</td>`;
  for (const c of columns) {
    const f = factorsByCol[c.key];
    if (f.length === 0) {
      html += `<td class="c na">—</td>`;
      continue;
    }
    const geo = Math.exp(f.reduce((a, b) => a + Math.log(b), 0) / f.length);
    const note = f.length < rows.length
      ? `<span class="f">${f.length}/${rows.length} ${t('rows', '行')}</span>`
      : '';
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
  [t('dimension', '维度'), 'Vue Vapor', 'Vue VDOM', 'React (hooks)'],
  [
    [t('first screen (median, ms)', '首屏（中位，ms）'), stMed('vapor'), stMed('vdom'), stMed('react')],
    [t('cold create 1k (fresh app)', '冷启动创建 1k（全新应用）'), ...coldRow('create1k')],
    [t('cold create 10k (fresh app)', '冷启动创建 10k（全新应用）'), ...coldRow('create10k')],
    [t('bundle gzip (main.lynx.bundle)', 'bundle gzip（main.lynx.bundle）'), kb(gz('vapor')), kb(gz('vdom')), kb(gz('react'))],
  ],
);


// ---------------------------------------------------------------------------
// scale curves: x = create N rows (ms), y = storm per-tick (ms).
// One polyline per framework through sizes 1k -> 3k -> 5k -> 10k (+).
// Both linear (zero baseline) and log-log variants.
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

function niceLinearTicks(lo, hi, maxTicks = 6) {
  if (!(hi > lo)) return [lo];
  const span = hi - lo;
  const step0 = span / Math.max(1, maxTicks - 1);
  const mag = 10 ** Math.floor(Math.log10(step0));
  const residual = step0 / mag;
  const step = residual <= 1.5
    ? mag
    : residual <= 3
      ? 2 * mag
      : residual <= 7
        ? 5 * mag
        : 10 * mag;
  const start = Math.ceil((lo - step * 1e-9) / step) * step;
  const ticks = [];
  for (let t = start; t <= hi + step * 1e-6; t += step) ticks.push(t);
  return ticks;
}

function renderScaleChart(stormOp, title, sub, scale = 'log') {
  const titleText = title.en;
  const titleZh = title.zh;
  const subText = sub.en;
  const subZh = sub.zh;
  const useLog = scale === 'log';
  const scaleTag = useLog ? 'log' : 'linear';
  const allPts = COLUMNS.flatMap((c) => seriesPoints(c, stormOp));
  if (allPts.length === 0) return '';
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  let xmin, xmax, ymin, ymax;
  if (useLog) {
    const pad = 1.35;
    xmin = Math.min(...xs) / pad;
    xmax = Math.max(...xs) * pad;
    ymin = Math.min(...ys) / pad;
    ymax = Math.max(...ys) * pad;
  } else {
    xmin = 0;
    xmax = Math.max(...xs) * 1.08;
    ymin = 0;
    ymax = Math.max(...ys) * 1.08;
  }
  const W = 480, H = 380, ML = 52, MR = 118, MT = 14, MB = 40;
  const px = (v) => {
    if (useLog) {
      return ML + ((Math.log10(v) - Math.log10(xmin)) / (Math.log10(xmax) - Math.log10(xmin))) * (W - ML - MR);
    }
    return ML + ((v - xmin) / (xmax - xmin)) * (W - ML - MR);
  };
  const py = (v) => {
    if (useLog) {
      return H - MB - ((Math.log10(v) - Math.log10(ymin)) / (Math.log10(ymax) - Math.log10(ymin))) * (H - MT - MB);
    }
    return H - MB - ((v - ymin) / (ymax - ymin)) * (H - MT - MB);
  };
  const logTicks = [0.3, 1, 3, 10, 30, 100, 300, 1000, 3000, 10000];
  const tickVals = (lo, hi) => {
    if (useLog) return logTicks.filter((t) => t >= lo && t <= hi);
    const ticks = niceLinearTicks(lo, hi);
    if (lo === 0 && (ticks.length === 0 || ticks[0] !== 0)) ticks.unshift(0);
    return ticks;
  };
  const fmtTick = (t) => {
    if (t === 0) return '0';
    if (t >= 1000) return `${t / 1000}s`;
    return Number.isInteger(t) ? `${t}ms` : `${t.toFixed(1)}ms`;
  };

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

  const stormLabelEn = stormOp === 'updateStorm' ? 'update' : 'select';
  const stormLabelZh = stormOp === 'updateStorm' ? 'update' : 'select';
  const xMid = (ML + (W - ML - MR) / 2).toFixed(0);
  const yMid = (MT + (H - MT - MB) / 2).toFixed(0);
  return `<div class="chart"><h3>${t(titleText, titleZh)} (${scaleTag})</h3><p class="sub">${t(subText, subZh)}</p>
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${titleText} (${scaleTag})">
${g}
${tSvg(`x="${xMid}" y="${H - 6}" class="axis" text-anchor="middle"`, `create N rows — ms, ${scaleTag}`, `创建 N 行 — ms，${scaleTag}`)}
${tSvg(`x="12" y="${yMid}" class="axis" text-anchor="middle" transform="rotate(-90 12 ${yMid})"`, `${stormLabelEn} storm — ms per tick, ${scaleTag}`, `${stormLabelZh} storm — 每 tick ms，${scaleTag}`)}
${marks}
</svg></div>`;
}

function scaleTableView() {
  let md = `<table><thead><tr><th>${t('framework · size', '框架 · 规模')}</th><th>${t('create', '创建')}</th><th>${t('update ms/tick', 'update ms/tick')}</th><th>${t('select ms/tick', 'select ms/tick')}</th></tr></thead><tbody>`;
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
    [t('create', '创建'), 'create'],
    [t('update storm (per tick)', 'update storm（每 tick）'), 'updateStorm'],
    [t('select storm (per tick)', 'select storm（每 tick）'), 'selectStorm'],
  ];
  const cols = [...COLUMNS, ...WEB_COLUMNS];
  let html = `<table><thead><tr><th>${tHtml('metric ~ N<sup>α</sup>', '指标 ~ N<sup>α</sup>')}</th>`;
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
    [t('create @10k', '创建 @10k'), 'create@10k', 1],
    [t('update storm per tick @10k', 'update storm 每 tick @10k'), 'updateStorm@10k', 50],
    [t('select storm per tick @10k', 'select storm 每 tick @10k'), 'selectStorm@10k', 30],
  ];
  let html = `<table><thead><tr><th>${t('metric', '指标')}</th>`;
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
  return `<h2>${t('Same protocol on plain DOM (no Lynx) — the pipeline tax', '同一协议跑在裸 DOM（无 Lynx）——管线税')}</h2>
<p class="sub">${t(
    'preact-hooks is ReactLynx\'s web reference (ReactLynx is preact-based). ms; per-tick values for storms. "ratio" = Lynx ÷ DOM for the same framework family — the cost of the dual-thread pipeline at that op.',
    'preact-hooks 是 ReactLynx 的 Web 参照（ReactLynx 基于 preact）。单位 ms；风暴为每 tick。ratio = 同框架族 Lynx ÷ DOM——该操作上双线程管线的成本。',
  )}</p>
<div class="scroll">${html}</div>`;
}


const scaleSection = (() => {
  const linearUpdate = renderScaleChart('updateStorm',
    { en: 'Creation vs update throughput', zh: '创建 vs 更新吞吐' },
    {
      en: 'Linear, zero baseline. Right = slower creation; up = slower update ticks. Absolute gaps pop more than on log-log.',
      zh: '线性、零基线。右 = 创建更慢；上 = 更新 tick 更慢。绝对差距比 log-log 更醒目。',
    },
    'linear');
  const linearSelect = renderScaleChart('selectStorm',
    { en: 'Creation vs selection throughput', zh: '创建 vs 选中吞吐' },
    {
      en: 'Linear, zero baseline. Selection isolates fine-grained updates: two class changes per tick.',
      zh: '线性、零基线。选中隔离细粒度更新：每 tick 两次 class 变更。',
    },
    'linear');
  const logUpdate = renderScaleChart('updateStorm',
    { en: 'Creation vs update throughput', zh: '创建 vs 更新吞吐' },
    {
      en: 'Log-log. Right = slower creation at that scale; up = slower update ticks. Lower-left dominates.',
      zh: 'Log-log。右 = 该规模下创建更慢；上 = 更新 tick 更慢。左下角占优。',
    },
    'log');
  const logSelect = renderScaleChart('selectStorm',
    { en: 'Creation vs selection throughput', zh: '创建 vs 选中吞吐' },
    {
      en: 'Log-log. Selection isolates fine-grained updates: two class changes per tick.',
      zh: 'Log-log。选中隔离细粒度更新：每 tick 两次 class 变更。',
    },
    'log');
  if (!linearUpdate && !logUpdate) return '';
  return `<h2>${t('Scaling curves (1k → 30k rows)', '规模曲线（1k → 30k 行）')}</h2>
<p class="sub">${t(
    'Linear charts first (zero baseline — absolute ms gaps); log-log below for scaling shape.',
    '先线性图（零基线——绝对毫秒差距）；下方 log-log 看规模形态。',
  )}</p>
<div class="charts">${linearUpdate}${linearSelect}</div>
<div class="charts">${logUpdate}${logSelect}</div>
<details class="tv"><summary>${t('table view', '表格视图')}</summary><div class="scroll">${scaleTableView()}</div></details>
<h2>${tHtml('Scaling exponents (least-squares fit of cost ∝ N<sup>α</sup> across sizes)', '规模指数（对各规模 cost ∝ N<sup>α</sup> 的最小二乘拟合）')}</h2>
<p class="sub">${tHtml(
    'α ≈ 1 is linear scaling; α &gt; 1 superlinear. Fitted over all sizes with data (up to 1k–30k).',
    'α ≈ 1 为线性规模；α &gt; 1 为超线性。拟合覆盖有数据的全部规模（至多 1k–30k）。',
  )}</p>
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
  ${ARTIFACT_I18N_CSS}
</style>
<script>${artifactHostScript()}</script>
</head>
<body>
<h1>${t('Lynx framework benchmark — React vs Vue VDOM vs Vue Vapor', 'Lynx 框架基准测试 — React vs Vue VDOM vs Vue Vapor')}</h1>
<p class="sub">
  ${tHtml(
    'Black-box protocol on Lynx for Web: real clicks → composed-DOM end state. Median per-click latency; <b>(n.nn)</b> = slowdown factor vs the row\'s best.',
    'Lynx for Web 上的黑盒协议：真实点击 → composed-DOM 终态。每次点击的中位延迟；<b>(n.nn)</b> = 相对行内最优的减速系数。',
  )}
  ${meta.date.slice(0, 10)} · @lynx-js/react ${meta.reactLynxVersion} · vue ${meta.vueVersion} · web-core ${meta.webCoreVersion} · headless Chromium.
</p>

<h2>${t('Update-heavy scenarios (above the one-frame observation floor)', '更新密集场景（高于单帧观测地板）')}</h2>
<p class="sub">${t(
  'Storms: one click triggers N sequential state→render→DOM ticks in the app (update ×50, select ×30). Fresh app per repetition.',
  '风暴：一次点击触发应用内 N 次连续 state→render→DOM tick（update ×50，select ×30）。每次重复使用全新应用。',
)}</p>
<div class="scroll">${renderTable(STORM_ROWS, COLUMNS)}</div>
<div class="legend">
  <span><i style="background:color-mix(in srgb, var(--good) var(--tint), var(--surface))"></i>≤ 1.15×</span>
  <span><i style="background:color-mix(in srgb, var(--warn) var(--tint), var(--surface))"></i>≤ 2.5×</span>
  <span><i style="background:color-mix(in srgb, var(--serious) var(--tint), var(--surface))"></i>≤ 10×</span>
  <span><i style="background:color-mix(in srgb, var(--critical) var(--tint), var(--surface))"></i>&gt; 10×</span>
  <span><i style="background:var(--critical)"></i>${t('DNF = did not finish', 'DNF = 未完成')}</span>
  <span>${t('— = not reached (run aborted at an earlier DNF)', '— = 未跑到（更早的 DNF 中止了本次运行）')}</span>
</div>

${scaleSection}

<h2>${t('Sustained krausest scenario (70 consecutive operations per load)', '持续 krausest 场景（每次加载 70 个连续操作）')}</h2>
<p class="sub">${t(
  'The classic js-framework-benchmark op set, run back-to-back in one session.',
  '经典 js-framework-benchmark 操作集，在同一会话中连续跑完。',
)}</p>
<div class="scroll">${renderTable(BASE_ROWS, BASE_COLUMNS)}</div>

<h2>${t('Other dimensions', '其他维度')}</h2>
<div class="scroll">${otherTable}</div>

<div class="notes">
  <ul>
    <li>${tHtml(
      '<b>How this differs from <a href="https://github.com/krausest/js-framework-benchmark">js-framework-benchmark</a>:</b> the target is Lynx\'s dual-thread runtime (framework in a background worker → ops → main-thread DOM), not the browser\'s single-threaded DOM; latency is measured from a real click to the composed-DOM end state (resolution ≈ one animation frame), not via devtools paint tracing; and beyond krausest\'s fresh-instance protocol it adds sustained-session dimensions — storms (throughput), within-session drift, and DNF.',
      '<b>与 <a href="https://github.com/krausest/js-framework-benchmark">js-framework-benchmark</a> 的不同：</b>被测目标是 Lynx 双线程运行时（框架在后台 worker → ops → 主线程 DOM），不是浏览器单线程 DOM；延迟从真实点击量到 composed-DOM 终态（分辨率 ≈ 一帧），不是 via devtools paint tracing；并在 krausest 的全新实例协议之外增加了持续会话维度——风暴（吞吐）、会话内漂移与 DNF。',
    )}</li>
    <li>${tHtml(
      '<b>Correction &amp; runtime artifact (2026-07-11):</b> earlier revisions of this table showed ReactLynx at minutes/DNF for storms. A credibility audit traced that entirely to <code>@lynx-js/web-core</code>\'s <code>lynx.profile</code> shim — unbounded timeline growth. The harness now neutralizes <code>lynx.profile:</code> entries for every framework; all numbers above are measured with the fix.',
      '<b>修正与运行时伪影（2026-07-11）：</b>早期版本曾把 ReactLynx 风暴报成数分钟/DNF。可信度审计将其完全归因于 <code>@lynx-js/web-core</code> 的 <code>lynx.profile</code> shim——时间线无限增长。harness 现已对所有框架中和 <code>lynx.profile:</code> 条目；上表数字均在修复后测得。',
    )}</li>
    <li>${tHtml(
      '<b>Should React vs Vue differ this much? They don\'t.</b> With the artifact removed, one-shot ops are at parity at 1k rows and within ~1.5–2× at 10k; storm throughput puts ReactLynx at ~3–5× Vue — consistent with js-framework-benchmark expectations and real-device behavior. Manual memo/useCallback still helps; React Compiler ≈ naive on ReactLynx\'s preact-based reconciler.',
      '<b>React 与 Vue 真该差这么多吗？不该。</b>去掉伪影后，单次操作在 1k 行近乎持平、10k 行约 1.5–2×；风暴吞吐上 ReactLynx 约为 Vue 的 3–5×——与 js-framework-benchmark 预期和真机行为一致。手工 memo/useCallback 仍有帮助；在 ReactLynx 的 preact 调和器上 React Compiler ≈ 朴素实现。',
    )}</li>
    <li>${t(
      'Harness: Lynx for Web (not a native device) in headless Chromium; identical byte-level protocol for every framework; each framework uses its idiomatic implementation (immutable + memo for React, the official benchmark\'s shallowRef style for Vue).',
      'Harness：headless Chromium 中的 Lynx for Web（非真机）；各框架字节级协议一致；各自惯用实现（React 用 immutable + memo，Vue 用官方基准的 shallowRef 风格）。',
    )}</li>
    <li>${tHtml(
      'Reproduce: <code>pnpm --filter vue-lynx-benchmark bench:storms</code> · raw data in <code>packages/benchmark/results/</code>.',
      '复现：<code>pnpm --filter vue-lynx-benchmark bench:storms</code> · 原始数据见 <code>packages/benchmark/results/</code>。',
    )}</li>
  </ul>
</div>
</body>
</html>
`;

const outPath = path.isAbsolute(args.out) ? args.out : path.join(root, args.out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log(`[report-table] wrote ${outPath}`);
