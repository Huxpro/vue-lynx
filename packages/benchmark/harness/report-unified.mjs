/**
 * Human-facing unified benchmark report — same visual language as
 * report-table.mjs (krausest cells + scale charts), covering the full
 * architecture × IFR × FCP matrix and claim reevaluation.
 *
 *   node harness/report-unified.mjs
 *     → results/unified/report.html + report.zh.html
 *
 *   node harness/report-unified.mjs --out path/unified.html
 *     → path/unified.html + path/unified.zh.html
 *
 *   node harness/report-unified.mjs --out path.html --lang zh
 *     → single file
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { copy, buildConclusions } from './report-i18n.mjs';
import { THEME_BRIDGE_CSS, THEME_BRIDGE_SCRIPT } from './theme-bridge.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: {
    out: { type: 'string', default: 'results/unified/report.html' },
    lang: { type: 'string', default: 'all' }, // en | zh | all
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
const graphEngFactors = readJson('results/unified/graph-eng-unified-factors.json');
const graphEng4axisStorms = readJson('results/cross-storms-graph-eng-4axis.json');
const graphEng4axisFullStorms = readJson('results/cross-storms-graph-eng-4axis-full.json');

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

// Newest-date merge: the single-host full sweep (all modes × 1k/10k/30k)
// supersedes every earlier per-key sample when present.
const perOp = mergePerOp(
  scale6,
  ifrStorms,
  reactStorms,
  graphEng4axisStorms,
  graphEng4axisFullStorms,
);

/**
 * Engine-staging cells are N/A on Lynx-for-Web: the engine ET PAPI family
 * does not exist here, so their runs are interpretation-fallback CONTROLS
 * (probe overhead only). Honest policy: the report displays N/A for them
 * (raw control samples stay in the committed results JSON), and they are
 * hidden by default behind the "show Engine (N/A) cells" toggle.
 */
const ENGINE_NA_ARCHS = new Set(['vapor-engine', 'vapor-ifr-engine-et']);
/** Same-coordinate replicate of vapor +b +ifr — data kept, display omitted. */
const REPLICATE_ARCHS = new Set(['vapor-ifr-sparse']);
const isEngineNa = (key) =>
  ENGINE_NA_ARCHS.has(key) || REPLICATE_ARCHS.has(key);

// Order follows the approved V4 roster: baseline → +b → +ifr → +b +ifr
// per render model (vdom, then vapor), reference last. The replicate
// column (legacy vapor-ifr-sparse ≡ vapor +b +ifr) is display-omitted.
const COLUMN_KEYS = [
  'vdom',
  'vdom-et',
  'vdom-ifr',
  'vdom-ifr-et',
  'vapor-dense',
  'vapor',
  'vapor-bang',
  'vapor-code',
  'vapor-ifr-dense',
  'vapor-ifr',
  'vapor-engine',
  'vapor-ifr-engine-et',
  'react',
];

const STORM_ROW_KEYS = [
  'create@1k',
  'updateStorm@1k',
  'selectStorm@1k',
  'create@10k',
  'update10th@10k',
  'select@10k',
  'updateStorm@10k',
  'selectStorm@10k',
  'create@30k',
  'updateStorm@30k',
  'selectStorm@30k',
];

const FCP_ARCH_KEYS = [
  { key: 'vdom', color: '#6b7280' },
  { key: 'vdom-et', color: '#374151' },
  { key: 'vdom-ifr', color: '#2563eb' },
  { key: 'vdom-ifr-et', color: '#7c3aed' },
  { key: 'vapor-dense', color: '#66c2a4' },
  { key: 'vapor', color: '#059669' },
  { key: 'vapor-bang', color: '#14b8a6' },
  { key: 'vapor-code', color: '#0891b2' },
  { key: 'vapor-ifr-dense', color: '#f0b429' },
  { key: 'vapor-ifr', color: '#d97706' },
  { key: 'vapor-engine', color: '#0d8a5f' },
  { key: 'vapor-ifr-engine-et', color: '#92400e' },
  { key: 'react', color: '#eda100' },
];
const FCP_SCALES = ['1k', '3k', '5k', '10k', '20k', '30k'];
/** CPU ×4: Vue campaigns only cover through 10k — clip display so React ≠ lone 30k tail. */
const FCP_SCALES_X4 = ['1k', '3k', '5k', '10k'];
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

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function columnsFor(t) {
  return COLUMN_KEYS.filter((key) => !isEngineNa(key)).map((key) => ({
    key,
    label: t.colLabels[key] ?? key,
    perOp: perOp[key],
  }));
}

function stormRowsFor(t) {
  return STORM_ROW_KEYS.map((key) => ({
    key,
    label: t.stormRowLabels[key] ?? key,
  }));
}

function fcpArchsFor(t) {
  return FCP_ARCH_KEYS.filter((a) => !isEngineNa(a.key)).map((a) => ({
    ...a,
    label: t.fcpArchLabels[a.key] ?? a.key,
  }));
}

function renderTable(rows, columns, t) {
  const factorsByCol = Object.fromEntries(columns.map((c) => [c.key, []]));
  let html = `<table><thead><tr><th>${escapeHtml(t.scenario)}</th>`;
  for (const c of columns) html += `<th>${escapeHtml(c.label)}</th>`;
  html += '</tr></thead><tbody>';

  for (const row of rows) {
    const cells = columns.map((c) => c.perOp?.[row.key] ?? null);
    const nums = cells
      .filter((s, i) => s?.median != null && !isEngineNa(columns[i].key))
      .map((s) => s.median);
    const best = nums.length ? Math.min(...nums) : null;
    html += `<tr><td class="op">${escapeHtml(row.label)}</td>`;
    for (const [i, s] of cells.entries()) {
      if (isEngineNa(columns[i].key)) {
        html += `<td class="c na engine-na">N/A</td>`;
      } else if (s?.median != null && best != null) {
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

  html += `<tr class="geo"><td class="op">${escapeHtml(t.geoMean)}</td>`;
  for (const c of columns) {
    if (isEngineNa(c.key)) {
      html += `<td class="c na engine-na">N/A</td>`;
      continue;
    }
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

function fcpScalesFor(cpu) {
  return cpu === 4 ? FCP_SCALES_X4 : FCP_SCALES;
}

function renderFcpTable(cpu, t) {
  const archs = fcpArchsFor(t);
  const scales = fcpScalesFor(cpu);
  let html = `<table><thead><tr><th>${escapeHtml(t.scale)}</th>`;
  for (const a of archs) {
    html += `<th${isEngineNa(a.key) ? ' class="engine-na"' : ''}>${escapeHtml(a.label)}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (const scale of scales) {
    const vals = archs.map((a) => cellMetric(a.key, scale, 'fcp', cpu));
    const nums = vals.filter(
      (v, i) => v != null && !isEngineNa(archs[i].key),
    );
    const best = nums.length ? Math.min(...nums) : null;
    html += `<tr><td class="op">${escapeHtml(t.fcpScale(scale))}</td>`;
    for (const [i, v] of vals.entries()) {
      if (isEngineNa(archs[i].key)) {
        html += `<td class="c na engine-na">N/A</td>`;
      } else if (v == null || best == null) {
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

function logTicks(lo, hi) {
  // decade ticks (…,10,100,1000,…) spanning [lo,hi]
  const ticks = [];
  for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
    const t = 10 ** e;
    if (t >= lo * 0.999 && t <= hi * 1.001) ticks.push(t);
  }
  return ticks.length ? ticks : [lo, hi];
}

// Static SVG (no-JS fallback + print). Labels are placed in TRUE endpoint-y
// order (top→bottom, min-gap) so the legend order always matches the visual
// line order — the interactive layer (LINE_CHART_JS) redraws identically with
// hover + scale. Rendered over an explicit x-window [0, xmax] with y auto-fit
// to the visible points.
function staticLineSVG(series, { W, H, ML, MR, MT, MB, logY, xmax }) {
  const yFmt = (t) => (t >= 1000 ? `${t / 1000}s` : `${Math.round(t)}ms`);
  const vis = series
    .map((s) => ({ ...s, pts: s.pts.filter((p) => p.x <= xmax + 1) }))
    .filter((s) => s.pts.length);
  const ys = vis.flatMap((s) => s.pts.map((p) => p.y)).filter((v) => !logY || v > 0);
  if (!ys.length) return '';
  const rawMax = Math.max(...ys);
  const ymin = logY ? 10 ** Math.floor(Math.log10(Math.min(...ys))) : 0;
  const ymax = logY ? 10 ** Math.ceil(Math.log10(rawMax)) : rawMax * 1.08;
  const l0 = logY ? Math.log10(ymin) : 0;
  const l1 = logY ? Math.log10(ymax) : 0;
  const px = (v) => ML + (v / (xmax || 1)) * (W - ML - MR);
  const py = (v) =>
    logY
      ? H - MB - ((Math.log10(Math.max(v, ymin)) - l0) / (l1 - l0 || 1)) * (H - MT - MB)
      : H - MB - ((v - ymin) / (ymax - ymin || 1)) * (H - MT - MB);

  let g = '';
  for (const tick of niceLinearTicks(0, xmax)) {
    g += `<line x1="${px(tick)}" y1="${MT}" x2="${px(tick)}" y2="${H - MB}" class="grid"/>`
      + `<text x="${px(tick)}" y="${H - MB + 16}" class="tick" text-anchor="middle">${
        tick >= 1000 ? `${tick / 1000}k` : tick
      }</text>`;
  }
  for (const tick of logY ? logTicks(ymin, ymax) : niceLinearTicks(ymin, ymax)) {
    g += `<line x1="${ML}" y1="${py(tick)}" x2="${W - MR}" y2="${py(tick)}" class="grid"/>`
      + `<text x="${ML - 6}" y="${py(tick) + 3.5}" class="tick" text-anchor="end">${yFmt(tick)}</text>`;
  }

  let marks = '';
  for (const s of vis) {
    const d = s.pts.map((p, k) => `${k ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join('');
    marks += `<path d="${d}" class="line" style="stroke:${s.color}"/>`;
    for (const p of s.pts) {
      marks += `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="4.5" class="dot" style="fill:${s.color}"/>`;
    }
  }
  // labels in endpoint-y order
  const ends = vis
    .map((s) => ({ s, x: px(s.pts.at(-1).x), y: py(s.pts.at(-1).y) }))
    .sort((a, b) => a.y - b.y);
  let prevY = -Infinity;
  for (const e of ends) {
    const ly = Math.max(e.y + 4, prevY + 13);
    prevY = ly;
    marks += `<text x="${(e.x + 9).toFixed(1)}" y="${ly.toFixed(1)}" class="slabel" fill="${e.s.color}">${escapeHtml(e.s.label)}</text>`;
  }
  return g + marks;
}

let CHART_SEQ = 0;
let REPORT_LANG = 'en';
function renderLineChart({ title, sub, series, xLabel, yLabel, logY = false, wide = false }) {
  const all = series.flatMap((s) => s.pts);
  if (!all.length) return '';
  const W = wide ? 900 : 620;
  const H = wide ? 480 : 400;
  const ML = 56, MR = 148, MT = 16, MB = 44;
  const xmaxFull = Math.max(...all.map((p) => p.x)) * 1.06;
  const id = `ch${++CHART_SEQ}`;
  const cfg = {
    W, H, ML, MR, MT, MB, logY,
    xl: xLabel, yl: yLabel,
    s: series
      .filter((s) => s.pts.length)
      .map((s) => ({ l: s.label, c: s.color, p: s.pts.map((p) => [p.x, p.y]) })),
  };
  const zh = REPORT_LANG === 'zh';
  const ctl = `<div class="cctl"><button class="creset" type="button" hidden>${
    zh ? '重置视图' : 'reset view'
  }</button><span class="chint">${
    zh ? '拖框放大区域 · 滚轮缩放 · 双击复位 · hover 高亮' : 'drag a box to zoom · wheel to scale · double-click to reset · hover to highlight'
  }</span></div>`;
  return `<figure class="chart ichart${wide ? ' wide' : ''}" id="${id}">
<h3>${escapeHtml(title)}</h3><p class="sub">${sub}</p>
${ctl}
<div class="ccanvas" data-chart='${escapeAttr(JSON.stringify(cfg))}'>
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(title)}">
${staticLineSVG(series, { W, H, ML, MR, MT, MB, logY, xmax: xmaxFull })}
<text x="${(ML + (W - ML - MR) / 2).toFixed(0)}" y="${H - 6}" class="axis" text-anchor="middle">${escapeHtml(xLabel)}</text>
<text x="14" y="${(MT + (H - MT - MB) / 2).toFixed(0)}" class="axis" text-anchor="middle" transform="rotate(-90 14 ${(MT + (H - MT - MB) / 2).toFixed(0)})">${escapeHtml(yLabel)}</text>
</svg></div></figure>`;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
}

// Client-side interactive layer for the line charts. Reads each .ccanvas's
// data-chart JSON, redraws the SVG (labels in true endpoint order), and wires:
//   • hover → highlight that series, dim the rest
//   • x-range slider + wheel/trackpad → zoom the N window (y auto-refits so
//     small-N clusters spread out and become readable)
const LINE_CHART_JS = String.raw`(() => {
  const qq = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const fmtY = (t) => (t >= 1000 ? (t / 1000).toFixed(t % 1000 ? 1 : 0) + 's' : Math.round(t) + 'ms');
  const fmtX = (t) => (t >= 1000 ? (t / 1000).toFixed(t % 1000 ? 1 : 0) + 'k' : Math.round(t));
  function linTicks(lo, hi, max = 6) {
    if (!(hi > lo)) return [lo];
    const step0 = (hi - lo) / (max - 1), mag = 10 ** Math.floor(Math.log10(step0)), r = step0 / mag;
    const step = r <= 1.5 ? mag : r <= 3 ? 2 * mag : r <= 7 ? 5 * mag : 10 * mag;
    const out = []; for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-6; t += step) out.push(t); return out;
  }
  function logTicks(lo, hi) {
    const out = []; for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) { const t = 10 ** e; if (t >= lo * 0.999 && t <= hi * 1.001) out.push(t); } return out.length ? out : [lo, hi];
  }
  function distSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  qq('.ccanvas').forEach((canvas, ci) => {
    let cfg; try { cfg = JSON.parse(canvas.getAttribute('data-chart')); } catch (e) { return; }
    if (!cfg || !cfg.s || !cfg.s.length) return;
    const { W, H, ML, MR, MT, MB, logY } = cfg;
    const svg = canvas.querySelector('svg');
    const fig = canvas.closest('.ichart');
    const resetBtn = fig && fig.querySelector('.creset');
    const clipId = 'clip' + ci;
    const plotL = ML, plotR = W - MR, plotT = MT, plotB = H - MB, plotW = plotR - plotL, plotH = plotB - plotT;
    const allX = cfg.s.flatMap((s) => s.p.map((p) => p[0]));
    const allY = cfg.s.flatMap((s) => s.p.map((p) => p[1])).filter((v) => !logY || v > 0);
    const xF = [0, Math.max(...allX) * 1.06];
    const yF = logY
      ? [10 ** Math.floor(Math.log10(Math.min(...allY))), 10 ** Math.ceil(Math.log10(Math.max(...allY)))]
      : [0, Math.max(...allY) * 1.08];
    let view = { x0: xF[0], x1: xF[1], y0: yF[0], y1: yF[1] };
    let rendered = [];

    const px = (x) => plotL + ((x - view.x0) / ((view.x1 - view.x0) || 1)) * plotW;
    const py = (y) => logY
      ? plotB - ((Math.log10(Math.max(y, 1e-9)) - Math.log10(view.y0)) / ((Math.log10(view.y1) - Math.log10(view.y0)) || 1)) * plotH
      : plotB - ((y - view.y0) / ((view.y1 - view.y0) || 1)) * plotH;
    const xAt = (p) => view.x0 + ((p - plotL) / plotW) * (view.x1 - view.x0);
    const yAt = (p) => logY
      ? 10 ** (Math.log10(view.y0) + ((plotB - p) / plotH) * (Math.log10(view.y1) - Math.log10(view.y0)))
      : view.y0 + ((plotB - p) / plotH) * (view.y1 - view.y0);
    const isFull = () => Math.abs(view.x0 - xF[0]) < 1e-6 && Math.abs(view.x1 - xF[1]) < 1e-6 && Math.abs(view.y0 - yF[0]) < 1e-6 && Math.abs(view.y1 - yF[1]) < 1e-6;

    function draw() {
      let g = '';
      for (const t of linTicks(view.x0, view.x1)) { const X = px(t); if (X < plotL - 0.5 || X > plotR + 0.5) continue; g += '<line x1="' + X + '" y1="' + plotT + '" x2="' + X + '" y2="' + plotB + '" class="grid"/><text x="' + X + '" y="' + (plotB + 16) + '" class="tick" text-anchor="middle">' + fmtX(t) + '</text>'; }
      for (const t of (logY ? logTicks(view.y0, view.y1) : linTicks(view.y0, view.y1))) { const Y = py(t); if (Y < plotT - 0.5 || Y > plotB + 0.5) continue; g += '<line x1="' + plotL + '" y1="' + Y + '" x2="' + plotR + '" y2="' + Y + '" class="grid"/><text x="' + (plotL - 6) + '" y="' + (Y + 3.5) + '" class="tick" text-anchor="end">' + fmtY(t) + '</text>'; }
      let m = ''; rendered = [];
      cfg.s.forEach((s, i) => {
        const pix = s.p.map((p) => [px(p[0]), py(p[1])]);
        rendered.push({ i, l: s.l, c: s.c, pix });
        m += '<path d="' + pix.map((q, k) => (k ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('') + '" class="line" data-i="' + i + '" style="stroke:' + s.c + '"/>';
        for (const p of s.p) { const X = px(p[0]), Y = py(p[1]); if (X < plotL - 3 || X > plotR + 3) continue; m += '<circle cx="' + X.toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="4" class="dot" data-i="' + i + '" style="fill:' + s.c + '"/>'; }
      });
      // labels anchored at the right edge (value where each line meets x1), in y order
      const ends = cfg.s.map((s, i) => {
        const last = s.p[s.p.length - 1];
        const xa = Math.min(view.x1, last[0]);
        let yv = last[1];
        if (xa < last[0]) { for (let k = 1; k < s.p.length; k++) { if (s.p[k][0] >= xa) { const a = s.p[k - 1], b = s.p[k]; yv = a[1] + (b[1] - a[1]) * ((xa - a[0]) / ((b[0] - a[0]) || 1)); break; } } }
        return { i, l: s.l, c: s.c, x: Math.min(px(xa), plotR) + 9, y: py(yv) };
      }).filter((e) => e.y >= plotT - 24 && e.y <= plotB + 24).sort((a, b) => a.y - b.y);
      let prev = -1e9, lab = '';
      for (const e of ends) { const ly = Math.max(e.y + 4, prev + 13); prev = ly; lab += '<text x="' + e.x.toFixed(1) + '" y="' + ly.toFixed(1) + '" class="slabel" data-i="' + e.i + '" fill="' + e.c + '">' + esc(e.l) + '</text>'; }
      const ax = '<text x="' + (plotL + plotW / 2) + '" y="' + (H - 6) + '" class="axis" text-anchor="middle">' + esc(cfg.xl) + '</text>'
        + '<text x="14" y="' + (plotT + plotH / 2) + '" class="axis" text-anchor="middle" transform="rotate(-90 14 ' + (plotT + plotH / 2) + ')">' + esc(cfg.yl) + '</text>';
      svg.innerHTML = '<defs><clipPath id="' + clipId + '"><rect x="' + plotL + '" y="' + plotT + '" width="' + plotW + '" height="' + plotH + '"/></clipPath></defs>'
        + g + '<g clip-path="url(#' + clipId + ')">' + m + '</g>' + ax + lab
        + '<rect class="overlay" x="' + plotL + '" y="' + plotT + '" width="' + plotW + '" height="' + plotH + '"/>'
        + '<rect class="brush" x="0" y="0" width="0" height="0" style="display:none"/>';
      if (resetBtn) resetBtn.hidden = isFull();
      wire();
    }

    function highlight(i) {
      canvas.classList.toggle('hovering', i != null);
      qq('[data-i]', svg).forEach((el) => el.classList.toggle('hl', i != null && +el.dataset.i === i));
    }
    function loc(e) { const m = svg.getScreenCTM().inverse(); const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return [p.x, p.y]; }
    function nearest(mx, my) {
      let best = null, bd = 26;
      for (const s of rendered) for (let k = 1; k < s.pix.length; k++) { const d = distSeg(mx, my, s.pix[k - 1][0], s.pix[k - 1][1], s.pix[k][0], s.pix[k][1]); if (d < bd) { bd = d; best = s.i; } }
      return best;
    }

    function wire() {
      const overlay = svg.querySelector('.overlay');
      const brush = svg.querySelector('.brush');
      let drag = null;
      overlay.addEventListener('pointermove', (e) => {
        const [mx, my] = loc(e);
        if (drag) {
          const x = Math.min(mx, drag[0]), y = Math.min(my, drag[1]), w = Math.abs(mx - drag[0]), h = Math.abs(my - drag[1]);
          brush.setAttribute('x', x); brush.setAttribute('y', y); brush.setAttribute('width', w); brush.setAttribute('height', h); brush.style.display = '';
        } else highlight(nearest(mx, my));
      });
      overlay.addEventListener('pointerdown', (e) => { drag = loc(e); overlay.setPointerCapture(e.pointerId); highlight(null); });
      overlay.addEventListener('pointerup', (e) => {
        if (!drag) return;
        const [mx, my] = loc(e);
        const x0p = Math.min(mx, drag[0]), x1p = Math.max(mx, drag[0]), y0p = Math.min(my, drag[1]), y1p = Math.max(my, drag[1]);
        drag = null; brush.style.display = 'none';
        if (x1p - x0p > 6 && y1p - y0p > 6) {
          view = { x0: Math.max(0, xAt(x0p)), x1: xAt(x1p), y0: yAt(y1p), y1: yAt(y0p) };
          draw();
        }
      });
      overlay.addEventListener('pointerleave', () => { drag = null; brush.style.display = 'none'; highlight(null); });
      overlay.addEventListener('dblclick', () => { view = { x0: xF[0], x1: xF[1], y0: yF[0], y1: yF[1] }; draw(); });
      overlay.addEventListener('wheel', (e) => {
        e.preventDefault();
        const [mx, my] = loc(e), f = e.deltaY > 0 ? 1.12 : 1 / 1.12;
        const cx = xAt(mx), cy = yAt(my);
        view.x0 = Math.max(0, cx + (view.x0 - cx) * f); view.x1 = cx + (view.x1 - cx) * f;
        if (logY) { const l0 = Math.log10(view.y0), l1 = Math.log10(view.y1), lc = Math.log10(Math.max(cy, 1e-9)); view.y0 = 10 ** (lc + (l0 - lc) * f); view.y1 = 10 ** (lc + (l1 - lc) * f); }
        else { view.y0 = cy + (view.y0 - cy) * f; view.y1 = cy + (view.y1 - cy) * f; }
        draw();
      }, { passive: false });
      qq('.slabel', svg).forEach((el) => {
        el.addEventListener('pointerenter', () => highlight(+el.dataset.i));
        el.addEventListener('pointerleave', () => highlight(null));
      });
    }

    if (resetBtn) resetBtn.addEventListener('click', () => { view = { x0: xF[0], x1: xF[1], y0: yF[0], y1: yF[1] }; draw(); });
    draw();
  });
})()`;

function stormSeries(op, t, ticks = 1, pred = null) {
  const cols = columnsFor(t);
  const colors = [
    '#1baf7a', '#0d8a5f', '#66c2a4', // vapor family (greens)
    '#d97706', '#b45309', '#f59e0b', '#92400e', // vapor-ifr family (ambers)
    '#6b7280', '#374151', // vdom, vdom-et (grays)
    '#2563eb', '#7c3aed', // vdom-ifr, vdom-ifr-et
    '#eda100', // react
  ];
  return cols
    .filter((c) => !isEngineNa(c.key) && (!pred || pred(c.key)))
    .map((c, i) => {
      const pts = ['1k', '10k', '30k']
        .map((size) => {
          const v = c.perOp?.[`${op}@${size}`]?.median;
          if (v == null) return null;
          return { x: SIZE_N[size], y: v / ticks, label: size };
        })
        .filter(Boolean);
      return { label: c.label, color: colors[i], pts };
    })
    .filter((s) => s.pts.length);
}

function fcpSeries(cpu, t) {
  const scales = fcpScalesFor(cpu);
  return fcpArchsFor(t)
    .filter((a) => !isEngineNa(a.key))
    .map((a) => ({
      label: a.label,
      color: a.color,
      pts: scales.map((scale) => {
        const v = cellMetric(a.key, scale, 'fcp', cpu);
        if (v == null) return null;
        return { x: SIZE_N[scale], y: v, label: scale };
      }).filter(Boolean),
    }))
    // Fixed-size 4axis cells exist only at the 1k rung — keep the line
    // charts to series that actually form a line (the table shows all).
    .filter((s) => s.pts.length >= 2);
}

function g(arch, scale, metric, workload = 'table', cpu = 1) {
  return unified.cells.find(
    (c) =>
      c.architecture === arch &&
      c.scale === scale &&
      c.metric === metric &&
      c.workload === workload &&
      (c.cpuThrottle ?? 1) === cpu,
  )?.median;
}

function conclusionNumbers() {
  return {
    stormVapor: g('vapor', '10k', 'selectStorm'),
    stormVdom: g('vdom', '10k', 'selectStorm'),
    stormReact: g('react', '10k', 'selectStorm'),
    stormEt: g('vdom-ifr-et', '10k', 'selectStorm'),
    stormIfr: g('vdom-ifr', '10k', 'selectStorm'),
    createReact: g('react', '10k', 'create'),
    createVdom: g('vdom', '10k', 'create'),
    createVapor: g('vapor', '10k', 'create'),
    fcpReact: g('react', '10k', 'fcp', 'content-probe'),
    fcpEt: g('vdom-ifr-et', '10k', 'fcp', 'content-probe'),
    fcpOff: g('vdom', '10k', 'fcp', 'content-probe'),
    fcpIfr: g('vdom-ifr', '10k', 'fcp', 'content-probe'),
    fcpIfr1k: g('vdom-ifr', '1k', 'fcp', 'content-probe'),
    fcpOff1k: g('vdom', '1k', 'fcp', 'content-probe'),
    fcpVaporIfrDense: g('vapor-ifr-dense', '1k', 'fcp', 'content-probe'),
    fcpVaporIfrSparse: g('vapor-ifr-sparse', '1k', 'fcp', 'content-probe'),
    fcpVaporIfrDense4: g('vapor-ifr-dense', '1k', 'fcp', 'content-probe', 4),
    fcpVaporIfrSparse4: g('vapor-ifr-sparse', '1k', 'fcp', 'content-probe', 4),
    bgSelectV: unified.cells.find(
      (c) => c.architecture === 'vapor' && c.metric === 'select_bg' && c.instrumented,
    )?.median,
    bgSelectD: unified.cells.find(
      (c) => c.architecture === 'vdom' && c.metric === 'select_bg' && c.instrumented,
    )?.median,
  };
}

function renderConclusions(lang, t, published) {
  const conclusions = buildConclusions(conclusionNumbers(), lang);
  let html = '<div class="verdicts">';
  for (const c of conclusions) {
    html += `<article class="verdict ${c.tone}">
      <header><strong class="takeaway">${escapeHtml(c.title)}</strong></header>
      <p class="why"><span class="lbl">${escapeHtml(t.whyLabel)}</span> ${escapeHtml(c.why)}</p>
      <p class="evidence"><span class="lbl">${escapeHtml(t.evidenceLabel)}</span> ${escapeHtml(c.evidence)}</p>
    </article>`;
  }
  return { html: `${html}</div>`, count: conclusions.length };
}

function coverageTable(t) {
  const archs = (unified.architectures ?? []).filter(
    (a) => !isEngineNa(a.id),
  );
  const [h0, h1, h2, h3] = t.coverageHeaders;
  let html =
    `<table><thead><tr><th>${escapeHtml(h0)}</th><th>${escapeHtml(h1)}</th>`
    + `<th>${escapeHtml(h2)}</th><th>${escapeHtml(h3)}</th></tr></thead><tbody>`;
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
    const v4 = t.colLabels?.[a.id] ?? t.fcpArchLabels?.[a.id] ?? a.label;
    html += `<tr><td class="op">${escapeHtml(v4)} <code>${escapeHtml(a.id)}</code></td>`
      + `<td class="c plain">${storm ? '✓' : '—'}</td>`
      + `<td class="c plain">${fcp ? '✓' : '—'}</td>`
      + `<td class="c plain">${bg ? '✓' : '—'}</td></tr>`;
  }
  return `${html}</tbody></table>`;
}

function graphEngNamingTable(t) {
  const modes = ['vapor-ifr-dense', 'vapor-ifr-sparse', 'vapor-ifr'];
  const has = modes.some((m) => g(m, '1k', 'fcp', 'content-probe', 1) != null);
  if (!has) return '';

  const dense1 = g('vapor-ifr-dense', '1k', 'fcp', 'content-probe', 1);
  const dense4 = g('vapor-ifr-dense', '1k', 'fcp', 'content-probe', 4);
  const pct = (v, base) => {
    if (v == null || base == null || base === 0) return '—';
    const d = ((v - base) / base) * 100;
    return `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`;
  };
  const naming = (m) => (m === 'vapor-ifr-dense' ? 'dense' : 'sparse');

  let html =
    '<table><thead><tr>'
    + `<th>${escapeHtml(t.scenario)}</th>`
    + '<th>naming</th><th>web gzip</th>'
    + '<th>FCP ×1</th><th>Δ</th><th>FCP ×4</th><th>Δ</th>'
    + '</tr></thead><tbody>';
  for (const m of modes) {
    const f1 = g(m, '1k', 'fcp', 'content-probe', 1);
    const f4 = g(m, '1k', 'fcp', 'content-probe', 4);
    const gz = g(m, '1k', 'bundle_web_gzip', 'content-probe', 1);
    const label = t.colLabels[m] ?? t.fcpArchLabels[m] ?? m;
    html += `<tr><td class="op">${escapeHtml(label)} <code>${escapeHtml(m)}</code></td>`
      + `<td class="c plain">${naming(m)}</td>`
      + `<td class="c plain">${gz == null ? '—' : gz.toLocaleString()}</td>`
      + `<td class="c plain">${f1 == null ? '—' : fmtMs(f1)}</td>`
      + `<td class="c plain">${pct(f1, dense1)}</td>`
      + `<td class="c plain">${f4 == null ? '—' : fmtMs(f4)}</td>`
      + `<td class="c plain">${pct(f4, dense4)}</td></tr>`;
  }
  html += '</tbody></table>';
  return html;
}

/**
 * Four-axis flag-permutation section (#325): per-cell create/update table
 * (1k + 10k) and single-axis marginal factor deltas, both generated by
 * harness/graph-eng-unified-factors.mjs from the all-permutation storms run.
 */
function graphEngFactorsSection(t) {
  if (!graphEngFactors?.perCell?.length) return '';
  const OPS = ['create', 'update10th', 'updateStorm', 'select', 'selectStorm'];
  // Sizes come from the factors file itself so a 30k sweep flows through.
  const sizes = [...new Set(
    Object.values(graphEngFactors.factors ?? {}).flatMap((f) =>
      Object.keys(f).map((k) => k.split('@')[1]),
    ),
  )].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  const cellTable = (size) => {
    let html =
      '<table><thead><tr>'
      + `<th>${escapeHtml(t.scenario)} @${size}</th><th>coordinate</th>`
      + OPS.map((o) => `<th>${escapeHtml(o)}</th>`).join('')
      + '</tr></thead><tbody>';
    for (const c of graphEngFactors.perCell) {
      // Engine cells are N/A here; the alias replicate duplicates
      // vapor +b +ifr — both omitted from display (data stays in JSON).
      if (isEngineNa(c.cell)) continue;
      html += `<tr><td class="op"><b>${escapeHtml(c.flag ?? c.cell)}</b> <code style="font-size:10px">${escapeHtml(c.cell)}</code></td>`
        + `<td class="c plain" style="font-size:11px">${escapeHtml(c.coordinate ?? c.coord ?? '')}</td>`
        + OPS.map((o) => {
          const v = c[`${o}@${size}`];
          return `<td class="c plain">${v == null ? '—' : fmtMs(v)}</td>`;
        }).join('')
        + '</tr>';
    }
    return `${html}</tbody></table>`;
  };

  /** Factors whose pair touches an engine-N/A cell (stub on this host). */
  const isEngineFactor = (name) => /engine|native|:e\b|:e /i.test(name)
    || name.includes(':e effect') || name.includes('d→e');

  const factorTable = (size) => {
    let html =
      '<table><thead><tr>'
      + `<th>factor (marginal Δ%) @${size}</th>`
      + OPS.map((o) => `<th>${escapeHtml(o)}</th>`).join('')
      + '</tr></thead><tbody>';
    for (const [name, f] of Object.entries(graphEngFactors.factors ?? {})) {
      if (isEngineFactor(name)) continue; // N/A on this host — omitted.
      html += `<tr><td class="op">${escapeHtml(name)}</td>`
        + OPS.map((o) => {
          const d = f[`${o}@${size}`];
          if (!d) return '<td class="c plain">—</td>';
          const sign = d.deltaPct >= 0 ? '+' : '';
          return `<td class="c plain">${sign}${d.deltaPct}%</td>`;
        }).join('')
        + '</tr>';
    }
    return `${html}</tbody></table>`;
  };

  /**
   * Diverging horizontal bar chart of marginal factor deltas: one row per
   * factor, one bar per op (create / update10th / updateStorm). Negative
   * (faster) bars grow left in green; positive in red. Pure inline SVG —
   * same self-contained constraint as the line charts.
   */
  const factorBars = (size) => {
    const OPSB = [
      { op: 'create', color: 'var(--s1)' },
      { op: 'update10th', color: 'var(--s2)' },
      { op: 'updateStorm', color: 'var(--s5)' },
      { op: 'select', color: 'var(--s3)' },
      { op: 'selectStorm', color: 'var(--s6)' },
    ];
    const entries = Object.entries(graphEngFactors.factors ?? {})
      .filter(([name]) => !isEngineFactor(name))
      .map(([name, f]) => ({
        name,
        vals: OPSB.map(({ op }) => f[`${op}@${size}`]?.deltaPct ?? null),
      }))
      .filter((e) => e.vals.some((v) => v != null));
    if (!entries.length) return '';

    const maxAbs = Math.max(
      10,
      ...entries.flatMap((e) => e.vals.filter((v) => v != null).map(Math.abs)),
    );
    const W = 760;
    const LABEL_W = 300;
    const rowH = 16;
    const groupGap = 12;
    const groupH = OPSB.length * rowH + groupGap;
    const MT2 = 26;
    const H = MT2 + entries.length * groupH + 24;
    const plotW = W - LABEL_W - 60;
    const x0 = LABEL_W + plotW / 2;
    const px = (v) => (v / maxAbs) * (plotW / 2);

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" style="max-width:${W}px;width:100%">`;
    // center axis + reference gridlines
    svg += `<line x1="${x0}" y1="${MT2 - 8}" x2="${x0}" y2="${H - 18}" stroke="var(--line)" stroke-width="1.5"/>`;
    for (const gpct of [-Math.round(maxAbs), Math.round(maxAbs)]) {
      const gx = x0 + px(gpct);
      svg += `<line x1="${gx}" y1="${MT2 - 4}" x2="${gx}" y2="${H - 18}" stroke="var(--line)" stroke-dasharray="3 4"/>`
        + `<text x="${gx}" y="${H - 4}" font-size="10" fill="var(--ink-2)" text-anchor="middle">${gpct > 0 ? '+' : ''}${gpct}%</text>`;
    }
    svg += `<text x="${x0}" y="${H - 4}" font-size="10" fill="var(--ink-2)" text-anchor="middle">0</text>`;

    let y = MT2;
    for (const e of entries) {
      svg += `<text x="${LABEL_W - 8}" y="${y + (OPSB.length * rowH) / 2 + 4}" font-size="11" fill="var(--ink)" text-anchor="end">${escapeHtml(e.name)}</text>`;
      OPSB.forEach(({ color }, i) => {
        const v = e.vals[i];
        if (v == null) return;
        const w = Math.abs(px(v));
        const bx = v < 0 ? x0 - w : x0;
        const by = y + i * rowH + 2;
        svg += `<rect x="${bx}" y="${by}" width="${Math.max(w, 0.5)}" height="${rowH - 5}" fill="${color}" opacity="0.85" rx="2"/>`
          + `<text x="${v < 0 ? bx - 4 : bx + w + 4}" y="${by + rowH - 8}" font-size="9.5" fill="var(--ink-2)" text-anchor="${v < 0 ? 'end' : 'start'}">${v > 0 ? '+' : ''}${v}%</text>`;
      });
      y += groupH;
    }
    svg += '</svg>';

    const legend = OPSB.map(({ op, color }) =>
      `<span><i style="background:${color};opacity:.85"></i>${escapeHtml(op)}</span>`,
    ).join(' ');
    const zhT = t.lang.startsWith('zh');
    return `<div class="chart"><h3 style="font-size:13px;margin:0 0 2px">${
      zhT ? `主效应 @${size}（Δ% — 左/负 = 更快）` : `Main effects @${size} (Δ% — left/negative = faster)`
    }</h3><div class="legend" style="margin:2px 0 6px">${legend}</div>${svg}</div>`;
  };

  /**
   * FCP main effects: the same one-axis-at-a-time pairs, applied to the
   * content-probe FCP ladder (per scale, ×1 and ×4). First-frame scale —
   * kept separate from the storm factors above (different instrument).
   */
  const FCP_FACTOR_PAIRS = {
    'render effect (vdom → vapor, baselines)': ['vdom', 'vapor-dense'],
    '+b effect (vdom, no ifr)': ['vdom', 'vdom-et'],
    '+b effect (vdom, with +ifr)': ['vdom-ifr', 'vdom-ifr-et'],
    '+b effect (vapor, no ifr)': ['vapor-dense', 'vapor'],
    '+b effect (vapor, with +ifr)': ['vapor-ifr-dense', 'vapor-ifr'],
    '+b! delivery effect (vapor)': ['vapor', 'vapor-bang'],
    '+b:d→c effect (vapor)': ['vapor', 'vapor-code'],
    '+b:d→e effect (vapor, N/A)': ['vapor', 'vapor-engine'],
    '+ifr effect (vdom)': ['vdom', 'vdom-ifr'],
    '+ifr effect (vapor +b)': ['vapor', 'vapor-ifr'],
    '+ifr:e paint effect (N/A)': ['vapor-ifr', 'vapor-ifr-engine-et'],
  };

  const fcpDelta = (a, b, scale, cpu) => {
    const va = cellMetric(a, scale, 'fcp', cpu);
    const vb = cellMetric(b, scale, 'fcp', cpu);
    if (va == null || vb == null) return null;
    return +(((vb - va) / va) * 100).toFixed(1);
  };

  const fcpFactorTable = () => {
    const scales = FCP_SCALES;
    let any = false;
    let html = '<table><thead><tr>'
      + `<th>factor (FCP Δ%)</th>`
      + scales.map((sc) => `<th>×1 @${sc}</th>`).join('')
      + FCP_SCALES_X4.map((sc) => `<th>×4 @${sc}</th>`).join('')
      + '</tr></thead><tbody>';
    for (const [name, [a, b]] of Object.entries(FCP_FACTOR_PAIRS)) {
      if (/engine|native/i.test(name)) continue; // N/A on this host — omitted.
      const cellsX1 = scales.map((sc) => fcpDelta(a, b, sc, 1));
      const cellsX4 = FCP_SCALES_X4.map((sc) => fcpDelta(a, b, sc, 4));
      if (![...cellsX1, ...cellsX4].some((v) => v != null)) continue;
      any = true;
      const td = (v) =>
        `<td class="c plain">${v == null ? '—' : `${v > 0 ? '+' : ''}${v}%`}</td>`;
      html += `<tr><td class="op">${escapeHtml(name)}</td>`
        + cellsX1.map(td).join('') + cellsX4.map(td).join('') + '</tr>';
    }
    return any ? `${html}</tbody></table>` : '';
  };

  const fcpFactorBars = (cpu) => {
    const scales = cpu === 4 ? FCP_SCALES_X4 : FCP_SCALES;
    // One bar per scale within each factor group.
    const scaleColors = ['var(--s1)', 'var(--s4)', 'var(--s3)', 'var(--s2)', 'var(--s5)', 'var(--s6)'];
    const entries = Object.entries(FCP_FACTOR_PAIRS)
      .filter(([name]) => !/engine|native/i.test(name))
      .map(([name, [a, b]]) => ({
        name,
        vals: scales.map((sc) => fcpDelta(a, b, sc, cpu)),
      }))
      .filter((e) => e.vals.some((v) => v != null));
    if (!entries.length) return '';
    const maxAbs = Math.max(
      10,
      ...entries.flatMap((e) => e.vals.filter((v) => v != null).map(Math.abs)),
    );
    const W = 760;
    const LABEL_W = 300;
    const rowH = 12;
    const groupGap = 10;
    const groupH = scales.length * rowH + groupGap;
    const MT2 = 26;
    const H = MT2 + entries.length * groupH + 24;
    const plotW = W - LABEL_W - 60;
    const x0 = LABEL_W + plotW / 2;
    const px = (v) => (v / maxAbs) * (plotW / 2);
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" style="max-width:${W}px;width:100%">`;
    svg += `<line x1="${x0}" y1="${MT2 - 8}" x2="${x0}" y2="${H - 18}" stroke="var(--line)" stroke-width="1.5"/>`;
    for (const gpct of [-Math.round(maxAbs), Math.round(maxAbs)]) {
      const gx = x0 + px(gpct);
      svg += `<line x1="${gx}" y1="${MT2 - 4}" x2="${gx}" y2="${H - 18}" stroke="var(--line)" stroke-dasharray="3 4"/>`
        + `<text x="${gx}" y="${H - 4}" font-size="10" fill="var(--ink-2)" text-anchor="middle">${gpct > 0 ? '+' : ''}${gpct}%</text>`;
    }
    let y = MT2;
    for (const e of entries) {
      svg += `<text x="${LABEL_W - 8}" y="${y + (scales.length * rowH) / 2 + 4}" font-size="11" fill="var(--ink)" text-anchor="end">${escapeHtml(e.name)}</text>`;
      scales.forEach((sc, i) => {
        const v = e.vals[i];
        if (v == null) return;
        const w = Math.abs(px(v));
        const bx = v < 0 ? x0 - w : x0;
        const by = y + i * rowH + 1.5;
        svg += `<rect x="${bx}" y="${by}" width="${Math.max(w, 0.5)}" height="${rowH - 4}" fill="${scaleColors[i % scaleColors.length]}" opacity="0.85" rx="2"/>`;
      });
      y += groupH;
    }
    svg += '</svg>';
    const legend = scales.map((sc, i) =>
      `<span><i style="background:${scaleColors[i % scaleColors.length]};opacity:.85"></i>@${sc}</span>`,
    ).join(' ');
    const zhT = t.lang.startsWith('zh');
    return `<div class="chart"><h3 style="font-size:13px;margin:0 0 2px">${
      zhT
        ? `FCP 主效应 ×${cpu}（Δ% — 左/负 = 首帧更快）`
        : `FCP main effects ×${cpu} (Δ% — left/negative = faster first frame)`
    }</h3><div class="legend" style="margin:2px 0 6px">${legend}</div>${svg}</div>`;
  };

  const fcpFactorsBlock = () => {
    const tbl = fcpFactorTable();
    if (!tbl) return '';
    const zhT = t.lang.startsWith('zh');
    return `<p class="sub" style="margin-top:16px">${
      zhT
        ? 'FCP 主效应（content-probe 首帧量纲，与上面 storm 毫秒是两套仪器，不可互比）：'
        : 'FCP main effects (content-probe first-frame scale — a different instrument from the storm ms above; do not ratio across):'
    }</p>
<div class="charts">${fcpFactorBars(1)}${fcpFactorBars(4)}</div>
<div class="scroll" style="margin-top:10px">${tbl}</div>`;
  };

  const flagLegend = () => {
    const zhT = t.lang.startsWith('zh');
    const rows = zhT
      ? [
        ['<code>基线</code>', 'per-node addressing —— 最朴素、最安全：每个节点独立命名，无需元数据、无需校验。<code>vdom</code> = op stream；<code>vapor</code> = named tree。'],
        ['<code>+b</code>', '<b>block templates</b>：用模板块的 parts 信息做块式命名（<code>base+offset</code>）并物化模板。staging 参数缺省为该 render model 的自然档位 —— <code>vdom +b</code> ≡ <code>+b:c</code>（code，baked <code>create()</code>）；<code>vapor +b</code> ≡ <code>+b:d</code>（data：序列化树在<b>运行期</b>作为数据过线——REGISTER_TREE 每模板一次——由 MT 解释；Split 拓扑所致）。注意：两个 render model 的 <code>+b</code> 因子因此<b>不可互比</b>。信息来源也不同：vdom 是 intrinsic（Vue Block 声明），vapor 是 recovered（编译期恢复，带指纹 fail-safe）。'],
        ['<code>+b:c</code>', 'vapor 的 staging 升到 <b>code</b> 档（#337）：构建期解析 <code>template()</code> HTML，直线 PAPI <code>create()</code> 编进 MT bundle，实例化只过一条 <code>INSTANTIATE_TEMPLATE(id)</code>——residual 运行期完全不过线。命名沿用 <code>base+offset</code> 前序，update 路径零改动；构建期解析与运行期解析的结构指纹不合时<b>静默回退</b> REGISTER_TREE 数据路径。'],
        ['<code>+b!</code>', '<b>delivery 列单独翻转</b>（#338）：staging 仍为 data，但序列化树在<b>构建期</b>烧进 MT bundle（<code>registerVaporStructure(hash, ast)</code>）；BG 只发指纹哈希（REGISTER_TREE_BUNDLE），结构字节 0 过线。解释、命名、update 路径与 <code>vapor +b</code> 逐字节一致；哈希不合时静默回退完整 REGISTER_TREE。'],
        ['<code>+b:e</code>', 'staging 升到 <b>engine</b> 档：模板常驻引擎（<code>__CreateElementTemplate</code> 家族），native clone。作用于 <b>persistent 本体树</b>。本环境（Lynx for Web）无该 PAPI → N/A。'],
        ['<i>delivery</i>', '（第六列性质）residual 何时到 MT：<code>runtime</code> = 运行期过线（vapor +b 的 data 现状与 native）；<code>bundle</code> = 构建期编进 MT bundle（vdom 的 code、RL Snapshot、vapor 的 <code>+b!</code> 与 <code>+b:c</code>）。<code>+b!</code> 是唯一在其他五列全部不动的前提下单独翻转 delivery 的格——纯 delivery 因子的单列读数。'],
        ['<code>+ifr</code>', 'IFR：MTS 抢跑 <b>ephemeral</b> 首帧副本，BG 启动后 hydration 采纳或整体重放。paint 参数缺省 = 首帧继承本体 staging。'],
        ['<code>+ifr:e</code>', '仅<b>首帧副本</b>用 engine 档画（旧名 engine-et）；本体树照常。区别于 <code>+b:e</code>（全程）。本环境 N/A。同理 <code>+ifr:c</code>（旧名 disposable-et）。'],
      ]
      : [
        ['<code>baseline</code>', 'per-node addressing — plainest and safest: every node named independently, no metadata, no validation. <code>vdom</code> = op stream; <code>vapor</code> = named tree.'],
        ['<code>+b</code>', '<b>block templates</b>: use the template block\'s parts information for block naming (<code>base+offset</code>) and template materialization. The staging parameter defaults to the render model\'s natural rung — <code>vdom +b</code> ≡ <code>+b:c</code> (code: baked <code>create()</code>); <code>vapor +b</code> ≡ <code>+b:d</code> (data: the serialized tree crosses the thread boundary as data at RUNTIME — REGISTER_TREE once per template — interpreted on the MT; forced by the Split topology). The two <code>+b</code> factors are therefore <b>not comparable across render models</b>. The information source differs too: intrinsic for vdom (declared by Vue\'s Block), recovered for vapor (compile-time analysis, hence the fingerprint fail-safe).'],
        ['<code>+b:c</code>', 'vapor staging raised to the <b>code</b> rung (#337): the plugin parses each <code>template()</code> HTML string at build time, bakes a straight-line-PAPI <code>create()</code> into the MT bundle, and instantiation crosses as a single <code>INSTANTIATE_TEMPLATE(id)</code> — the residual never crosses at runtime. Naming keeps the <code>base+offset</code> preorder, the update path is untouched; a build↔runtime structure-fingerprint mismatch <b>silently falls back</b> to the REGISTER_TREE data path.'],
        ['<code>+b!</code>', '<b>the Delivery column flipped alone</b> (#338): staging stays data, but the serialized tree is baked into the MT bundle at BUILD time (<code>registerVaporStructure(hash, ast)</code>); the BG sends only the fingerprint hash (REGISTER_TREE_BUNDLE) — zero structure bytes cross. Interpretation, naming, and the update path are byte-identical to <code>vapor +b</code>; on hash mismatch it silently falls back to the full REGISTER_TREE.'],
        ['<code>+b:e</code>', 'staging raised to the <b>engine</b> rung: templates live in the engine (<code>__CreateElementTemplate</code> family), native clone. Applies to the <b>persistent tree</b>. N/A on this host (Lynx for Web has no such PAPI).'],
        ['<i>delivery</i>', '(sixth property column) when the residual reaches the MT: <code>runtime</code> = shipped over the wire (vapor +b\'s data today, and native); <code>bundle</code> = compiled into the MT bundle at build (vdom\'s code, RL Snapshot, vapor\'s <code>+b!</code> and <code>+b:c</code>). <code>+b!</code> is the one cell that flips Delivery with every other column held fixed — the pure single-column delivery read.'],
        ['<code>+ifr</code>', 'IFR: the MTS paints an <b>ephemeral</b> first-frame copy; on BG boot, hydration adopts it or replays in full. The paint parameter defaults to inheriting the persistent tree\'s staging.'],
        ['<code>+ifr:e</code>', 'ONLY the first-frame copy is painted at the engine rung (legacy name engine-et); the persistent tree is unchanged. Distinct from <code>+b:e</code> (whole lifetime). N/A on this host. Likewise <code>+ifr:c</code> (legacy disposable-et).'],
      ];
    let html = `<h3 style="font-size:13.5px;margin:14px 0 6px">${
      zhT ? '优化 flag 图例（cell 名 = 基线 × flag 堆叠，与因子归因一一对应）' : 'Flag legend (cell name = baseline × stacked flags, matching factor attribution one-to-one)'
    }</h3><table><thead><tr><th>${zhT ? '标记' : 'flag'}</th><th>${
      zhT ? '含义' : 'meaning'
    }</th></tr></thead><tbody>`;
    for (const [f, m] of rows) {
      html += `<tr><td class="op">${f}</td><td class="c plain" style="text-align:left">${m}</td></tr>`;
    }
    html += '</tbody></table>';
    html += `<p class="sub" style="margin-top:8px">${
      zhT
        ? '数据文件仍使用 legacy key（映射：<code>vdom-et</code>=vdom +b、<code>vapor</code>=vapor +b（默认）、<code>vapor-dense</code>=vapor 基线、<code>vapor-bang</code>=vapor +b!、<code>vapor-code</code>=vapor +b:c、<code>vapor-ifr-dense</code>=vapor +ifr、<code>vapor-engine</code>=+b:e、<code>vapor-ifr-engine-et</code>=+ifr:e）。<code>vapor-ifr-sparse</code> 是 vapor +b +ifr 的同坐标复测样本，已从显示中省略（数据保留在 JSON）。机制层术语（Named Tree / Tree-Template / Code-Template / Engine-Template）与五轴坐标见 GRAPH-ENG-REPORT.md。'
        : 'Data files keep legacy keys (mapping: <code>vdom-et</code>=vdom +b, <code>vapor</code>=vapor +b (default), <code>vapor-dense</code>=vapor baseline, <code>vapor-bang</code>=vapor +b!, <code>vapor-code</code>=vapor +b:c, <code>vapor-ifr-dense</code>=vapor +ifr, <code>vapor-engine</code>=+b:e, <code>vapor-ifr-engine-et</code>=+ifr:e). <code>vapor-ifr-sparse</code> is a same-coordinate replicate of vapor +b +ifr, omitted from display (data retained in JSON). Mechanism terms (Named Tree / Tree-Template / Code-Template / Engine-Template) and the five-axis coordinates live in GRAPH-ENG-REPORT.md.'
    }</p>`;
    return html;
  };

  return `
<h2>${escapeHtml(t.hGraphEngFactors)}</h2>
<p class="sub">${t.subGraphEngFactors}</p>
${flagLegend()}
${sizes.map((sz, i) => `<div class="scroll"${i ? ' style="margin-top:10px"' : ''}>${cellTable(sz)}</div>`).join('')}
<p class="sub" style="margin-top:14px">${
    t.lang.startsWith('zh')
      ? '主效应（每次只翻一个 flag）。每个 flag 会同时挪动几根坐标轴（见下方「flag ↔ 坐标轴」表），所以这些数字归因到 flag 粒度、不能再往单轴拆。图：柱向左（负）= 该 flag 让该操作更快;±10% 内视为噪声（reps=2）。engine 因子在 web 上是 stub 探测开销。'
      : 'Main effects (one flag flipped at a time). Each flag co-moves several coordinate axes (see the “flag ↔ coordinate axis” map below), so these numbers attribute to flag granularity and cannot be split finer. Charts: bars left (negative) = the flag makes that op faster; read ±10% as noise (reps=2). Engine factors are stub probe overhead on web.'
  }</p>
<div class="charts">
  ${sizes.map((sz) => factorBars(sz)).join('')}
</div>
${factorTakeaways()}
${flagAxisMap()}
${sizes.map((sz) => `<div class="scroll" style="margin-top:10px">${factorTable(sz)}</div>`).join('')}
${fcpFactorsBlock()}
`;

  /** Data-driven takeaways for the main effects (en/zh). */
  function factorTakeaways() {
    const zhT = t.lang.startsWith('zh');
    const f = graphEngFactors.factors ?? {};
    const d = (name, key) => f[name]?.[key]?.deltaPct;
    const fmtP = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v}%`);
    const renderUS = ['1k', '10k', '30k']
      .map((sz) => d('render effect (vdom → vapor, baselines)', `updateStorm@${sz}`))
      .filter((v) => v != null);
    const stagingCreate = ['1k', '10k', '30k']
      .map((sz) => d('+b effect (vdom, no ifr)', `create@${sz}`))
      .filter((v) => v != null);
    const items = zhT
      ? [
        ['<b>Update / select 对模板机制是盲的。</b><code>+b</code> 因子（vdom 与 vapor 两行）在 update10th / select / updateStorm / selectStorm 上各规模都落在 ±10% 噪声带内 — 与 ops 级 factorial（所有 cell 的 update 帧数、native 调用完全相同）互证。模板只改变首帧由谁构建，不改变洞怎么写。',
        ],
        [`<b>模板的 create 收益只在静态重的屏上出现。</b>「负 = 更快」。table app 的 create 被动态 v-for 行主导，模板化只覆盖那一小块静态骨架，所以 staging 因子在 create 上 ${fmtP(stagingCreate[0])}~${fmtP(stagingCreate[stagingCreate.length - 1])} ≈ 噪声；换到静态重内容（sfc-probe FCP 阶梯），block/code 模板就成了唯一在所有规模都为负（更快）的因子。规则：先量你首屏的静态占比，再决定要不要上模板。`],
        [`<b>render 轴（vdom→vapor）才是 update 的大杠杆</b>：updateStorm ${renderUS.map(fmtP).join(' / ')}（1k→30k），远超任何模板轴。交互性能选 render model，别指望模板。`],
        ['<b>IFR 是首帧杠杆，不是交互杠杆</b>：ifr 因子只在 create/FCP 显著，update 因子在噪声内；×4 下 vapor 的 IFR 首帧代价由 +b 收回（基线 +12% → +b +2%）。',
        ],
        ['<b>那 vapor +b 到底做了什么？</b>在动态表格上它对 create / update / select / storm 延迟几乎没影响（各规模都在 ±10% 噪声内）。它真正可测的收益有两处：(1) <b>内存 / 簿记</b> — BG shells −94%、MT 表项 −92%（精确计数）;(2) <b>静态重首屏</b> — block 化让首帧构建更省，收益随子树静态占比上升。一句话：+b 是内存 + 静态首帧优化，不是动态延迟杠杆。我们在 +b / +ifr 上花的功夫，产出的是这两样，而不是表格交互延迟。',
        ],
        ['<b>+b:e 与 +ifr:e 在本环境记为 N/A</b>（Lynx for Web 无引擎 ET PAPI；<code>__VUE_LYNX_ENGINE_ET_STATUS__ = stub</code>）。它们的解释回退对照样本仅用作 fail-safe 成本与噪声尺，不作为 engine 结论；这条轴已端到端可跑，等引擎 PAPI 落地即测真值。',
        ],
      ]
      : [
        ['<b>Update and select are template-blind.</b> Both <code>+b</code> factor rows (vdom and vapor) sit inside the ±10% noise band on update10th / select / updateStorm / selectStorm at every scale — corroborating the ops-level factorial (identical update frames + native calls in every cell). Templates change who builds the first frame, not how holes are written.',
        ],
        [`<b>Template create benefit shows up only on static-heavy screens.</b> Negative = faster. The table app's create is dominated by dynamic v-for rows and templating only covers the small static skeleton, so the staging factor on create is ${fmtP(stagingCreate[0])}…${fmtP(stagingCreate[stagingCreate.length - 1])} ≈ noise; on static-heavy content (the sfc-probe FCP ladder) block/code templates are the one factor negative (faster) at every scale. Rule: measure your first screen's static fraction before reaching for templates.`],
        [`<b>The render axis (vdom→vapor) is the update lever</b>: updateStorm ${renderUS.map(fmtP).join(' / ')} (1k→30k) — far beyond any template axis. Pick the render model for interaction performance; don't expect templates to move it.`],
        ['<b>IFR is a first-frame lever, not an interaction lever</b>: the ifr factor is significant only on create/FCP, its update factors sit in noise; under ×4 vapor\'s IFR first-frame cost is recovered by +b (baseline +12% → +b +2%).',
        ],
        ['<b>So what does vapor +b actually do?</b> On the dynamic table it barely moves create / update / select / storm latency (inside the ±10% noise band at every scale). Its two real, measured payoffs are: (1) <b>memory / bookkeeping</b> — −94% BG shells, −92% MT table entries (exact counts); and (2) <b>static-heavy first frame</b> — block staging makes first-frame construction cheaper, the benefit scaling with the subtree\'s static fraction. In one line: +b is a memory + static-first-frame optimization, not a dynamic-latency lever. The work we spent on +b / +ifr buys those two things, not table interaction latency.',
        ],
        ['<b>+b:e and +ifr:e are N/A on this host</b> (Lynx for Web has no engine ET PAPI; <code>__VUE_LYNX_ENGINE_ET_STATUS__ = stub</code>). Their interpretation-fallback control samples serve only as a fail-safe-cost / noise yardstick, never as engine conclusions; the axis runs end-to-end and reports real numbers the day the engine PAPI ships.',
        ],
      ];
    // Compact cards (bold takeaway + small detail) so the key point is
    // scannable and sits next to the factor charts, not in one far-away wall.
    const cards = items.map(([html]) => {
      const cut = html.indexOf('</b>');
      const lead = cut >= 0 ? html.slice(0, cut).replace(/^<b>/, '') : html;
      const body = cut >= 0 ? html.slice(cut + 4).trim() : '';
      return `<div class="tk"><span class="tkhead">${lead}</span>${body ? `<span class="tkbody">${body}</span>` : ''}</div>`;
    }).join('');
    return `<h3 style="font-size:13.5px;margin:14px 0 6px">${
      zhT ? '主效应结论（take away）' : 'Main-effect takeaways'
    }</h3><div class="tkgrid">${cards}</div>`;
  }

  /**
   * flag ↔ coordinate-axis map. Each flag factor is a move between two cells;
   * the 6-slot `coord` string of those cells tells us exactly which axes the
   * flag moved. Derived by diffing coords (never fabricated), so it stays
   * honest about collinearity: a flag that lights up 3 columns moves all 3 at
   * once and its measured delta cannot be split among them.
   */
  function flagAxisMap() {
    const zhT = t.lang.startsWith('zh');
    const byFlag = new Map();
    for (const c of graphEngFactors.perCell ?? []) {
      const coord = c.coordinate ?? c.coord;
      if (coord && !byFlag.has(c.flag)) byFlag.set(c.flag, coord);
    }
    // 6 coordinate slots, in the order the `coord` string uses them.
    const AXES = zhT
      ? ['staging 阶段', 'naming 命名', 'access 访问', 'thread 线程', 'lifetime 生命期', 'origin 来源']
      : ['staging', 'naming', 'access', 'thread', 'lifetime', 'origin'];
    // Strip only the "(N/A on web)" annotation BEFORE splitting — its "N/A"
    // slash would otherwise fake extra slots. Keep meaningful parentheticals
    // like "(native-paint)", which IS the axis change +ifr:e makes.
    const slots = (coord) => coord.replace(/\s*\(N\/A[^)]*\)/gi, '').split('/').map((s) => s.trim());
    // factor → (from flag, to flag); N/A pairs touch an engine/native cell.
    const rows = [
      { flag: 'render', from: 'vdom', to: 'vapor', na: false },
      { flag: '+b (vdom)', from: 'vdom', to: 'vdom +b', na: false },
      { flag: '+b (vapor)', from: 'vapor', to: 'vapor +b', na: false },
      { flag: '+ifr', from: 'vapor +b', to: 'vapor +b +ifr', na: false },
      { flag: '+b:e', from: 'vapor +b', to: 'vapor +b:e', na: true },
      { flag: '+ifr:e', from: 'vapor +b +ifr', to: 'vapor +b +ifr:e', na: true },
    ].filter((r) => byFlag.has(r.from) && byFlag.has(r.to));

    let html = `<h3 style="font-size:13.5px;margin:18px 0 6px">${
      zhT ? 'flag ↔ 坐标轴映射（哪些轴被这个 flag 一起挪动）' : 'flag ↔ coordinate-axis map (which axes each flag co-moves)'
    }</h3>`;
    html += `<div class="scroll"><table><thead><tr><th>flag</th>${
      AXES.map((a) => `<th style="font-size:10.5px">${escapeHtml(a)}</th>`).join('')
    }<th>${zhT ? '同时挪动' : 'axes moved'}</th></tr></thead><tbody>`;
    for (const r of rows) {
      const a = slots(byFlag.get(r.from));
      const b = slots(byFlag.get(r.to));
      let moved = 0;
      const cells = AXES.map((_, i) => {
        if (a[i] === b[i]) return '<td class="c plain" style="color:var(--ink-2)">·</td>';
        moved += 1;
        return `<td class="c plain" style="font-size:10px"><b>${escapeHtml(a[i] ?? '')}→${escapeHtml(b[i] ?? '')}</b></td>`;
      }).join('');
      html += `<tr><td class="op">${escapeHtml(r.flag)}${r.na ? ` <span class="sub" style="font-size:9.5px">${zhT ? '（web 上 N/A）' : '(N/A on web)'}</span>` : ''}</td>${cells}<td class="c plain"><b>${moved}</b></td></tr>`;
    }
    html += '</tbody></table></div>';
    html += `<p class="sub" style="margin-top:8px">${
      zhT
        ? '每一行是一次 cell→cell 的移动，亮起的列 = 该 flag 同时挪动的坐标轴，直接从 6 槽 <code>coord</code> 串 diff 得出（不是编造）。因为这些轴<b>共线</b>——例如 <code>+ifr</code> 永远同时挪 thread 与 lifetime、<code>render</code> 一次挪 3 根——所以上面因子表里的 Δ% 只能归因到 <b>flag 粒度</b>，无法再拆成单轴数字。native/engine 轴在本机记为 N/A（只作 fail-safe 成本尺）。'
        : 'Each row is one cell→cell move; the lit columns are the axes that flag co-moves, diffed straight from the 6-slot <code>coord</code> string (not invented). Because these axes are <b>collinear</b> — <code>+ifr</code> always moves thread and lifetime together, <code>render</code> moves 3 at once — the Δ% in the factor tables attributes only to <b>flag granularity</b> and cannot be split into per-axis numbers. The native/engine axes are N/A on this host (a fail-safe-cost yardstick only).'
    }</p>`;
    return html;
  }
}

function siblingHref(outBase, lang, published) {
  // When writing to website/benchmark/unified.html, use published names.
  const base = path.basename(outBase);
  if (published || base.startsWith('unified')) {
    return lang === 'zh' ? 'unified.html' : 'unified.zh.html';
  }
  return lang === 'zh' ? 'report.html' : 'report.zh.html';
}

function renderReport(lang, outPath) {
  REPORT_LANG = lang;
  const t = copy(lang);
  const meta = unified.meta;
  const published = /[/\\]benchmark[/\\]unified/.test(outPath) || path.basename(outPath).startsWith('unified');
  const alt = {
    href: siblingHref(outPath, lang, published),
    label: lang === 'zh' ? 'English' : '中文',
  };
  const { html: conclusionsHtml, count } = renderConclusions(lang, t, published);
  const cols = columnsFor(t);
  const rows = stormRowsFor(t);
  const ch = t.charts;

  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(t.title)}</title>
<style>
  :root {
    --surface: #fcfcfb; --ink: #0b0b0b; --ink-2: #52514e; --line: #e4e3df;
    /* Colorblind-safe slowdown ramp: blue (fast) -> orange (slow). */
    --good: #2a78d6; --warn: #8ea3c2; --serious: #e8a04c; --critical: #c25f05;
    --tint: 18%;
    --s1: #2a78d6; --s2: #d97706; --s3: #1baf7a; --s4: #2563eb; --s5: #7c3aed; --s6: #eda100;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --surface: #1a1a19; --ink: #ffffff; --ink-2: #c3c2b7; --line: #3a3a37; --tint: 30%;
      --good: #4d94e8; --warn: #93a7c4; --serious: #f0ad62; --critical: #e07818;
      --s1: #3987e5; --s2: #f0a020; --s3: #199e70; --s4: #5b8def; --s5: #9085e9; --s6: #c98500;
    }
  }
  :root[data-theme="dark"] {
    --surface: #1a1a19; --ink: #ffffff; --ink-2: #c3c2b7; --line: #3a3a37; --tint: 30%;
    --good: #4d94e8; --warn: #93a7c4; --serious: #f0ad62; --critical: #e07818;
    --s1: #3987e5; --s2: #f0a020; --s3: #199e70; --s4: #5b8def; --s5: #9085e9; --s6: #c98500;
  }
  :root[data-theme="light"] {
    --surface: #fcfcfb; --ink: #0b0b0b; --ink-2: #52514e; --line: #e4e3df; --tint: 18%;
    --good: #2a78d6; --warn: #8ea3c2; --serious: #e8a04c; --critical: #c25f05;
    --s1: #2a78d6; --s2: #d97706; --s3: #1baf7a; --s4: #2563eb; --s5: #7c3aed; --s6: #eda100;
  }
  ${THEME_BRIDGE_CSS}
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 20px 16px 48px; background: var(--surface); color: var(--ink);
    font: 14px/1.5 "IBM Plex Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei",
      -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 28px 0 8px; }
  .sub { color: var(--ink-2); font-size: 12.5px; margin: 0 0 14px; max-width: 920px; }
  .lang-switch { margin: 0 0 14px; }
  .lang-switch a {
    font-size: 12.5px; color: var(--ink-2); text-decoration: none;
    border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px;
  }
  .lang-switch a:hover { color: var(--ink); }
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
  figure.chart { margin: 0; }
  .chart.wide { flex: 1 1 100%; max-width: 100%; }
  .chart h3 { font-size: 13.5px; margin: 8px 0 2px; }
  .chart svg { width: 100%; height: auto; }
  .grid { stroke: var(--line); stroke-width: 1; }
  .tick, .axis { fill: var(--ink-2); font-size: 10.5px; }
  .axis { font-size: 11px; }
  .line { fill: none; stroke-width: 2.4; transition: opacity .12s, stroke-width .12s; }
  .dot { stroke: var(--surface); stroke-width: 2; transition: opacity .12s; }
  .slabel { font-size: 11px; font-weight: 600; transition: opacity .12s; cursor: pointer; }
  /* hover highlight: dim the rest, thicken the hovered series */
  .ccanvas.hovering .line, .ccanvas.hovering .dot, .ccanvas.hovering .slabel { opacity: .18; }
  .ccanvas .line.hl { opacity: 1; stroke-width: 3.6; }
  .ccanvas .dot.hl, .ccanvas .slabel.hl { opacity: 1; }
  .ccanvas .slabel.hl { font-size: 12.5px; }
  .ccanvas .overlay { fill: transparent; cursor: crosshair; touch-action: none; }
  .ccanvas .brush { fill: var(--s4, #2563eb); fill-opacity: .12; stroke: var(--s4, #2563eb); stroke-opacity: .55; stroke-width: 1; }
  .cctl { display: flex; align-items: center; gap: 10px; margin: 2px 0 8px; font-size: 12px; color: var(--ink-2); flex-wrap: wrap; }
  .cctl .creset { font: inherit; font-size: 11px; padding: 2px 9px; border: 1px solid var(--line); background: transparent; color: var(--ink-2); border-radius: 5px; cursor: pointer; }
  .cctl .creset:hover { color: var(--ink); border-color: var(--ink-2); }
  .cctl .chint { color: var(--ink-3, var(--ink-2)); font-size: 11px; opacity: .8; }
  .tkgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 10px; margin: 6px 0 10px; }
  .tk { border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; }
  .tk .tkhead { display: block; font-size: 12.5px; font-weight: 700; line-height: 1.35; }
  .tk .tkbody { display: block; margin-top: 3px; font-size: 11.5px; color: var(--ink-2); line-height: 1.45; }
  .verdicts {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  .verdict header { margin-bottom: 8px; }
  .takeaway { font-size: 14px; font-weight: 700; line-height: 1.35; }
  .why, .evidence { font-size: 12.5px; margin: 0 0 6px; color: var(--ink-2); line-height: 1.45; }
  .evidence { margin-bottom: 0; }
  .lbl {
    display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
    text-transform: uppercase; margin-right: 4px; color: var(--ink-2); opacity: 0.85;
  }
  .why .lbl { color: var(--good); }
  .evidence .lbl { color: var(--warn); }
  .notes { margin-top: 24px; font-size: 12.5px; color: var(--ink-2); max-width: 920px; }
  .notes li { margin: 4px 0; }
  a { color: inherit; }
  .pillrow { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 10px; }
  .pill {
    font-size: 12px; border: 1px solid var(--line); border-radius: 999px;
    padding: 4px 10px; color: var(--ink-2);
  }
</style>
</head>
<body>
<h1>${escapeHtml(t.title)}</h1>
<p class="sub">
  ${t.lede}
  ${escapeHtml(t.generated(meta))}.
</p>
<div class="pillrow">
  <span class="pill">${escapeHtml(t.pills.env)}</span>
  <span class="pill">${escapeHtml(t.pills.ladder)}</span>
  <span class="pill">${escapeHtml(t.pills.cells(unified.cells.length))}</span>
  <span class="pill">${escapeHtml(t.pills.conclusions(count))}</span>
  <span class="pill">${
    t.lang.startsWith('zh')
      ? 'Engine cells：本环境 N/A（Lynx for Web 无引擎 ET PAPI），已从全部表格与图表省略'
      : 'Engine cells: N/A on this host (no engine ET PAPI on Lynx for Web) — omitted from all tables and charts'
  }</span>
</div>
<p class="lang-switch"><a href="${alt.href}">${escapeHtml(alt.label)}</a></p>

<h2>${escapeHtml(t.hConclusions)}</h2>
<p class="sub">${escapeHtml(t.subConclusions)}</p>
${conclusionsHtml}

<h2>${escapeHtml(t.hStorms)}</h2>
<p class="sub">${t.subStorms}</p>
<div class="scroll">${renderTable(rows, cols, t)}</div>
<div class="legend">
  <span><i style="background:color-mix(in srgb, var(--good) var(--tint), var(--surface))"></i>≤ 1.15×</span>
  <span><i style="background:color-mix(in srgb, var(--warn) var(--tint), var(--surface))"></i>≤ 2.5×</span>
  <span><i style="background:color-mix(in srgb, var(--serious) var(--tint), var(--surface))"></i>≤ 10×</span>
  <span><i style="background:color-mix(in srgb, var(--critical) var(--tint), var(--surface))"></i>&gt; 10×</span>
</div>

<h2>${escapeHtml(t.hStormScale)}</h2>
<p class="sub">${escapeHtml(t.subStormScale)}</p>
<div class="charts">
  ${renderLineChart({
    title: ch.selectStorm.title,
    sub: ch.selectStorm.sub,
    series: stormSeries('selectStorm', t),
    xLabel: ch.selectStorm.x,
    yLabel: ch.selectStorm.y,
  })}
  ${renderLineChart({
    title: ch.updateStorm.title,
    sub: ch.updateStorm.sub,
    series: stormSeries('updateStorm', t),
    xLabel: ch.updateStorm.x,
    yLabel: ch.updateStorm.y,
  })}
  ${renderLineChart({
    title: ch.create.title,
    sub: ch.create.sub,
    series: stormSeries('create', t),
    xLabel: ch.create.x,
    yLabel: ch.create.y,
  })}
</div>

<div class="charts" style="margin-top:8px">
  ${renderLineChart({
    title: lang === 'zh' ? 'Select storm — 对数轴（全部）' : 'Select storm — log scale (all)',
    sub: lang === 'zh'
      ? '线性轴上 Vapor 家族全被压在底部；对数轴让三个数量级都能读。'
      : 'On a linear axis the Vapor family is pinned to the floor; a log axis separates all three orders of magnitude.',
    series: stormSeries('selectStorm', t),
    xLabel: ch.selectStorm.x,
    yLabel: ch.selectStorm.y,
    logY: true,
  })}
  ${renderLineChart({
    title: lang === 'zh' ? 'Select storm — 仅 Vapor（放大）' : 'Select storm — Vapor family (zoom)',
    sub: lang === 'zh'
      ? '只画 Vapor 各变体、独立纵轴，看清 基线 / +b / +ifr / +b +ifr 之间的差异（V4 记法）。'
      : 'Vapor variants only, own y-scale — resolves baseline / +b / +ifr / +b +ifr from each other (V4 notation).',
    series: stormSeries('selectStorm', t, 1, (k) => k.startsWith('vapor')),
    xLabel: ch.selectStorm.x,
    yLabel: ch.selectStorm.y,
  })}
</div>

<h2>${escapeHtml(t.hFcp)}</h2>
<p class="sub">${t.subFcp}</p>
<div class="scroll">${renderFcpTable(1, t)}</div>
<p class="sub" style="margin-top:16px">${escapeHtml(t.subFcp4)}</p>
<div class="scroll">${renderFcpTable(4, t)}</div>
<div class="charts" style="margin-top:16px">
  ${renderLineChart({
    title: ch.fcp1.title,
    sub: ch.fcp1.sub,
    series: fcpSeries(1, t),
    xLabel: ch.fcp1.x,
    yLabel: ch.fcp1.y,
    wide: true,
    w: 900,
    h: 480,
  })}
  ${renderLineChart({
    title: ch.fcp4.title,
    sub: ch.fcp4.sub,
    series: fcpSeries(4, t),
    xLabel: ch.fcp4.x,
    yLabel: ch.fcp4.y,
    wide: true,
    w: 900,
    h: 480,
  })}
</div>

<h2>${escapeHtml(t.hGraphEng)}</h2>
<p class="sub">${t.subGraphEng}</p>
<div class="scroll">${graphEngNamingTable(t)}</div>
${graphEngFactorsSection(t)}

<h2>${escapeHtml(t.hCoverage)}</h2>
<p class="sub">${escapeHtml(t.subCoverage)}</p>
<div class="scroll">${coverageTable(t)}</div>

<div class="notes">
  <ul>
    ${t.notes.map((n) => `<li>${n}</li>`).join('\n    ')}
  </ul>
</div>
<script>${THEME_BRIDGE_SCRIPT}</script>
<script>${LINE_CHART_JS}</script>
</body>
</html>
`;
}

function outPathForLang(baseOut, lang) {
  if (lang === 'en') return baseOut;
  // report.html → report.zh.html ; unified.html → unified.zh.html
  return baseOut.replace(/\.html$/i, '.zh.html');
}

const baseOut = path.isAbsolute(args.out) ? args.out : path.join(root, args.out);
const langs =
  args.lang === 'all' ? ['en', 'zh'] : args.lang === 'zh' ? ['zh'] : ['en'];

for (const lang of langs) {
  const outPath =
    langs.length === 1 && args.lang !== 'all'
      ? baseOut
      : outPathForLang(baseOut, lang);
  const html = renderReport(lang, outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`[report-unified] wrote ${outPath}`);
}
