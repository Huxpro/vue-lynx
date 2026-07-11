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

// ---------------------------------------------------------------------------
// data assembly
// ---------------------------------------------------------------------------

const COLUMNS = [
  { key: 'vapor', label: 'Vue Vapor', perOp: storms.perOp.vapor },
  { key: 'vdom', label: 'Vue VDOM', perOp: storms.perOp.vdom },
  { key: 'react', label: 'React (hooks)', perOp: storms.perOp.react },
  { key: 'react-naive', label: 'React (naive)', perOp: variants.perOp['react-naive'] },
  { key: 'react-compiler', label: 'React (compiler)', perOp: variants.perOp['react-compiler'] },
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
