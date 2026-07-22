// Unified TABLE-workload runner (interaction + storms) on top of the shared
// core. Closes the biggest coverage hole the design doc flagged: interaction
// metrics were never collected on IFR builds, and cross-framework interaction
// was never put on the same element axis as the FCP campaign.
//
// One harness builds every matrix cell fresh (VDOM off/ifr/ifr-et, Vapor
// off/ifr from ui-vdom/ui-vapor with BENCH_IFR/BENCH_ET; React hooks/naive/
// compiler from ui-react) and drives the krausest ops through the core
// black-box driver on Lynx for Web. Single provenance (one session, one host)
// — unlike an ingest-of-committed-JSON approach. N recorded in ELEMENTS.
//
// Usage:
//   node harness/unified-table.mjs [--scales 1000,10000] [--cells ...]
//                                  [--reps 2] [--label table] [--skip-build]
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { ALL_CELLS, cellById } from '../core/matrix.mjs';
import { elementsForRows, rungLabel } from '../core/scale.mjs';
import { makeBenchHtml } from '../core/driver-client.mjs';
import { NEUTRALIZE_LYNX_PROFILE } from '../core/neutralize.mjs';
import { webBundleSections } from '../core/bundle.mjs';
import { stats } from '../core/stats.mjs';
import { generateVaporUiApp } from './build.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    scales: { type: 'string', default: '1000,10000' }, // row counts (buttons exist)
    cells: { type: 'string', default: '' },
    reps: { type: 'string', default: '2' },
    count: { type: 'string', default: '3' }, // one-shot op samples
    label: { type: 'string', default: 'table' },
    'skip-build': { type: 'boolean', default: false },
    port: { type: 'string', default: '8350' },
    headed: { type: 'boolean', default: false },
  },
});

const SCALES = args.scales.split(',').map((s) => Number(s.trim())).filter(Boolean);
const REPS = Number(args.reps);
const COUNT = Number(args.count);
const PORT = Number(args.port);
const STORM_TIMEOUT_MS = 240_000;
const CELLS = args.cells
  ? args.cells.split(',').map((s) => cellById(s.trim())).filter(Boolean)
  : ALL_CELLS;

const bundlesDir = path.join(root, 'unified-bundles', args.label);

const CREATE_BUTTON = {
  1000: 'Create 1,000 rows', 3000: 'Create 3,000 rows', 5000: 'Create 5,000 rows',
  10000: 'Create 10,000 rows', 20000: 'Create 20,000 rows', 30000: 'Create 30,000 rows',
};

// --- build -----------------------------------------------------------------

function buildCell(cell) {
  const dst = path.join(bundlesDir, cell.id);
  fs.mkdirSync(dst, { recursive: true });
  if (cell.framework === 'vue') {
    const app = cell.renderer === 'vapor' ? 'ui-vapor' : 'ui-vdom';
    const cwd = path.join(root, 'apps', app);
    // vapor App.vue is generated from the vdom source (byte-identical workload)
    if (cell.renderer === 'vapor') generateVaporUiApp();
    // The base (#327) app configs are driven by BENCH_CELL and emit to a
    // per-cell distRoot (off→dist, else dist-<cell>). Map my matrix flags onto
    // that scheme so the runner drives the canonical build system.
    const benchCell = cell.flags.enableElementTemplates
      ? 'ifr-et'
      : cell.flags.enableIFR
        ? 'ifr'
        : 'off';
    const distRoot = benchCell === 'off' ? 'dist' : `dist-${benchCell}`;
    fs.rmSync(path.join(cwd, distRoot), { recursive: true, force: true });
    fs.rmSync(path.join(cwd, 'node_modules/.cache'), { recursive: true, force: true });
    execSync('npx rspeedy build', {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'production', BENCH_CELL: benchCell },
    });
    fs.copyFileSync(path.join(cwd, distRoot, 'main.web.bundle'), path.join(dst, 'main.web.bundle'));
  } else {
    // react: ui-react with per-variant config
    const cwd = path.join(root, 'apps', 'ui-react');
    const cfg = {
      react: 'lynx.config.ts',
      'react-naive': 'lynx.naive.config.ts',
      'react-compiler': 'lynx.compiler.config.ts',
    }[cell.id];
    const distName = { react: 'dist', 'react-naive': 'dist-naive', 'react-compiler': 'dist-compiler' }[cell.id];
    fs.rmSync(path.join(cwd, distName), { recursive: true, force: true });
    execSync(`npx rspeedy build --config ${cfg}`, {
      cwd, stdio: 'pipe', env: { ...process.env, NODE_ENV: 'production' },
    });
    fs.copyFileSync(path.join(cwd, distName, 'main.web.bundle'), path.join(dst, 'main.web.bundle'));
  }
  return webBundleSections(path.join(dst, 'main.web.bundle'));
}

// --- server ----------------------------------------------------------------

const webCoreClientJs = require.resolve('@lynx-js/web-core/client.prod.js');
const webCoreRoot = path.resolve(path.dirname(webCoreClientJs), '../..');
const BENCH_HTML = makeBenchHtml();
const MIME = {
  '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.html': 'text/html', '.json': 'application/json', '.map': 'application/json',
  '.bundle': 'application/octet-stream', '.wasm': 'application/wasm',
};
function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let filePath = null;
    if (url.pathname === '/' || url.pathname === '/bench.html') {
      res.writeHead(200, { 'content-type': 'text/html' }); res.end(BENCH_HTML); return;
    }
    if (url.pathname.startsWith('/webcore/')) filePath = path.join(webCoreRoot, url.pathname.slice(9));
    else if (url.pathname.startsWith('/bundles/')) filePath = path.join(bundlesDir, url.pathname.slice(9));
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404); res.end('not found: ' + url.pathname); return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(filePath)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

// --- driver (core __x primitives) ------------------------------------------

class Driver {
  constructor(page) { this.page = page; }
  ev(fn, arg) { return this.page.evaluate(fn, arg); }
  rowCount() { return this.ev(() => globalThis.__x.rowCount()); }
  labelAt(i) { return this.ev((idx) => globalThis.__x.labelAt(idx), i); }
  settle() { return this.ev(() => globalThis.__x.settle()); }
  until(spec) { return this.ev((s) => globalThis.__x.until(s), spec); }
  async clickButton(label) {
    const rect = await this.ev((l) => globalThis.__x.buttonRect(l), label);
    if (!rect) throw new Error(`button not found: ${label}`);
    await this.page.mouse.click(rect.x, rect.y);
  }
  async clickCell(rowIndex, cls) {
    const rect = await this.ev((a) => globalThis.__x.cellRect(a.rowIndex, a.cls), { rowIndex, cls });
    if (!rect) throw new Error(`cell not found: row ${rowIndex} ${cls}`);
    await this.page.mouse.click(rect.x, rect.y);
  }
  async measureButton(label, spec, timeoutMs) {
    const armed = this.ev((a) => globalThis.__x.arm(a.spec, a.timeoutMs), { spec, timeoutMs });
    await this.clickButton(label);
    return (await armed).ms;
  }
  async measureCell(rowIndex, cls, spec) {
    const armed = this.ev((s) => globalThis.__x.arm(s), spec);
    await this.clickCell(rowIndex, cls);
    return (await armed).ms;
  }
}

async function loadCell(browser, cell) {
  const page = await browser.newPage();
  await page.addInitScript(NEUTRALIZE_LYNX_PROFILE);
  page.on('worker', (w) => w.evaluate(NEUTRALIZE_LYNX_PROFILE).catch(() => {}));
  await page.goto(`http://127.0.0.1:${PORT}/bench.html`, { waitUntil: 'load' });
  await page.evaluate(
    (u) => globalThis.__x.createView(u),
    `http://127.0.0.1:${PORT}/bundles/${cell.id}/main.web.bundle`,
  );
  await page.waitForFunction(() => globalThis.__x.findText('Benchmark on Lynx'), undefined, {
    timeout: 60_000, polling: 16,
  });
  return page;
}

// one (cell, scale) → op samples
async function runCellScale(browser, cell, rows) {
  const button = CREATE_BUTTON[rows];
  const samples = {}; // op -> [ms]
  const push = (op, ms) => (samples[op] ??= []).push(ms);
  const dnf = {};
  for (let rep = 0; rep < REPS; rep++) {
    const page = await loadCell(browser, cell);
    const d = new Driver(page);
    try {
      await d.settle();
      push('create', await d.measureButton(button, { type: 'rowCount', value: rows }, STORM_TIMEOUT_MS));
      await d.settle();
      // update10th ×COUNT
      for (let i = 0; i < COUNT; i++) {
        const before = await d.labelAt(0);
        push('update10th', await d.measureButton('Update every 10th row', {
          type: 'labelAt', index: 0, equals: `${before} !!!`,
        }));
        await d.settle();
      }
      // select ×COUNT (near-top rows)
      for (let i = 0; i < COUNT; i++) {
        const idx = i + 1;
        push('select', await d.measureCell(idx, 'col-label', { type: 'dangerAt', index: idx }));
        await d.settle();
      }
      // update storm (50 ticks) → labelAt(0) === 'bench 50'
      try {
        push('updateStorm', await d.measureButton('Update storm', {
          type: 'labelAt', index: 0, equals: 'bench 50',
        }, STORM_TIMEOUT_MS));
        await d.settle();
      } catch (e) {
        if (!String(e).includes('timeout')) throw e;
        dnf.updateStorm = (dnf.updateStorm ?? 0) + 1;
      }
      // select storm (30 ticks) → dangerAt(0)
      try {
        push('selectStorm', await d.measureButton('Select storm', {
          type: 'dangerAt', index: 0,
        }, STORM_TIMEOUT_MS));
      } catch (e) {
        if (!String(e).includes('timeout')) throw e;
        dnf.selectStorm = (dnf.selectStorm ?? 0) + 1;
      }
    } finally {
      await page.close();
    }
  }
  const ops = {};
  for (const [op, arr] of Object.entries(samples)) {
    const s = stats(arr);
    ops[op] = { median: s?.median ?? null, ci95: s?.ci95 ?? null, n: s?.n ?? 0 };
  }
  for (const [op, n] of Object.entries(dnf)) ops[op] = { ...(ops[op] ?? {}), dnf: n };
  return ops;
}

// --- main ------------------------------------------------------------------

async function main() {
  fs.mkdirSync(bundlesDir, { recursive: true });
  const bundles = {};
  if (!args['skip-build']) {
    for (const cell of CELLS) {
      console.log(`[build] ${cell.id}`);
      bundles[cell.id] = buildCell(cell);
    }
    fs.writeFileSync(path.join(bundlesDir, 'sizes.json'), JSON.stringify(bundles, null, 2));
  } else {
    Object.assign(bundles, JSON.parse(fs.readFileSync(path.join(bundlesDir, 'sizes.json'), 'utf8')));
  }

  const server = await startServer();
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({
    headless: !args.headed,
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  });

  const cells = {};
  try {
    for (const cell of CELLS) {
      const points = [];
      for (const rows of SCALES) {
        const ops = await runCellScale(browser, cell, rows);
        const N = elementsForRows(rows);
        points.push({ rung: rungLabel(N), rows, N, ops, bundle: bundles[cell.id] });
        const s = (op) => (ops[op]?.median == null ? (ops[op]?.dnf ? 'DNF' : 'n/a') : ops[op].median.toFixed(0));
        console.log(
          `[table] ${cell.id.padEnd(16)} rows=${String(rows).padStart(5)} (N=${N}) `
          + `create=${s('create')} upd=${s('update10th')} sel=${s('select')} `
          + `updStorm=${s('updateStorm')} selStorm=${s('selectStorm')}`,
        );
      }
      cells[cell.id] = { id: cell.id, label: cell.label, framework: cell.framework, points };
    }
  } finally {
    await browser.close();
    server.close();
  }

  const result = {
    meta: {
      workload: 'table', env: 'lynx-web', cpu: 'x1', axis: 'elements',
      date: new Date().toISOString(), node: process.version,
      cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model,
      reps: REPS, count: COUNT,
      scales: SCALES.map((rows) => ({ rows, N: elementsForRows(rows), rung: rungLabel(elementsForRows(rows)) })),
    },
    cells,
  };
  const outFile = path.join(root, 'results', `unified-${args.label}-x1.json`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(`\n[unified] wrote ${path.relative(root, outFile)}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
