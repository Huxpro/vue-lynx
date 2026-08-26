/**
 * Static-report adaptation of the visual system in
 * Huxpro/lynx-js-framework-benchmark/site (UI reference commit
 * b350ff915bc0e1ca43c46492d355536c99d1634b).
 *
 * The unified report remains a dependency-free HTML artifact, but uses the
 * same role tokens, header, cards, entry controls, heat grid, and theme
 * interaction as the canonical cross-framework benchmark UI.
 */
export const FRAMEWORK_BENCHMARK_CSS = String.raw`
:root {
  color-scheme: light;
  --surface-0: #fcfcfb;
  --surface-1: #ffffff;
  --surface-2: #f0efec;
  --border: #e2e1dc;
  --text-primary: #191918;
  --text-secondary: #5f5e57;
  --text-muted: #93928a;
  --accent: #eb6834;
  --good: #1baf7a;
  --bad: #e34948;
  --heat-fast: 27, 175, 122;
  --heat-slow: 227, 73, 72;
}

@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme='light'])) {
    color-scheme: dark;
    --surface-0: #14151a;
    --surface-1: #1d1f26;
    --surface-2: #282a33;
    --border: #34363f;
    --text-primary: #f2f1ea;
    --text-secondary: #b5b4ab;
    --text-muted: #7d7c74;
    --accent: #d95926;
    --heat-fast: 25, 158, 112;
    --heat-slow: 230, 103, 103;
  }
}

:root[data-theme='dark'] {
  color-scheme: dark;
  --surface-0: #14151a;
  --surface-1: #1d1f26;
  --surface-2: #282a33;
  --border: #34363f;
  --text-primary: #f2f1ea;
  --text-secondary: #b5b4ab;
  --text-muted: #7d7c74;
  --accent: #d95926;
  --heat-fast: 25, 158, 112;
  --heat-slow: 230, 103, 103;
}

:root[data-theme='light'] { color-scheme: light; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--surface-0);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.55;
}
code, .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.92em;
}
a { color: inherit; }
.page { max-width: 1200px; margin: 0 auto; padding: 0 1.25rem 4rem; }

.site-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.site-title { font-weight: 750; font-size: 1.05rem; letter-spacing: -0.01em; white-space: nowrap; }
.site-title .lynx { color: var(--accent); }
.site-nav { display: flex; gap: 0.25rem; flex: 1; flex-wrap: wrap; }
.site-nav a {
  color: var(--text-secondary);
  font: inherit;
  font-weight: 550;
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  text-decoration: none;
}
.site-nav a:hover, .site-nav a[aria-current='page'] { background: var(--surface-2); color: var(--text-primary); }
.harness-switch {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  overflow: hidden;
}
.harness-switch span {
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
}
.harness-switch span[aria-pressed='true'] { background: var(--surface-2); color: var(--text-primary); }
.theme-toggle, .lang-switch {
  border: 1px solid var(--border);
  background: none;
  color: var(--text-secondary);
  border-radius: 0.5rem;
  padding: 0.3rem 0.55rem;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1.2;
  text-decoration: none;
}

h1 { font-size: 1.7rem; letter-spacing: -0.02em; margin: 0.5rem 0 0.25rem; }
h2 { font-size: 1.2rem; letter-spacing: -0.01em; margin: 2.2rem 0 0.4rem; scroll-margin-top: 1rem; }
.subtitle, .sub { color: var(--text-secondary); max-width: 75ch; margin: 0 0 1rem; }
.sub { font-size: 0.88rem; }
.note { color: var(--text-muted); font-size: 0.85rem; max-width: 76ch; }

.pillrow { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.8rem 0 1.3rem; }
.pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-secondary);
  font-family: ui-monospace, Menlo, monospace;
  font-size: 0.72rem;
  padding: 0.24rem 0.55rem;
}

.card {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 0.9rem;
  padding: 1rem 1.1rem 0.9rem;
  margin: 1rem 0;
}
.card-title { font-weight: 700; font-family: ui-monospace, Menlo, monospace; font-size: 0.95rem; }
.card-desc { color: var(--text-secondary); font-size: 0.88rem; margin: 0.15rem 0 0.6rem; max-width: 75ch; }
.controls-row { display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem; align-items: center; margin: 0 0 0.6rem; }
.seg { display: inline-flex; border: 1px solid var(--border); border-radius: 0.45rem; overflow: hidden; flex-wrap: wrap; }
.seg button {
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  padding: 0.22rem 0.6rem;
}
.seg button[aria-pressed='true'] { background: var(--surface-2); color: var(--text-primary); font-weight: 600; }

.entry-legend { display: flex; flex-wrap: wrap; gap: 0.45rem 0.9rem; margin: 0.4rem 0 0.8rem; }
.entry-legend .item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-secondary);
  border: none;
  background: none;
  padding: 0.1rem 0.2rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
}
.entry-legend .item[aria-pressed='false'] { opacity: 0.42; }
.swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; flex: none; }

.heat-scroll, .scroll { overflow-x: auto; }
table.heat { border-collapse: separate; border-spacing: 3px; font-size: 0.8rem; min-width: max-content; width: 100%; }
table.heat th { border: 0; font-weight: 600; color: var(--text-secondary); padding: 0.2rem 0.4rem; text-align: left; white-space: nowrap; }
table.heat th.colhead { text-align: center; min-width: 5.2rem; }
table.heat td {
  border: 0;
  text-align: center;
  padding: 0.34rem 0.45rem;
  border-radius: 0.35rem;
  font-family: ui-monospace, Menlo, monospace;
  cursor: default;
  white-space: nowrap;
}
table.heat td .absolute { display: block; color: var(--text-secondary); font-size: 0.68rem; }
table.heat td.null {
  color: var(--text-muted);
  background: repeating-linear-gradient(45deg, transparent, transparent 4px, var(--surface-2) 4px, var(--surface-2) 8px);
}
table.heat td.ref { border: 1px dashed var(--border); color: var(--text-muted); }
table.heat td.fastest { outline: 2px solid var(--accent); outline-offset: -2px; font-weight: 700; }
table.heat td.data:hover { filter: brightness(1.12); }
table.heat .rowhead { position: sticky; left: 0; z-index: 1; background: var(--surface-1); font-family: ui-monospace, Menlo, monospace; }
table.heat tfoot .rowhead, table.heat tfoot td { border-top: 2px solid var(--border); font-weight: 700; }

.matrix-table, .scroll table:not(.heat) { border-collapse: collapse; min-width: 720px; width: 100%; font-size: 0.8rem; }
.matrix-table th, .matrix-table td, .scroll table:not(.heat) th, .scroll table:not(.heat) td { border: 1px solid var(--border); padding: 0.3rem 0.55rem; text-align: right; white-space: nowrap; }
.matrix-table th, .scroll table:not(.heat) th { color: var(--text-secondary); font-weight: 600; }
.matrix-table th:first-child, .matrix-table td.op, .scroll table:not(.heat) th:first-child, .scroll table:not(.heat) td.op { text-align: left; }
.matrix-table td.op, .scroll table:not(.heat) td.op { color: var(--text-secondary); }
.matrix-table td.c .f, .scroll table:not(.heat) td.c .f { display: block; color: var(--text-muted); font-size: 0.68rem; }
.matrix-table td.na, .matrix-table td.plain, .scroll table:not(.heat) td.na, .scroll table:not(.heat) td.plain { color: var(--text-muted); }
.matrix-table td.dnf, .scroll table:not(.heat) td.dnf { background: var(--bad); color: #fff; font-weight: 650; }
table.heat td.dnf { background: var(--bad); color: #fff; font-weight: 650; }

.charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1rem; }
.chart { min-width: 0; max-width: none; }
.chart.wide { grid-column: 1 / -1; }
figure.chart { margin: 0; }
.chart svg { width: 100%; height: auto; }
.grid { stroke: var(--border); stroke-width: 1; }
.tick, .axis { fill: var(--text-secondary); font-size: 10.5px; }
.axis { font-size: 11px; }
.line { fill: none; stroke-width: 2.4; transition: opacity .12s, stroke-width .12s; }
.dot { stroke: var(--surface-1); stroke-width: 2; transition: opacity .12s; }
.slabel { font-size: 11px; font-weight: 600; transition: opacity .12s; cursor: pointer; }
.ccanvas.hovering .line, .ccanvas.hovering .dot, .ccanvas.hovering .slabel { opacity: .18; }
.ccanvas .line.hl { opacity: 1; stroke-width: 3.6; }
.ccanvas .dot.hl, .ccanvas .slabel.hl { opacity: 1; }
.ccanvas .slabel.hl { font-size: 12.5px; }
.ccanvas .overlay { fill: transparent; cursor: crosshair; touch-action: none; }
.ccanvas .brush { fill: var(--accent); fill-opacity: .12; stroke: var(--accent); stroke-opacity: .55; stroke-width: 1; }
.cctl { display: flex; align-items: center; gap: 10px; margin: 2px 0 8px; color: var(--text-muted); flex-wrap: wrap; font-size: 0.72rem; }
.cctl .creset { font: inherit; padding: 2px 9px; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); border-radius: 5px; cursor: pointer; }

.verdicts, .tkgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 0.7rem; margin: 0.5rem 0 1rem; }
.verdict, .tk { background: var(--surface-1); border: 1px solid var(--border); border-radius: 0.75rem; padding: 0.8rem 0.9rem; }
.verdict.good { border-left: 4px solid var(--good); }
.verdict.warn { border-left: 4px solid #d7a62a; }
.verdict.serious, .verdict.critical { border-left: 4px solid var(--bad); }
.verdict header { margin-bottom: 0.45rem; }
.takeaway { font-size: 0.92rem; font-weight: 700; line-height: 1.35; }
.why, .evidence { color: var(--text-secondary); font-size: 0.8rem; margin: 0 0 0.35rem; line-height: 1.45; }
.evidence { margin-bottom: 0; }
.lbl { display: inline-block; color: var(--text-muted); font-size: 0.64rem; font-weight: 700; letter-spacing: 0.06em; margin-right: 0.25rem; text-transform: uppercase; }
.tk .tkhead { display: block; font-size: 0.8rem; font-weight: 700; line-height: 1.35; }
.tk .tkbody { display: block; margin-top: 0.2rem; color: var(--text-secondary); font-size: 0.75rem; line-height: 1.45; }
.notes { margin-top: 2rem; color: var(--text-muted); font-size: 0.82rem; max-width: 76ch; }
.notes li { margin: 0.25rem 0; }
.report-footer { border-top: 1px solid var(--border); margin-top: 3rem; padding-top: 1rem; }

@media (prefers-reduced-motion: reduce) { .line, .dot, .slabel { transition: none; } }
@media (max-width: 640px) {
  body { font-size: 14px; }
  .page { padding-inline: 0.8rem; }
  .site-nav { order: 3; flex-basis: 100%; }
  .charts { grid-template-columns: 1fr; }
}
`;

export const FRAMEWORK_BENCHMARK_SCRIPT = String.raw`
(() => {
  window.__disabledBenchmarkEntries = window.__disabledBenchmarkEntries || new Set();
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const effectiveTheme = () => root.dataset.theme
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const paintToggle = () => {
    if (toggle) {
      toggle.textContent = effectiveTheme() === 'dark' ? '☀' : '☾';
      toggle.setAttribute('aria-label', effectiveTheme() === 'dark' ? 'Use light theme' : 'Use dark theme');
    }
  };
  toggle?.addEventListener('click', () => {
    root.dataset.theme = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.style.colorScheme = root.dataset.theme;
    paintToggle();
  });
  new MutationObserver(paintToggle).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  paintToggle();

  const tint = (ratio) => {
    const t = Math.max(-1, Math.min(1, Math.log(ratio) / Math.log(4)));
    const alpha = (Math.abs(t) * 0.5).toFixed(3);
    return 'rgba(' + (t < 0 ? 'var(--heat-fast)' : 'var(--heat-slow)') + ', ' + alpha + ')';
  };
  const fmtX = (value) => value >= 100 ? Math.round(value) + '×'
    : value >= 10 ? value.toFixed(0) + '×'
      : value >= 2 ? value.toFixed(1) + '×' : value.toFixed(2) + '×';
  const geometricMean = (values) => values.length
    ? Math.exp(values.reduce((sum, value) => sum + Math.log(value), 0) / values.length)
    : null;

  document.querySelectorAll('[data-heat-grid]').forEach((card) => {
    const table = card.querySelector('table.heat');
    const buttons = [...card.querySelectorAll('[data-baseline]')];
    const entries = [...table.querySelectorAll('thead [data-entry]')].map((node) => node.dataset.entry);
    const rows = [...table.querySelectorAll('tbody tr')];
    const footer = table.querySelector('tfoot tr');
    const applyBaseline = (baseline) => {
      const visibleEntries = new Set(entries.filter((entry) => {
        const head = table.querySelector('thead [data-entry="' + CSS.escape(entry) + '"]');
        return head && !head.hidden;
      }));
      if (baseline !== 'fastest' && !visibleEntries.has(baseline)) baseline = 'fastest';
      const geos = new Map(entries.map((entry) => [entry, []]));
      rows.forEach((row) => {
        const cells = [...row.querySelectorAll('td[data-entry]')];
        const values = new Map(cells.map((cell) => [cell.dataset.entry, Number(cell.dataset.value)]));
        const present = [...values.entries()]
          .filter(([entry, value]) => visibleEntries.has(entry) && Number.isFinite(value) && value > 0)
          .map(([, value]) => value);
        const base = baseline === 'fastest' ? Math.min(...present) : values.get(baseline);
        cells.forEach((cell) => {
          const value = values.get(cell.dataset.entry);
          cell.classList.remove('ref', 'fastest');
          if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) return;
          const ratio = value / base;
          cell.querySelector('.ratio').textContent = fmtX(ratio);
          cell.style.background = baseline === cell.dataset.entry ? '' : tint(ratio);
          if (baseline === cell.dataset.entry) cell.classList.add('ref');
          if (baseline === 'fastest' && value === base) cell.classList.add('fastest');
          if (visibleEntries.has(cell.dataset.entry)) geos.get(cell.dataset.entry).push(ratio);
        });
      });
      if (footer) {
        footer.querySelectorAll('td[data-entry]').forEach((cell) => {
          const value = geometricMean(geos.get(cell.dataset.entry));
          cell.textContent = value == null ? '—' : fmtX(value);
          cell.classList.toggle('ref', baseline === cell.dataset.entry);
          cell.style.background = value == null || baseline === cell.dataset.entry ? '' : tint(value);
        });
      }
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.baseline === baseline)));
      card.dataset.activeBaseline = baseline;
    };
    buttons.forEach((button) => button.addEventListener('click', () => applyBaseline(button.dataset.baseline)));
    card.__applyHeatBaseline = applyBaseline;
    applyBaseline('fastest');
  });

  document.querySelectorAll('[data-entry-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const entry = button.dataset.entryToggle;
      const next = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(next));
      if (next) window.__disabledBenchmarkEntries.delete(entry);
      else window.__disabledBenchmarkEntries.add(entry);
      document.querySelectorAll('[data-entry="' + CSS.escape(entry) + '"]').forEach((node) => {
        node.hidden = !next;
      });
      document.querySelectorAll('[data-chart-entry="' + CSS.escape(entry) + '"]').forEach((node) => {
        node.style.display = next ? '' : 'none';
      });
      document.querySelectorAll('[data-heat-grid]').forEach((card) => {
        const baselineButton = card.querySelector('[data-baseline="' + CSS.escape(entry) + '"]');
        if (baselineButton) baselineButton.hidden = !next;
        card.__applyHeatBaseline?.(card.dataset.activeBaseline || 'fastest');
      });
    });
  });
})();
`;
