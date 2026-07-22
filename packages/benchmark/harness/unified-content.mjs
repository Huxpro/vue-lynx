// Unified benchmark runner (phase 2/3) — content workload, first-screen FCP
// scaling, on Lynx for Web, through the shared core.
//
// One harness that: builds every Vue matrix cell (VDOM off/ifr/ifr-et, Vapor
// off/ifr) from ONE generated source at an ELEMENT-indexed ladder, runs the
// SINGLE unified FCP definition (core/driver-client.mjs) on real Lynx for Web,
// and emits the unified results schema (N in elements) + α fits on that axis.
// Replaces the divergent ifr-bench sfc-probe + web-harness path.
//
// Usage:
//   node harness/unified.mjs [--rungs 1000,5000,10000] [--runs 5] [--cpu 1]
//                            [--cells vue-vdom-off,vue-vapor-off] [--label smoke]
//                            [--skip-build] [--port 8340]
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { selectCells, cellById } from '../core/matrix.mjs';
import { cardsForElements, elementsForCards, rungLabel } from '../core/scale.mjs';
import { generateContentApp } from '../core/workloads/content.mjs';
import { generateReactContentApp } from '../core/workloads/content-react.mjs';
import { makeBenchHtml } from '../core/driver-client.mjs';
import { NEUTRALIZE_LYNX_PROFILE } from '../core/neutralize.mjs';
import { webBundleSections } from '../core/bundle.mjs';
import { stats, slopeFit } from '../core/stats.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    rungs: { type: 'string', default: '1000,5000,10000' },
    runs: { type: 'string', default: '5' },
    cpu: { type: 'string', default: '1' },
    cells: { type: 'string', default: '' }, // empty = all 5 Vue cells
    label: { type: 'string', default: 'content' },
    'skip-build': { type: 'boolean', default: false },
    port: { type: 'string', default: '8340' },
    headed: { type: 'boolean', default: false },
  },
});

const RUNGS = args.rungs.split(',').map((s) => Number(s.trim())).filter(Boolean);
const RUNS = Number(args.runs);
const CPU = Number(args.cpu);
const PORT = Number(args.port);
const CELLS = args.cells
  ? args.cells.split(',').map((s) => cellById(s.trim())).filter(Boolean)
  : [...selectCells({ framework: 'vue' }), cellById('react')];

const bundlesDir = path.join(root, 'unified-bundles', args.label);
const contentAppDir = path.join(root, 'apps', 'ui-content');
const reactAppDir = path.join(root, 'apps', 'ui-react');

// --- build -----------------------------------------------------------------

function buildReactContentRung(cell, target) {
  const nCards = cardsForElements(target);
  const { elements } = generateReactContentApp(path.join(reactAppDir, 'src'), nCards);
  fs.rmSync(path.join(reactAppDir, 'node_modules/.cache'), { recursive: true, force: true });
  fs.rmSync(path.join(reactAppDir, 'dist-content'), { recursive: true, force: true });
  console.log(`[build] ${cell.id} @ ${rungLabel(target)} (${nCards} cards, ~${elements} el, ReactLynx)`);
  // ReactLynx has its own rspeedy toolchain (newer than the Vue apps') — build
  // through its local bin. The .map()-based source needs no deep stack.
  execSync('npx rspeedy build --config lynx.content.config.ts', {
    cwd: reactAppDir,
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production' },
  });
  const dst = path.join(bundlesDir, `${cell.id}-${rungLabel(target)}`);
  fs.mkdirSync(dst, { recursive: true });
  fs.copyFileSync(path.join(reactAppDir, 'dist-content', 'main.web.bundle'), path.join(dst, 'main.web.bundle'));
  return { nCards, elements, sections: webBundleSections(path.join(dst, 'main.web.bundle')) };
}

function buildCellRung(cell, target) {
  if (cell.framework === 'reactlynx') return buildReactContentRung(cell, target);
  const nCards = cardsForElements(target);
  const { elements } = generateContentApp(
    path.join(contentAppDir, 'src'),
    cell.renderer, // 'vdom' | 'vapor'
    nCards,
  );
  // stale webpack cache serves the previous cell's bundle (AGENTS.md #1)
  fs.rmSync(path.join(contentAppDir, 'node_modules/.cache'), { recursive: true, force: true });
  fs.rmSync(path.join(contentAppDir, 'dist'), { recursive: true, force: true });
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    BENCH_VAPOR: cell.renderer === 'vapor' ? '1' : '0',
    BENCH_IFR: cell.flags.enableIFR ? '1' : '0',
    BENCH_ET: cell.flags.enableElementTemplates ? '1' : '0',
    // four-axis knobs (default off): naming density, staging, delivery, paint
    BENCH_NAMING: cell.flags.templateNaming === 'dense' ? 'dense' : 'sparse',
    BENCH_STAGING: cell.flags.templateStaging === 'engine'
      ? 'engine'
      : cell.flags.templateStaging === 'code'
      ? 'code'
      : '',
    BENCH_DELIVERY: cell.flags.templateDelivery === 'bundle' ? 'bundle' : '',
    BENCH_IFRPAINT: cell.flags.ifrPaint === 'engine-et' ? 'engine-et' : '',
  };
  console.log(`[build] ${cell.id} @ ${rungLabel(target)} (${nCards} cards, ~${elements} el)`);
  // large unrolled SFC (≥20k) overflows the default V8 stack at build time;
  // invoke rspeedy through node with a deeper stack (same as sfc-probe).
  const rspeedyJs = path.join(root, 'node_modules/@lynx-js/rspeedy/bin/rspeedy.js');
  execFileSync('node', ['--stack-size=65536', rspeedyJs, 'build'], {
    cwd: contentAppDir,
    stdio: 'pipe',
    env,
  });
  const dst = path.join(bundlesDir, `${cell.id}-${rungLabel(target)}`);
  fs.mkdirSync(dst, { recursive: true });
  fs.copyFileSync(
    path.join(contentAppDir, 'dist', 'main.web.bundle'),
    path.join(dst, 'main.web.bundle'),
  );
  const sections = webBundleSections(path.join(dst, 'main.web.bundle'));
  return { nCards, elements, sections };
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
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(BENCH_HTML);
      return;
    }
    if (url.pathname.startsWith('/webcore/')) {
      filePath = path.join(webCoreRoot, url.pathname.slice('/webcore/'.length));
    } else if (url.pathname.startsWith('/bundles/')) {
      filePath = path.join(bundlesDir, url.pathname.slice('/bundles/'.length));
    }
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404);
      res.end('not found: ' + url.pathname);
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(filePath)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

// --- measure ---------------------------------------------------------------

async function measureFcp(browser, cell, target) {
  const page = await browser.newPage();
  await page.addInitScript(NEUTRALIZE_LYNX_PROFILE);
  page.on('worker', (w) => w.evaluate(NEUTRALIZE_LYNX_PROFILE).catch(() => {}));
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const cdp = await page.context().newCDPSession(page);
  if (CPU > 1) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }).catch(() => {});
  }
  try {
    await page.goto(`http://127.0.0.1:${PORT}/bench.html`, { waitUntil: 'load' });
    const url = `http://127.0.0.1:${PORT}/bundles/${cell.id}-${rungLabel(target)}/main.web.bundle`;
    const result = await page.evaluate(async (u) => {
      globalThis.__x.createView(u);
      return await globalThis.__x.fcp({ minContent: 5, idleMs: 400, timeoutMs: 120000 });
    }, url);
    return { ...result, errors };
  } finally {
    await page.close();
  }
}

// --- main ------------------------------------------------------------------

async function main() {
  fs.mkdirSync(bundlesDir, { recursive: true });

  // 1) build every cell × rung
  const built = {}; // cellId -> rung -> {nCards, elements, sections}
  if (!args['skip-build']) {
    for (const cell of CELLS) {
      built[cell.id] = {};
      for (const target of RUNGS) built[cell.id][rungLabel(target)] = buildCellRung(cell, target);
    }
    fs.writeFileSync(path.join(bundlesDir, 'built.json'), JSON.stringify(built, null, 2));
  } else {
    Object.assign(built, JSON.parse(fs.readFileSync(path.join(bundlesDir, 'built.json'), 'utf8')));
  }

  // 2) measure FCP on Lynx for Web
  const server = await startServer();
  const { chromium } = require('playwright-core');
  const launch = () => chromium.launch({
    headless: !args.headed,
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  });
  // A fresh browser per cell bounds the blast radius of a chromium crash
  // (heavy 30k trees under 4× throttle occasionally kill the renderer); a
  // failed measurement retries once on a relaunched browser before counting DNF.
  let browser = await launch();
  const measureResilient = async (cell, target) => {
    try {
      return await measureFcp(browser, cell, target);
    } catch (e) {
      try { await browser.close(); } catch {}
      browser = await launch();
      try { return await measureFcp(browser, cell, target); }
      catch { return { fcp: null, settled: null, dnf: true }; }
    }
  };

  const cells = {}; // cellId -> { label, points: [{N, fcp, settled, dnf, bundle}], alpha }
  try {
    for (const cell of CELLS) {
      try { await browser.close(); } catch {}
      browser = await launch();
      const points = [];
      for (const target of RUNGS) {
        const meta = built[cell.id][rungLabel(target)];
        const N = meta.elements;
        const fcps = [];
        const settles = [];
        let dnf = 0;
        for (let r = 0; r < RUNS; r++) {
          const m = await measureResilient(cell, target);
          if (m.dnf || m.fcp == null) dnf++;
          else { fcps.push(m.fcp); if (m.settled != null) settles.push(m.settled); }
        }
        const f = stats(fcps);
        const s = stats(settles);
        const point = {
          rung: rungLabel(target),
          N,
          nCards: meta.nCards,
          fcp: f?.median ?? null,
          fcpCi95: f?.ci95 ?? null,
          settled: s?.median ?? null,
          dnf,
          runs: RUNS,
          bundle: meta.sections,
        };
        points.push(point);
        console.log(
          `[fcp] ${cell.id.padEnd(18)} N=${String(N).padStart(6)} `
          + `fcp=${point.fcp == null ? 'DNF' : point.fcp.toFixed(1) + 'ms'}`
          + (dnf ? ` (${dnf} DNF)` : ''),
        );
      }
      const alpha = {
        fcp: slopeFit(points.map((p) => ({ N: p.N, value: p.fcp }))),
        mtGz: slopeFit(points.map((p) => ({ N: p.N, value: p.bundle?.mt?.gz }))),
        webGz: slopeFit(points.map((p) => ({ N: p.N, value: p.bundle?.web?.gz }))),
      };
      cells[cell.id] = { id: cell.id, label: cell.label, points, alpha };
    }
  } finally {
    await browser.close();
    server.close();
  }

  const result = {
    meta: {
      workload: 'content',
      env: 'lynx-web',
      cpu: `x${CPU}`,
      axis: 'elements',
      date: new Date().toISOString(),
      node: process.version,
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model,
      runs: RUNS,
      rungs: RUNGS.map((t) => ({ label: rungLabel(t), N: elementsForCards(cardsForElements(t)) })),
    },
    cells,
  };
  const outDir = path.join(root, 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `unified-${args.label}-x${CPU}.json`);
  // Merge into an existing file so cells can be added incrementally (e.g. the
  // ReactLynx content cell appended to a prior Vue-only run) without
  // re-measuring — same host/session provenance preserved by same --label.
  if (fs.existsSync(outFile)) {
    const prev = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    result.cells = { ...prev.cells, ...result.cells };
  }
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(`\n[unified] wrote ${path.relative(root, outFile)} (${Object.keys(result.cells).length} cells)`);
  console.log(reportTable(result));
}

function reportTable(result) {
  const ids = Object.keys(result.cells);
  const rungs = result.meta.rungs.map((r) => r.label);
  let md = `\n## Unified content FCP (Lynx for Web ${result.meta.cpu}, N in elements)\n\n`;
  md += `| cell | ${rungs.map((r) => `${r} (N)`).join(' | ')} | α(fcp) |\n`;
  md += `|---|${rungs.map(() => '---').join('|')}|---|\n`;
  for (const id of ids) {
    const c = result.cells[id];
    const cellsByRung = Object.fromEntries(c.points.map((p) => [p.rung, p]));
    const row = rungs.map((r) => {
      const p = cellsByRung[r];
      if (!p) return 'n/a';
      return p.fcp == null ? `DNF` : `${p.fcp.toFixed(0)} (${p.N})`;
    });
    md += `| ${c.label} | ${row.join(' | ')} | ${c.alpha.fcp == null ? 'n/a' : c.alpha.fcp.toFixed(2)} |\n`;
  }
  return md;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
