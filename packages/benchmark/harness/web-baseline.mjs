// Plain-DOM baseline harness: the exact storm protocol from cross.mjs run
// against preact-hooks / Vue vdom / Vue vapor rendering DIRECTLY to the
// browser DOM (no Lynx, single-threaded). Purpose:
//   - ReactLynx is preact-based, so the honest web reference for it is
//     preact — this measures whether traits like "creates faster than Vue"
//     are the framework's own or the Lynx runtime's
//   - per-tick web numbers subtracted from the Lynx numbers quantify the
//     "Lynx pipeline tax" (serialize → transfer → main-thread apply) and
//     whether it amortizes framework differences
//
// Caveat vs cross.mjs: everything (app + our rAF predicate polling) shares
// ONE thread here. Predicates use early-exit walks to keep the observer
// cost ~constant and identical across frameworks.
//
// Usage: node harness/web-baseline.mjs [--reps 2] [--skip-build]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    reps: { type: 'string', default: '2' },
    'skip-build': { type: 'boolean', default: false },
    port: { type: 'string', default: '8331' },
  },
});
const REPS = Number(args.reps);
const PORT = Number(args.port);

const MODES = ['preact-web', 'vue-web', 'vapor-web'];
const BUNDLE = {
  'preact-web': 'preact.js',
  'vue-web': 'vue.js',
  'vapor-web': 'vapor.js',
};

const SIZES = {
  '1k': { button: 'Create 1,000 rows', rows: 1000 },
  '3k': { button: 'Create 3,000 rows', rows: 3000 },
  '5k': { button: 'Create 5,000 rows', rows: 5000 },
  '10k': { button: 'Create 10,000 rows', rows: 10000 },
  '20k': { button: 'Create 20,000 rows', rows: 20000 },
  '30k': { button: 'Create 30,000 rows', rows: 30000 },
};

const APP_HTML = (mode) => `<!doctype html>
<html>
<head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;font:12px sans-serif}
  .toolbar{display:flex;flex-wrap:wrap;gap:2px}
  .btn{padding:3px 6px;font-size:11px}
  .rows{display:flex;flex-direction:column}
  .row{display:flex;flex-direction:row;height:18px;align-items:center}
  .danger{background:#f2dede}
  .col-id{width:60px}.col-label{flex:1}.col-remove{width:30px;color:#c00}
</style>
</head>
<body>
<div id="app"></div>
<script>
(() => {
  const x = (globalThis.__x = {});
  const hasClass = (el, cls) => (el.className || '').split(/\\s+/).includes(cls);
  let rowsEl = null;
  const rows = () => {
    if (!rowsEl || !rowsEl.isConnected) rowsEl = document.querySelector('.rows');
    return rowsEl;
  };
  x.rowCount = () => {
    const c = rows();
    if (!c) return -1;
    let n = 0;
    for (const ch of c.children) if (hasClass(ch, 'row')) n++;
    return n;
  };
  // early-exit accessors keep the per-frame observer cost tiny and constant
  const rowAt = (i) => {
    const c = rows();
    if (!c) return null;
    let k = 0;
    for (const ch of c.children) {
      if (!hasClass(ch, 'row')) continue;
      if (k === i) return ch;
      k++;
    }
    return null;
  };
  x.labelAt = (i) => rowAt(i)?.querySelector('.col-label')?.textContent ?? null;
  x.dangerAt = (i) => {
    const r = rowAt(i);
    return r ? hasClass(r, 'danger') : false;
  };
  x.buttonRect = (label) => {
    for (const el of document.querySelectorAll('.btn-text')) {
      if (el.textContent === label) {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }
    }
    return null;
  };
  x.cellRect = (rowIndex, cls) => {
    const cell = rowAt(rowIndex)?.querySelector('.' + cls);
    if (!cell) return null;
    const rect = cell.getBoundingClientRect();
    return { x: rect.x + Math.min(20, rect.width / 2), y: rect.y + rect.height / 2 };
  };
  const checkPredicate = (spec) =>
    spec.type === 'rowCount' ? x.rowCount() === spec.value
    : spec.type === 'labelAt' ? x.labelAt(spec.index) === spec.equals
    : spec.type === 'dangerAt' ? x.dangerAt(spec.index)
    : (() => { throw new Error('unknown predicate ' + spec.type); })();
  x.arm = (spec, timeoutMs) =>
    new Promise((resolve, reject) => {
      let t0 = null;
      window.addEventListener('pointerdown', () => { t0 = performance.now(); }, { capture: true, once: true });
      const deadline = performance.now() + (timeoutMs ?? 120000);
      const tick = () => {
        if (t0 != null && checkPredicate(spec)) return resolve({ ms: performance.now() - t0 });
        if (performance.now() > deadline) {
          return reject(new Error('predicate timeout: ' + JSON.stringify(spec)));
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  x.until = (spec, timeoutMs = 120000) =>
    new Promise((resolve, reject) => {
      const deadline = performance.now() + timeoutMs;
      const tick = () => {
        if (checkPredicate(spec)) return resolve(true);
        if (performance.now() > deadline) return reject(new Error('until timeout: ' + JSON.stringify(spec)));
        requestAnimationFrame(tick);
      };
      tick();
    });
  x.settle = (extraMs = 30) =>
    new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, extraMs))),
    );
})();
</script>
<script src="/bundle/${BUNDLE[mode]}"></script>
</body>
</html>`;

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    for (const mode of MODES) {
      if (url.pathname === `/${mode}.html`) {
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end(APP_HTML(mode));
        return;
      }
    }
    if (url.pathname.startsWith('/bundle/')) {
      const fp = path.join(root, 'apps/web-baseline/dist', url.pathname.slice(8));
      if (fs.existsSync(fp)) {
        res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' });
        fs.createReadStream(fp).pipe(res);
        return;
      }
    }
    res.writeHead(404);
    res.end('not found');
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function clickButton(page, label) {
  const rect = await page.evaluate((l) => globalThis.__x.buttonRect(l), label);
  if (!rect) throw new Error(`button not found: ${label}`);
  await page.mouse.click(rect.x, rect.y);
}

async function measureButton(page, label, spec, timeoutMs) {
  const armed = page.evaluate(
    ({ spec, timeoutMs }) => globalThis.__x.arm(spec, timeoutMs),
    { spec, timeoutMs },
  );
  await clickButton(page, label);
  return (await armed).ms;
}

async function measureCell(page, rowIndex, cls, spec) {
  const armed = page.evaluate((s) => globalThis.__x.arm(s), spec);
  const rect = await page.evaluate(
    ({ rowIndex, cls }) => globalThis.__x.cellRect(rowIndex, cls),
    { rowIndex, cls },
  );
  await page.mouse.click(rect.x, rect.y);
  return (await armed).ms;
}

async function runRep(browser, mode, sizeKey) {
  const size = SIZES[sizeKey];
  const page = await browser.newPage();
  const samples = [];
  const record = (op, ms) => samples.push({ op: `${op}@${sizeKey}`, ms });
  try {
    await page.goto(`http://127.0.0.1:${PORT}/${mode}.html`, { waitUntil: 'load' });
    await page.waitForFunction(
      () => globalThis.__x.buttonRect('Update storm') != null,
      undefined,
      { timeout: 30000 },
    );
    await page.evaluate(() => globalThis.__x.settle());

    record('create', await measureButton(page, size.button, { type: 'rowCount', value: size.rows }));
    await page.evaluate(() => globalThis.__x.settle());

    for (let i = 0; i < 3; i++) {
      const before = await page.evaluate(() => globalThis.__x.labelAt(0));
      record('update10th', await measureButton(page, 'Update every 10th row', {
        type: 'labelAt', index: 0, equals: `${before} !!!`,
      }));
      await page.evaluate(() => globalThis.__x.settle());
    }
    for (let i = 0; i < 3; i++) {
      const idx = i + 1;
      record('select', await measureCell(page, idx, 'col-label', { type: 'dangerAt', index: idx }));
      await page.evaluate(() => globalThis.__x.settle());
    }
    for (let i = 0; i < 2; i++) {
      record('updateStorm', await measureButton(page, 'Update storm', {
        type: 'labelAt', index: 0, equals: 'bench 50',
      }, 240000));
      await page.evaluate(() => globalThis.__x.settle());
      const before = await page.evaluate(() => globalThis.__x.labelAt(0));
      await clickButton(page, 'Update every 10th row');
      await page.evaluate(
        (s) => globalThis.__x.until(s),
        { type: 'labelAt', index: 0, equals: `${before} !!!` },
      );
      await page.evaluate(() => globalThis.__x.settle());
    }
    for (let i = 0; i < 2; i++) {
      record('selectStorm', await measureButton(page, 'Select storm', {
        type: 'dangerAt', index: 0,
      }, 240000));
      await page.evaluate(() => globalThis.__x.settle());
      await measureCell(page, 3, 'col-label', { type: 'dangerAt', index: 3 });
      await page.evaluate(() => globalThis.__x.settle());
    }
  } finally {
    await page.close();
  }
  return samples;
}

function stats(values) {
  const clean = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const std = Math.sqrt(sorted.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / n);
  return { n, min: sorted[0], max: sorted[n - 1], mean, median, std, ci95: 1.96 * (std / Math.sqrt(n)) };
}

async function main() {
  if (!args['skip-build']) {
    execSync('node build.mjs', { cwd: path.join(root, 'apps/web-baseline'), stdio: 'inherit' });
  }
  const server = await startServer();
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  });

  const byMode = Object.fromEntries(MODES.map((m) => [m, []]));
  try {
    for (const sizeKey of Object.keys(SIZES)) {
      for (let rep = 0; rep < REPS; rep++) {
        const order = MODES.map((_, k) => MODES[(k + rep) % MODES.length]);
        for (const mode of order) {
          console.log(`[web] ${sizeKey} rep ${rep + 1}/${REPS} — ${mode}`);
          const samples = await runRep(browser, mode, sizeKey);
          for (const s of samples) console.log(`[web]   ${s.op}: ${s.ms.toFixed(1)}ms`);
          byMode[mode].push({ samples });
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  const aggregate = (loads) => {
    const byOp = {};
    for (const load of loads) for (const s of load.samples) (byOp[s.op] ??= []).push(s.ms);
    return Object.fromEntries(Object.entries(byOp).map(([op, arr]) => [op, stats(arr)]));
  };

  const result = {
    meta: {
      date: new Date().toISOString(),
      node: process.version,
      playwright: require('playwright-core/package.json').version,
      preactVersion: require(path.join(root, 'apps/web-baseline/node_modules/preact/package.json')).version,
      vueVersion: require('vue/package.json').version,
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model ?? 'unknown',
      reps: REPS,
      note: 'plain DOM, single-threaded (no Lynx); same click-driven storm protocol as cross.mjs',
    },
    perOp: Object.fromEntries(MODES.map((m) => [m, aggregate(byMode[m])])),
    raw: byMode,
  };

  fs.mkdirSync(path.join(root, 'results'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'results/web-baseline-latest.json'),
    JSON.stringify(result, null, 2),
  );

  let md = `# Plain-DOM baseline — preact-hooks vs Vue vdom vs Vue vapor (no Lynx)\n\n`;
  md += `- date: ${result.meta.date} · preact ${result.meta.preactVersion} · vue ${result.meta.vueVersion}\n`;
  md += `- ${result.meta.note}\n\n`;
  for (const sizeKey of Object.keys(SIZES)) {
    md += `## ${sizeKey} rows (ms, median ±CI95)\n\n| op | preact-web | vue-web | vapor-web |\n|---|---|---|---|\n`;
    for (const op of ['create', 'update10th', 'select', 'updateStorm', 'selectStorm']) {
      const cell = (m) => {
        const s = result.perOp[m]?.[`${op}@${sizeKey}`];
        return s ? `${s.median.toFixed(1)} ±${s.ci95.toFixed(1)}` : '—';
      };
      md += `| ${op} | ${cell('preact-web')} | ${cell('vue-web')} | ${cell('vapor-web')} |\n`;
    }
    md += `\n`;
  }
  fs.writeFileSync(path.join(root, 'results/web-baseline-latest.md'), md);
  console.log('\n' + md);
  console.log('[web] wrote results/web-baseline-latest.{json,md}');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
