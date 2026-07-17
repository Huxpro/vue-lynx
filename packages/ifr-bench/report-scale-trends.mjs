/**
 * Playground-style scale-trend charts for IFR architectures.
 *
 * Reads:
 *   <bundlesDir>/scale-manifest.json
 *   results/browser-results-<label>.json   (from web-harness/run-browser.mjs)
 *
 * Writes:
 *   results/scale-trends-<label>.html
 *   results/scale-trends-<label>.json
 *
 *   node report-scale-trends.mjs <bundlesDir> <browserResultsJson> [outLabel]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlesDir = path.resolve(process.argv[2] ?? './web-bundles-scale');
const resultsPath = path.resolve(
  process.argv[3] ?? './results/browser-results-scale-x1.json',
);
const LABEL = process.argv[4]
  ?? path.basename(resultsPath, '.json').replace(/^browser-results-/, '');

const SIZES = ['1k', '3k', '5k', '10k', '20k', '30k'];
const SIZE_N = {
  '1k': 1004,
  '3k': 3004,
  '5k': 5004,
  '10k': 10004,
  '20k': 20004,
  '30k': 30004,
};
const VARIANT_ORDER = [
  'vdom',
  'vdom-ifr',
  'vdom-ifr-et',
  'vapor',
  'vapor-ifr',
];
const VARIANT_LABEL = {
  vdom: 'VDOM',
  'vdom-ifr': 'VDOM+IFR',
  'vdom-ifr-et': 'VDOM+IFR+ET',
  vapor: 'Vapor',
  'vapor-ifr': 'Vapor+IFR',
};
const COLORS = {
  vdom: '#6b7280',
  'vdom-ifr': '#2563eb',
  'vdom-ifr-et': '#7c3aed',
  vapor: '#059669',
  'vapor-ifr': '#d97706',
};

const manifest = JSON.parse(
  fs.readFileSync(path.join(bundlesDir, 'scale-manifest.json'), 'utf8'),
);
const rawResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

function parseName(bundle) {
  const base = String(bundle).replace(/\.web\.bundle$/, '');
  const at = base.lastIndexOf('@');
  if (at === -1) return null;
  return { variant: base.slice(0, at), scale: base.slice(at + 1) };
}

const perOp = Object.fromEntries(VARIANT_ORDER.map((v) => [v, {}]));
const sizes = Object.fromEntries(VARIANT_ORDER.map((v) => [v, {}]));

for (const cell of manifest.cells) {
  SIZE_N[cell.scale] = cell.elements;
  sizes[cell.variant][`webGzip@${cell.scale}`] = cell.webBundle.gzip;
  sizes[cell.variant][`mtGzip@${cell.scale}`] = cell.mtSection.gzip;
  sizes[cell.variant][`elements@${cell.scale}`] = cell.elements;
}

for (const row of rawResults) {
  const parsed = parseName(row.bundle);
  if (!parsed || !perOp[parsed.variant]) continue;
  perOp[parsed.variant][`fcp@${parsed.scale}`] = {
    median: row.fcpMedianMs,
    n: row.fcps?.length ?? 1,
  };
  perOp[parsed.variant][`settled@${parsed.scale}`] = {
    median: row.settledMedianMs,
    n: row.settleds?.length ?? 1,
  };
}

function slopeFit(pairs) {
  const pts = pairs
    .filter(([n, v]) => n > 0 && v > 0)
    .map(([n, v]) => [Math.log10(n), Math.log10(v)]);
  if (pts.length < 3) return null;
  const m = pts.length;
  const sx = pts.reduce((a, p) => a + p[0], 0);
  const sy = pts.reduce((a, p) => a + p[1], 0);
  const sxx = pts.reduce((a, p) => a + p[0] * p[0], 0);
  const sxy = pts.reduce((a, p) => a + p[0] * p[1], 0);
  return (m * sxy - sx * sy) / (m * sxx - sx * sx);
}

function seriesFcp(variant) {
  const pts = [];
  for (const scale of SIZES) {
    const fcp = perOp[variant]?.[`fcp@${scale}`]?.median;
    const n = sizes[variant]?.[`elements@${scale}`] ?? SIZE_N[scale];
    if (fcp == null || !(fcp > 0)) continue;
    pts.push({
      scale,
      n,
      fcp,
      webGzip: sizes[variant]?.[`webGzip@${scale}`],
      mtGzip: sizes[variant]?.[`mtGzip@${scale}`],
      dnf: false,
    });
  }
  return pts;
}

function dnfScales(variant) {
  return SIZES.filter((scale) => {
    const fcp = perOp[variant]?.[`fcp@${scale}`]?.median;
    const nodes = perOp[variant]?.[`settled@${scale}`]
      ? sizes[variant]?.[`elements@${scale}`]
      : null;
    // DNF: measured but no positive FCP (crash / empty tree / hard timeout).
    return fcp != null && !(fcp > 0);
  });
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

function renderChart({ title, sub, xLabel, yLabel, getX, getY, xUnit, scale = 'log' }) {
  const useLog = scale === 'log';
  const allPts = VARIANT_ORDER.flatMap((v) =>
    seriesFcp(v)
      .map((p) => ({ ...p, variant: v, x: getX(p), y: getY(p) }))
      .filter((p) => p.x > 0 && p.y > 0)
  );
  if (allPts.length === 0) return '<p class="sub">No data.</p>';

  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  let xmin;
  let xmax;
  let ymin;
  let ymax;
  if (useLog) {
    const pad = 1.35;
    xmin = Math.min(...xs) / pad;
    xmax = Math.max(...xs) * pad;
    ymin = Math.min(...ys) / pad;
    ymax = Math.max(...ys) * pad;
  } else {
    // Zero baseline makes absolute gaps visually striking.
    xmin = 0;
    xmax = Math.max(...xs) * 1.08;
    ymin = 0;
    ymax = Math.max(...ys) * 1.08;
  }
  const W = 560;
  const H = 400;
  const ML = 56;
  const MR = 140;
  const MT = 16;
  const MB = 44;
  const px = (v) => {
    if (useLog) {
      return ML
        + ((Math.log10(v) - Math.log10(xmin))
          / (Math.log10(xmax) - Math.log10(xmin)))
          * (W - ML - MR);
    }
    return ML + ((v - xmin) / (xmax - xmin)) * (W - ML - MR);
  };
  const py = (v) => {
    if (useLog) {
      return H
        - MB
        - ((Math.log10(v) - Math.log10(ymin))
          / (Math.log10(ymax) - Math.log10(ymin)))
          * (H - MT - MB);
    }
    return H - MB - ((v - ymin) / (ymax - ymin)) * (H - MT - MB);
  };

  const tickCandidates = [
    0.3, 1, 3, 10, 30, 100, 300, 1000, 3000, 10000, 30000, 100000, 300000,
  ];
  const tickVals = (lo, hi) => {
    if (useLog) return tickCandidates.filter((t) => t >= lo && t <= hi);
    const ticks = niceLinearTicks(lo, hi);
    if (lo === 0 && (ticks.length === 0 || ticks[0] !== 0)) ticks.unshift(0);
    return ticks;
  };
  const fmtTick = (t) => {
    if (xUnit === 'els' || xUnit === 'B') {
      if (t === 0) return '0';
      if (t >= 1000) {
        const k = t / 1000;
        return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
      }
      return String(Math.round(t));
    }
    if (t === 0) return '0';
    if (t >= 1000) return `${t / 1000}s`;
    return Number.isInteger(t) ? `${t}` : t.toFixed(t < 10 ? 1 : 0);
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
  for (const variant of VARIANT_ORDER) {
    const pts = seriesFcp(variant)
      .map((p) => ({ ...p, x: getX(p), y: getY(p) }))
      .filter((p) => p.x > 0 && p.y > 0);
    if (pts.length === 0) continue;
    const color = COLORS[variant];
    const pathD = pts
      .map((p, k) => `${k ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
      .join('');
    marks += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.8"/>`;
    for (const p of pts) {
      marks += `<circle cx="${px(p.x).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="5" fill="${color}">`
        + `<title>${VARIANT_LABEL[variant]} · ${p.scale}\nN=${p.n}  FCP=${p.fcp.toFixed(1)}ms`
        + (p.mtGzip != null ? `  MT gz=${(p.mtGzip / 1024).toFixed(1)}KB` : '')
        + `</title></circle>`;
    }
    if (variant === 'vdom') {
      for (const p of pts) {
        marks += `<text x="${px(p.x).toFixed(1)}" y="${(py(p.y) + 16).toFixed(1)}" class="ptlabel" text-anchor="middle">${p.scale}</text>`;
      }
    }
    const dnfs = dnfScales(variant);
    if (dnfs.length && pts.length) {
      const last = pts[pts.length - 1];
      marks += `<text x="${(px(last.x) + 9).toFixed(1)}" y="${(py(last.y) - 10).toFixed(1)}" class="ptlabel" fill="${color}">DNF @${dnfs.join(',')}</text>`;
    }
    const last = pts[pts.length - 1];
    let ly = py(last.y) + 4;
    while (labelYs.some((v) => Math.abs(v - ly) < 13)) ly += 13;
    labelYs.push(ly);
    marks += `<text x="${(px(last.x) + 9).toFixed(1)}" y="${ly.toFixed(1)}" class="slabel" fill="${color}">${VARIANT_LABEL[variant]}</text>`;
  }

  return `<div class="chart"><h3>${title}</h3><p class="sub">${sub}</p>
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">
${g}
<text x="${(ML + (W - ML - MR) / 2).toFixed(0)}" y="${H - 6}" class="axis" text-anchor="middle">${xLabel}</text>
<text x="14" y="${(MT + (H - MT - MB) / 2).toFixed(0)}" class="axis" text-anchor="middle" transform="rotate(-90 14 ${(MT + (H - MT - MB) / 2).toFixed(0)})">${yLabel}</text>
${marks}
</svg></div>`;
}

function slopeTableHtml() {
  let html = '<table><thead><tr><th>metric ~ N<sup>α</sup></th>';
  for (const v of VARIANT_ORDER) html += `<th>${VARIANT_LABEL[v]}</th>`;
  html += '</tr></thead><tbody>';
  const metrics = [
    ['FCP', (v) =>
      SIZES.map((sz) => [
        sizes[v]?.[`elements@${sz}`] ?? SIZE_N[sz],
        perOp[v]?.[`fcp@${sz}`]?.median,
      ])],
    ['MT gzip', (v) =>
      SIZES.map((sz) => [
        sizes[v]?.[`elements@${sz}`] ?? SIZE_N[sz],
        sizes[v]?.[`mtGzip@${sz}`],
      ])],
    ['web gzip', (v) =>
      SIZES.map((sz) => [
        sizes[v]?.[`elements@${sz}`] ?? SIZE_N[sz],
        sizes[v]?.[`webGzip@${sz}`],
      ])],
  ];
  for (const [label, pairsOf] of metrics) {
    html += `<tr><td class="op">${label}</td>`;
    for (const v of VARIANT_ORDER) {
      const a = slopeFit(pairsOf(v));
      html += `<td class="c">${a == null ? '—' : 'α=' + a.toFixed(2)}</td>`;
    }
    html += '</tr>';
  }
  return html + '</tbody></table>';
}

function dataTableHtml() {
  let html =
    '<table><thead><tr><th>architecture · scale</th><th>elements</th><th>FCP ms</th><th>Δ vs VDOM</th><th>MT gzip</th><th>web gzip</th></tr></thead><tbody>';
  for (const scale of SIZES) {
    const vdomFcp = perOp.vdom?.[`fcp@${scale}`]?.median;
    for (const v of VARIANT_ORDER) {
      const fcp = perOp[v]?.[`fcp@${scale}`]?.median;
      if (fcp == null) continue;
      const n = sizes[v]?.[`elements@${scale}`] ?? SIZE_N[scale];
      const mt = sizes[v]?.[`mtGzip@${scale}`];
      const web = sizes[v]?.[`webGzip@${scale}`];
      const isDnf = !(fcp > 0);
      const delta = (!isDnf && vdomFcp != null && vdomFcp > 0)
        ? `${(((fcp - vdomFcp) / vdomFcp) * 100) >= 0 ? '+' : ''}${
          (((fcp - vdomFcp) / vdomFcp) * 100).toFixed(0)
        }%`
        : '—';
      html += `<tr><td class="op">${VARIANT_LABEL[v]} · ${scale}</td>`
        + `<td class="c">${n}</td>`
        + `<td class="c">${isDnf ? 'DNF' : fcp.toFixed(1)}</td>`
        + `<td class="c">${v === 'vdom' ? '—' : delta}</td>`
        + `<td class="c">${mt == null ? '—' : (mt / 1024).toFixed(1) + ' KB'}</td>`
        + `<td class="c">${web == null ? '—' : (web / 1024).toFixed(1) + ' KB'}</td></tr>`;
    }
  }
  return html + '</tbody></table>';
}

const throttleGuess = /x(\d+)/.exec(LABEL)?.[1] ?? '1';

function chartsForScale(scale) {
  const isLog = scale === 'log';
  const scaleTag = isLog ? 'log' : 'linear';
  // Playground analogue: x/y are both costs that fan out as N grows.
  // MT gzip is the "create/load tax"; FCP is the paint tax.
  const fcpVsMt = renderChart({
    title: `Paint vs MT load cost (${scaleTag})`,
    sub: isLog
      ? 'Log-log cost space (playground-style). Each polyline is one architecture '
        + 'through 1k→30k. Right = heavier main-thread bundle; up = slower FCP. '
        + `CPU ×${throttleGuess}. Lower-left dominates.`
      : 'Linear cost space (playground-style, zero baseline). Same points as the '
        + 'framework bench\'s create×update chart: architectures that pay MT gzip '
        + 'without buying FCP shoot right; those that scale poorly shoot up. '
        + `CPU ×${throttleGuess}.`,
    xLabel: `MT section gzip — bytes, ${scaleTag}`,
    yLabel: `FCP — ms, ${scaleTag}`,
    getX: (p) => p.mtGzip,
    getY: (p) => p.fcp,
    xUnit: 'B',
    scale,
  });
  const fcpVsN = renderChart({
    title: `FCP vs content scale (${scaleTag})`,
    sub: isLog
      ? 'Log-log. Same generated SFC at ~1k→30k elements. '
        + `Lynx for Web, CPU ×${throttleGuess}. `
        + 'α ≈ 1 → linear in N; α ≪ 1 → dominated by fixed costs.'
      : 'Linear, zero baseline, 1k→30k — absolute FCP gaps. '
        + 'VDOM+IFR without ET crosses above plain VDOM and can DNF on deep MT '
        + `mount. CPU ×${throttleGuess}.`,
    xLabel: `elements N — ${scaleTag}`,
    yLabel: `FCP — ms, ${scaleTag}`,
    getX: (p) => p.n,
    getY: (p) => p.fcp,
    xUnit: 'els',
    scale,
  });
  return { fcpVsN, fcpVsMt };
}

const linearCharts = chartsForScale('linear');
const logCharts = chartsForScale('log');

const normalized = {
  label: LABEL,
  sizes: SIZE_N,
  perOp,
  bundleGzip: sizes,
  measuredAt: new Date().toISOString(),
};

// Theme + i18n chrome are applied by patch-scale-trends-embed.mjs after write
// (keeps this generator focused on charts). Call the patcher after regenerating.
const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8"/>
<title>IFR architecture scale trends — ${LABEL}</title>
<style>
  :root { color-scheme: light; font-family: ui-sans-serif, system-ui, sans-serif; }
  body { max-width: 980px; margin: 32px auto; padding: 0 20px 64px; color: #111; }
  h1 { font-size: 1.45rem; margin: 0 0 8px; }
  h2 { font-size: 1.15rem; margin: 36px 0 10px; }
  h3 { font-size: 1rem; margin: 0 0 4px; }
  .lede { color: #444; line-height: 1.5; margin-bottom: 24px; }
  .chart { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 12px 8px; margin: 16px 0 28px; background: #fafafa; }
  .sub { color: #666; font-size: 0.85rem; line-height: 1.45; margin: 0 0 10px; }
  .grid { stroke: #e5e7eb; stroke-width: 1; }
  .tick { font-size: 10px; fill: #6b7280; }
  .axis { font-size: 11px; fill: #374151; }
  .ptlabel { font-size: 10px; fill: #9ca3af; }
  .slabel { font-size: 12px; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; font-size: 0.9rem; margin: 12px 0 28px; }
  th, td { border-bottom: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; }
  th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
  td.c { font-variant-numeric: tabular-nums; text-align: right; }
  td.op { font-weight: 500; }
  code { font-size: 0.85em; background: #f3f4f6; padding: 1px 5px; border-radius: 4px; }
</style>
<body>
<h1>IFR architecture scale trends</h1>
<p class="lede">
  Five product architectures on one generated content SFC, scaled from ~1k to
  <strong>~30k</strong> elements (playground ladder). Lead chart is the
  playground-style <em>cost space</em> (MT gzip × FCP); FCP vs N follows.
  Linear (zero baseline) first, then log-log for α shape.
  Source: <code>${path.basename(resultsPath)}</code> · ${normalized.measuredAt}
</p>

<h2>Linear scale — cost space + FCP vs N</h2>
${linearCharts.fcpVsMt}
${linearCharts.fcpVsN}

<h2>Log-log scale</h2>
${logCharts.fcpVsMt}
${logCharts.fcpVsN}

<h2>Scaling exponents</h2>
<p class="lede" style="margin-top:0">
  α ≈ 0 → FCP dominated by fixed overhead (bundle parse / boot / IPC).
  α ≈ 1 → cost grows with content. An architecture that raises MT gzip without
  lowering α (or FCP) is paying for early-paint capacity that does not show up
  at that scale on Lynx for Web.
</p>
${slopeTableHtml()}

<h2>Raw medians</h2>
${dataTableHtml()}

</body>
</html>
`;

const resultsDir = path.join(_dirname, 'results');
fs.mkdirSync(resultsDir, { recursive: true });
fs.writeFileSync(
  path.join(resultsDir, `scale-trends-${LABEL}.json`),
  `${JSON.stringify(normalized, null, 2)}\n`,
);
const htmlPath = path.join(resultsDir, `scale-trends-${LABEL}.html`);
fs.writeFileSync(htmlPath, html);
console.log(`Wrote ${htmlPath}`);
console.log(`Wrote results/scale-trends-${LABEL}.json`);
try {
  const { execSync } = await import('node:child_process');
  execSync('node patch-scale-trends-embed.mjs', {
    cwd: _dirname,
    stdio: 'inherit',
  });
} catch (err) {
  console.warn('[report-scale-trends] embed patch skipped:', err.message);
}
