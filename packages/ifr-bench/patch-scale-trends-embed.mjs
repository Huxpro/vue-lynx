/**
 * Retrofit theme bridge + runtime ZH chrome onto committed scale-trends HTML.
 * Does not re-run measurements — only restyles / rewires existing artifacts.
 *
 *   node patch-scale-trends-embed.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  THEME_BRIDGE_CSS,
  THEME_BRIDGE_SCRIPT,
} from '../benchmark/harness/theme-bridge.mjs';
import { runtimeI18nScript } from '../benchmark/harness/embed-i18n.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(root, 'results');

const I18N = {
  en: {
    title: 'IFR architecture scale trends',
    h1: 'IFR architecture scale trends',
    lede:
      'Five product architectures on one generated content SFC, scaled from ~1k to '
      + '<strong>~30k</strong> elements. Lead chart is cost space (MT gzip × FCP); '
      + 'FCP vs N follows. See also the <em>Unified Benchmark Matrix</em> for the '
      + 'same-host IFR × VDOM/Vapor × React story.',
    hLinear: 'Linear scale — cost space + FCP vs N',
    hLog: 'Log-log scale',
    hAlpha: 'Scaling exponents',
    alphaLede:
      'α ≈ 0 → FCP dominated by fixed overhead (bundle parse / boot / IPC). '
      + 'α ≈ 1 → cost grows with content.',
    hRaw: 'Raw medians',
  },
  zh: {
    title: 'IFR 架构规模趋势',
    h1: 'IFR 架构规模趋势',
    lede:
      '同一份生成内容 SFC，五种产品架构，从约 1k 扩到 <strong>~30k</strong> 元素。'
      + '主图是代价空间（MT gzip × FCP），随后是 FCP vs N。'
      + '同机 IFR × VDOM/Vapor × React 故事见<em>统一基准矩阵</em>。',
    hLinear: '线性坐标 — 代价空间 + FCP vs N',
    hLog: '双对数坐标',
    hAlpha: '缩放指数',
    alphaLede:
      'α ≈ 0 → FCP 由固定开销主导（包体解析 / 启动 / IPC）。'
      + 'α ≈ 1 → 成本随内容近似线性增长。',
    hRaw: '原始中位数',
  },
};

const THEME_CSS = `
  :root {
    color-scheme: light;
    font-family: "IBM Plex Sans", "Noto Sans SC", "PingFang SC", ui-sans-serif, system-ui, sans-serif;
    --bg: #fafafa; --ink: #111; --muted: #444; --line: #e5e7eb; --panel: #fafafa; --code: #f3f4f6;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --bg: #12141a; --ink: #e8ecf4; --muted: #9aa3b5; --line: #2a3140; --panel: #181c26; --code: #222836;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --bg: #12141a; --ink: #e8ecf4; --muted: #9aa3b5; --line: #2a3140; --panel: #181c26; --code: #222836;
  }
  :root[data-theme="light"] {
    color-scheme: light;
    --bg: #fafafa; --ink: #111; --muted: #444; --line: #e5e7eb; --panel: #fafafa; --code: #f3f4f6;
  }
  ${THEME_BRIDGE_CSS}
  body { max-width: 980px; margin: 32px auto; padding: 0 20px 64px; color: var(--ink); background: var(--bg); }
  h1 { font-size: 1.45rem; margin: 0 0 8px; }
  h2 { font-size: 1.15rem; margin: 36px 0 10px; }
  h3 { font-size: 1rem; margin: 0 0 4px; }
  .lede { color: var(--muted); line-height: 1.5; margin-bottom: 24px; }
  .chart { border: 1px solid var(--line); border-radius: 10px; padding: 16px 12px 8px; margin: 16px 0 28px; background: var(--panel); }
  .sub { color: var(--muted); font-size: 0.85rem; line-height: 1.45; margin: 0 0 10px; }
  .grid { stroke: var(--line); stroke-width: 1; }
  .tick { font-size: 10px; fill: var(--muted); }
  .axis { font-size: 11px; fill: var(--ink); }
  .ptlabel { font-size: 10px; fill: var(--muted); }
  .slabel { font-size: 12px; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; font-size: 0.9rem; margin: 12px 0 28px; }
  th, td { border-bottom: 1px solid var(--line); padding: 7px 10px; text-align: left; }
  th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
  td.c { font-variant-numeric: tabular-nums; text-align: right; }
  td.op { font-weight: 500; }
  code { font-size: 0.85em; background: var(--code); padding: 1px 5px; border-radius: 4px; }
`;

function patchHtml(html, label) {
  // Replace the first <style>...</style> block
  let out = html.replace(/<style>[\s\S]*?<\/style>/, `<style>\n${THEME_CSS}\n</style>`);

  out = out
    .replace(/<h1>IFR architecture scale trends<\/h1>/, '<h1 data-i18n="h1">IFR architecture scale trends</h1>')
    .replace(
      /<p class="lede">\s*Five product architectures[\s\S]*?<\/p>/,
      `<p class="lede" data-i18n="lede">${I18N.en.lede}</p>`,
    )
    .replace(
      /<h2>Linear scale — cost space \+ FCP vs N<\/h2>/,
      '<h2 data-i18n="hLinear">Linear scale — cost space + FCP vs N</h2>',
    )
    .replace(/<h2>Log-log scale<\/h2>/, '<h2 data-i18n="hLog">Log-log scale</h2>')
    .replace(/<h2>Scaling exponents<\/h2>/, '<h2 data-i18n="hAlpha">Scaling exponents</h2>')
    .replace(
      /<p class="lede" style="margin-top:0">\s*α ≈ 0[\s\S]*?<\/p>/,
      `<p class="lede" style="margin-top:0" data-i18n="alphaLede">${I18N.en.alphaLede}</p>`,
    )
    .replace(/<h2>Raw medians<\/h2>/, '<h2 data-i18n="hRaw">Raw medians</h2>');

  const scripts =
    `<script>${runtimeI18nScript({
      en: { ...I18N.en, title: `IFR architecture scale trends — ${label}` },
      zh: { ...I18N.zh, title: `IFR 架构规模趋势 — ${label}` },
    })}</script>\n<script>${THEME_BRIDGE_SCRIPT}</script>\n`;

  if (out.includes('__BENCH_I18N')) {
    out = out.replace(/<script>[\s\S]*?__BENCH_I18N[\s\S]*?<\/script>\s*<script>[\s\S]*?vue-lynx-docs[\s\S]*?<\/script>\s*/g, '');
  }
  out = out.replace(/<\/body>\s*<\/html>\s*$/, `${scripts}</body>\n</html>\n`);
  if (!out.includes('</body>')) {
    out = `${out}\n${scripts}`;
  }
  return out;
}

for (const name of ['scale-trends-scale-x1.html', 'scale-trends-scale-x4.html']) {
  const p = path.join(resultsDir, name);
  if (!fs.existsSync(p)) {
    console.warn(`skip missing ${name}`);
    continue;
  }
  const label = name.replace(/^scale-trends-/, '').replace(/\.html$/, '');
  const next = patchHtml(fs.readFileSync(p, 'utf8'), label);
  fs.writeFileSync(p, next);
  console.log(`patched ${p}`);
}
