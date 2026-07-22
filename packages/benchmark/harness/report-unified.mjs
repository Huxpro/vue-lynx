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
const isEngineNa = (key) => ENGINE_NA_ARCHS.has(key);

const COLUMN_KEYS = [
  'vapor',
  'vapor-dense',
  'vapor-engine',
  'vapor-ifr',
  'vapor-ifr-dense',
  'vapor-ifr-sparse',
  'vapor-ifr-engine-et',
  'vdom',
  'vdom-et',
  'vdom-ifr',
  'vdom-ifr-et',
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
  { key: 'react', color: '#eda100' },
  { key: 'vdom', color: '#6b7280' },
  { key: 'vdom-et', color: '#374151' },
  { key: 'vdom-ifr', color: '#2563eb' },
  { key: 'vdom-ifr-et', color: '#7c3aed' },
  { key: 'vapor', color: '#059669' },
  { key: 'vapor-dense', color: '#66c2a4' },
  { key: 'vapor-engine', color: '#0d8a5f' },
  { key: 'vapor-ifr', color: '#d97706' },
  { key: 'vapor-ifr-engine-et', color: '#92400e' },
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

function renderLineChart({
  title,
  sub,
  series,
  xLabel,
  yLabel,
  yFmt = (tick) => (tick >= 1000 ? `${tick / 1000}s` : `${tick}ms`),
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
  for (const tick of niceLinearTicks(xmin, xmax)) {
    g += `<line x1="${px(tick)}" y1="${MT}" x2="${px(tick)}" y2="${H - MB}" class="grid"/>`
      + `<text x="${px(tick)}" y="${H - MB + 16}" class="tick" text-anchor="middle">${
        tick >= 1000 ? `${tick / 1000}k` : tick
      }</text>`;
  }
  for (const tick of niceLinearTicks(ymin, ymax)) {
    g += `<line x1="${ML}" y1="${py(tick)}" x2="${W - MR}" y2="${py(tick)}" class="grid"/>`
      + `<text x="${ML - 6}" y="${py(tick) + 3.5}" class="tick" text-anchor="end">${yFmt(tick)}</text>`;
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
        + `<title>${escapeHtml(s.label)} · ${p.label}\n${escapeHtml(yLabel)}: ${fmtMs(p.y)}</title></circle>`;
    }
    const last = s.pts[s.pts.length - 1];
    let ly = py(last.y) + 4;
    while (labelYs.some((v) => Math.abs(v - ly) < 13)) ly += 13;
    labelYs.push(ly);
    marks += `<text x="${(px(last.x) + 9).toFixed(1)}" y="${ly.toFixed(1)}" class="slabel" fill="${s.color}">${escapeHtml(s.label)}</text>`;
  }

  return `<div class="chart"><h3>${escapeHtml(title)}</h3><p class="sub">${sub}</p>
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(title)}">
${g}
<text x="${(ML + (W - ML - MR) / 2).toFixed(0)}" y="${H - 6}" class="axis" text-anchor="middle">${escapeHtml(xLabel)}</text>
<text x="14" y="${(MT + (H - MT - MB) / 2).toFixed(0)}" class="axis" text-anchor="middle" transform="rotate(-90 14 ${(MT + (H - MT - MB) / 2).toFixed(0)})">${escapeHtml(yLabel)}</text>
${marks}
</svg></div>`;
}

function stormSeries(op, t, ticks = 1) {
  const cols = columnsFor(t);
  const colors = [
    '#1baf7a', '#0d8a5f', '#66c2a4', // vapor family (greens)
    '#d97706', '#b45309', '#f59e0b', '#92400e', // vapor-ifr family (ambers)
    '#6b7280', '#374151', // vdom, vdom-et (grays)
    '#2563eb', '#7c3aed', // vdom-ifr, vdom-ifr-et
    '#eda100', // react
  ];
  return cols
    .filter((c) => !isEngineNa(c.key))
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
    html += `<tr><td class="op">${escapeHtml(a.label)} <code>${escapeHtml(a.id)}</code></td>`
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
      // Engine cells are N/A on this host — omitted entirely (see footnote).
      if (isEngineNa(c.cell)) continue;
      html += `<tr><td class="op"><code>${escapeHtml(c.cell)}</code></td>`
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
  const isEngineFactor = (name) => /engine/i.test(name);

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
    'render vdom→vapor (no-IFR)': ['vdom', 'vapor'],
    'staging opstream→code (vdom, no-IFR)': ['vdom', 'vdom-et'],
    'staging opstream→code (vdom, +IFR)': ['vdom-ifr', 'vdom-ifr-et'],
    'naming dense→sparse (vapor, no-IFR)': ['vapor-dense', 'vapor'],
    'naming dense→sparse (vapor, +IFR)': ['vapor-ifr-dense', 'vapor-ifr'],
    'staging data→engine (vapor, STUB)': ['vapor', 'vapor-engine'],
    'ifr off→on (vdom)': ['vdom', 'vdom-ifr'],
    'ifr off→on (vapor sparse)': ['vapor', 'vapor-ifr'],
    'ifrPaint plain→engine-et (STUB)': ['vapor-ifr', 'vapor-ifr-engine-et'],
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
      if (/engine/i.test(name)) continue; // N/A on this host — omitted.
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
      .filter(([name]) => !/engine/i.test(name))
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

  return `
<h2>${escapeHtml(t.hGraphEngFactors)}</h2>
<p class="sub">${t.subGraphEngFactors}</p>
${sizes.map((sz, i) => `<div class="scroll"${i ? ' style="margin-top:10px"' : ''}>${cellTable(sz)}</div>`).join('')}
<p class="sub" style="margin-top:14px">${
    t.lang.startsWith('zh')
      ? '主效应（每次只动一根轴）。图：柱向左（负）= 该轴让该操作更快;±10% 内视为噪声（reps=2）。engine 因子在 web 上是 stub 探测开销。'
      : 'Main effects (one axis moved at a time). Charts: bars left (negative) = the axis makes that op faster; read ±10% as noise (reps=2). Engine factors are stub probe overhead on web.'
  }</p>
<div class="charts">
  ${sizes.map((sz) => factorBars(sz)).join('')}
</div>
${sizes.map((sz) => `<div class="scroll" style="margin-top:10px">${factorTable(sz)}</div>`).join('')}
${fcpFactorsBlock()}
${factorTakeaways()}
`;

  /** Data-driven takeaways for the main effects (en/zh). */
  function factorTakeaways() {
    const zhT = t.lang.startsWith('zh');
    const f = graphEngFactors.factors ?? {};
    const d = (name, key) => f[name]?.[key]?.deltaPct;
    const fmtP = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v}%`);
    const renderUS = ['1k', '10k', '30k']
      .map((sz) => d('render vdom→vapor (no-IFR)', `updateStorm@${sz}`))
      .filter((v) => v != null);
    const stagingCreate = ['1k', '10k', '30k']
      .map((sz) => d('staging opstream→code (vdom, no-IFR)', `create@${sz}`))
      .filter((v) => v != null);
    const items = zhT
      ? [
        ['<b>Update / select 对模板机制是盲的。</b>staging（opstream→code）与 naming（dense→sparse）在 update10th / select / updateStorm / selectStorm 上的因子在各规模都落在 ±10% 噪声带内 — 与 ops 级 factorial（所有 cell 的 update 帧数、native 调用完全相同）互证。模板只改变首帧由谁构建，不改变洞怎么写。',
        ],
        [`<b>Create 的模板收益与子树静态占比成正比。</b>table app 的 create 被动态 v-for 行主导（staging 因子 create ${fmtP(stagingCreate[0])}~${fmtP(stagingCreate[stagingCreate.length - 1])} ≈ 噪声）；静态重内容（sfc-probe FCP 阶梯）上 Code-Template 是唯一全场景为负的因子。要 ET 收益，先看你的首屏静态占比。`],
        [`<b>render 轴（vdom→vapor）才是 update 的大杠杆</b>：updateStorm ${renderUS.map(fmtP).join(' / ')}（1k→30k），远超任何模板轴。交互性能选 render model，别指望模板。`],
        ['<b>IFR 是首帧杠杆，不是交互杠杆</b>：ifr 因子只在 create/FCP 显著，update 因子在噪声内；×4 下 vapor 的 IFR 首帧代价由 sparse naming 收回（dense +12% → sparse +2%）。',
        ],
        ['<b>naming（dense→sparse）是内存/簿记轴</b>：BG shells −94%、MT 表 −92%（精确计数），FCP 因子随主机与规模在噪声带内摇摆 — 它是阶梯的必要卫生，不是 FCP 特性。',
        ],
        ['<b>engine 与 engine-et 在本环境记为 N/A</b>（Lynx for Web 无引擎 ET PAPI；<code>__VUE_LYNX_ENGINE_ET_STATUS__ = stub</code>）。它们的解释回退对照样本仅用作 fail-safe 成本与噪声尺，不作为 engine 结论；这条轴已端到端可跑，等引擎 PAPI 落地即测真值。',
        ],
      ]
      : [
        ['<b>Update and select are template-blind.</b> The staging (opstream→code) and naming (dense→sparse) factors on update10th / select / updateStorm / selectStorm sit inside the ±10% noise band at every scale — corroborating the ops-level factorial (identical update frames + native calls in every cell). Templates change who builds the first frame, not how holes are written.',
        ],
        [`<b>Create benefit scales with the static fraction of the subtree.</b> The table app's create is dominated by dynamic v-for rows (staging factor on create ${fmtP(stagingCreate[0])}…${fmtP(stagingCreate[stagingCreate.length - 1])} ≈ noise); on static-heavy content (the sfc-probe FCP ladder) Code-Template is the one factor negative in every scenario. Check your first screen's static fraction before reaching for ET.`],
        [`<b>The render axis (vdom→vapor) is the update lever</b>: updateStorm ${renderUS.map(fmtP).join(' / ')} (1k→30k) — far beyond any template axis. Pick the render model for interaction performance; don't expect templates to move it.`],
        ['<b>IFR is a first-frame lever, not an interaction lever</b>: the ifr factor is significant only on create/FCP, its update factors sit in noise; under ×4 vapor\'s IFR first-frame cost is recovered by sparse naming (dense +12% → sparse +2%).',
        ],
        ['<b>Naming (dense→sparse) is the memory/bookkeeping axis</b>: −94% BG shells, −92% MT table entries (exact counts) while its FCP factor wobbles inside noise across hosts and scales — necessary ladder hygiene, not an FCP feature.',
        ],
        ['<b>Engine and engine-et are N/A on this host</b> (Lynx for Web has no engine ET PAPI; <code>__VUE_LYNX_ENGINE_ET_STATUS__ = stub</code>). Their interpretation-fallback control samples serve only as a fail-safe-cost / noise yardstick, never as engine conclusions; the axis runs end-to-end and reports real numbers the day the engine PAPI ships.',
        ],
      ];
    return `<h3 style="font-size:13.5px;margin:18px 0 6px">${
      zhT ? '主效应结论（take away）' : 'Main-effect takeaways'
    }</h3><ul class="notes" style="margin-top:4px">${
      items.map(([html]) => `<li>${html}</li>`).join('')
    }</ul>`;
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
  .chart h3 { font-size: 13.5px; margin: 8px 0 2px; }
  .chart svg { width: 100%; height: auto; }
  .grid { stroke: var(--line); stroke-width: 1; }
  .tick, .axis { fill: var(--ink-2); font-size: 10.5px; }
  .axis { font-size: 11px; }
  .line { fill: none; stroke-width: 2.4; }
  .dot { stroke: var(--surface); stroke-width: 2; }
  .slabel { font-size: 11px; font-weight: 600; }
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
  })}
  ${renderLineChart({
    title: ch.fcp4.title,
    sub: ch.fcp4.sub,
    series: fcpSeries(4, t),
    xLabel: ch.fcp4.x,
    yLabel: ch.fcp4.y,
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
