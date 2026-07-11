// Cross-framework BLACK-BOX benchmark: ReactLynx vs Vue VDOM vs Vue Vapor.
//
// Unlike harness/run.mjs (which relies on vue-lynx-internal instrumentation),
// this harness treats every app as a black box and measures only what a user
// could observe:
//   - it drives operations with REAL mouse clicks on the rendered buttons /
//     row cells (Playwright → Chromium input pipeline → Lynx tap events)
//   - it detects completion by polling the composed DOM (piercing shadow
//     roots) each animation frame until the expected end state is reached
//   - latency = first pointerdown received by the page → the rAF at which
//     the end-state predicate holds (resolution: one frame, ~1/60 s)
//
// The protocol is byte-identical for all three frameworks, so nothing here
// depends on how any of them render. Also collected: first screen, JS heap,
// bundle sizes.
//
// Usage: node harness/cross.mjs [--loads 2] [--count 10] [--heavy-count 5]
//        [--startup-count 3] [--skip-build] [--smoke] [--headed]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { buildApps, bundleSizes } from './build.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    loads: { type: 'string', default: '2' },
    count: { type: 'string', default: '10' },
    'heavy-count': { type: 'string', default: '5' },
    'startup-count': { type: 'string', default: '3' },
    'fresh-count': { type: 'string', default: '3' },
    'skip-build': { type: 'boolean', default: false },
    smoke: { type: 'boolean', default: false },
    storms: { type: 'boolean', default: false },
    'storm-reps': { type: 'string', default: '2' },
    headed: { type: 'boolean', default: false },
    port: { type: 'string', default: '8319' },
  },
});
const LOADS = Number(args.loads);
const COUNT = Number(args.count);
const HEAVY_COUNT = Number(args['heavy-count']);
const STARTUP_COUNT = Number(args['startup-count']);
const FRESH_COUNT = Number(args['fresh-count']);
const STORM_REPS = Number(args['storm-reps']);
const PORT = Number(args.port);

const MODES = ['react', 'vdom', 'vapor'];
const APP_DIR = { react: 'ui-react', vdom: 'ui-vdom', vapor: 'ui-vapor' };

// ---------------------------------------------------------------------------
// static server
// ---------------------------------------------------------------------------

const webCoreClientJs = require.resolve('@lynx-js/web-core/client.prod.js');
const webCoreRoot = path.resolve(path.dirname(webCoreClientJs), '../..');

const MIME = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.map': 'application/json',
  '.bundle': 'application/octet-stream',
  '.wasm': 'application/wasm',
};

// Page-side toolkit. Everything walks the COMPOSED tree (piercing shadow
// roots) so it works regardless of how lynx-view structures its internals.
const BENCH_HTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script type="module" src="/webcore/static/js/client.js"></script>
  <link rel="stylesheet" href="/webcore/static/css/client.css">
  <style>html,body{margin:0;padding:0}</style>
</head>
<body>
<script>
(() => {
  const x = (globalThis.__x = {});

  x.createView = (bundleUrl) => {
    const view = document.createElement('lynx-view');
    view.setAttribute('url', bundleUrl);
    view.style.cssText = 'display:block;width:800px;height:640px;';
    x.viewAttachTime = performance.now();
    document.body.appendChild(view);
    return true;
  };

  x.findText = (needle) => {
    const walk = (node) => {
      if (!node) return false;
      if (node.nodeType === 3 && node.textContent.includes(needle)) return true;
      if (node.shadowRoot && walk(node.shadowRoot)) return true;
      for (const child of node.childNodes || []) if (walk(child)) return true;
      return false;
    };
    return walk(document.body);
  };

  const classOf = (el) => (el.getAttribute && el.getAttribute('class')) || '';
  const hasClass = (el, cls) => classOf(el).split(/\\s+/).includes(cls);

  const findByClass = (cls) => {
    const out = [];
    const walk = (node) => {
      if (!node) return;
      if (node.nodeType === 1) {
        if (hasClass(node, cls)) out.push(node);
        if (node.shadowRoot) walk(node.shadowRoot);
      }
      for (const child of node.childNodes || []) walk(child);
    };
    walk(document.body);
    return out;
  };

  // Rows container is stable across operations in all three apps; cache it.
  let rowsEl = null;
  const rows = () => {
    if (!rowsEl || !rowsEl.isConnected) rowsEl = findByClass('rows')[0] ?? null;
    return rowsEl;
  };

  // Count/index only class="row" children — Vue's v-for materializes
  // fragment anchor nodes as extra children of the container.
  const rowEls = () => {
    const container = rows();
    if (!container) return [];
    const out = [];
    for (const child of container.children) {
      if (hasClass(child, 'row')) out.push(child);
    }
    return out;
  };

  x.rowCount = () => (rows() ? rowEls().length : -1);

  const cellOf = (rowEl, cls) => {
    for (const child of rowEl.children) if (hasClass(child, cls)) return child;
    return null;
  };
  x.labelAt = (i) => {
    const r = rowEls()[i];
    return r ? cellOf(r, 'col-label')?.textContent ?? null : null;
  };
  x.dangerAt = (i) => {
    const r = rowEls()[i];
    return r ? hasClass(r, 'danger') : false;
  };

  x.buttonRect = (label) => {
    for (const el of findByClass('btn-text')) {
      if (el.textContent === label) {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }
    }
    return null;
  };
  x.cellRect = (rowIndex, cls) => {
    const r = rowEls()[rowIndex];
    const cell = r && cellOf(r, cls);
    if (!cell) return null;
    const rect = cell.getBoundingClientRect();
    // click near the left edge of flexible cells so long labels don't matter
    return { x: rect.x + Math.min(20, rect.width / 2), y: rect.y + rect.height / 2 };
  };

  const checkPredicate = (spec) => {
    switch (spec.type) {
      case 'rowCount':
        return x.rowCount() === spec.value;
      case 'labelAt':
        return x.labelAt(spec.index) === spec.equals;
      case 'dangerAt':
        return x.dangerAt(spec.index);
      default:
        throw new Error('unknown predicate ' + spec.type);
    }
  };

  // Arm a measurement: t0 = the pointerdown of the real click that follows;
  // resolve at the first animation frame where the predicate holds.
  x.arm = (spec, timeoutMs) =>
    new Promise((resolve, reject) => {
      let t0 = null;
      const onDown = () => {
        t0 = performance.now();
      };
      window.addEventListener('pointerdown', onDown, {
        capture: true,
        once: true,
      });
      const deadline = performance.now() + (timeoutMs ?? 120000);
      const tick = () => {
        if (t0 != null && checkPredicate(spec)) {
          resolve({ ms: performance.now() - t0 });
          return;
        }
        if (performance.now() > deadline) {
          window.removeEventListener('pointerdown', onDown, { capture: true });
          reject(
            new Error(
              'predicate timeout: ' + JSON.stringify(spec)
                + ' rowCount=' + x.rowCount(),
            ),
          );
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

  // Wait until the predicate holds without measuring (setup steps).
  x.until = (spec, timeoutMs = 120000) =>
    new Promise((resolve, reject) => {
      const deadline = performance.now() + timeoutMs;
      const tick = () => {
        if (checkPredicate(spec)) return resolve(true);
        if (performance.now() > deadline) {
          return reject(new Error('until timeout: ' + JSON.stringify(spec)));
        }
        requestAnimationFrame(tick);
      };
      tick();
    });

  x.settle = (extraMs = 30) =>
    new Promise((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setTimeout(resolve, extraMs)),
      ),
    );
})();
</script>
</body>
</html>`;

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
    } else {
      for (const mode of MODES) {
        const prefix = `/${mode}/`;
        if (url.pathname.startsWith(prefix)) {
          filePath = path.join(
            root,
            'apps',
            APP_DIR[mode],
            'dist',
            url.pathname.slice(prefix.length),
          );
          break;
        }
      }
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
  return new Promise((resolve) => {
    server.listen(PORT, () => resolve(server));
  });
}

// ---------------------------------------------------------------------------
// browser plumbing
// ---------------------------------------------------------------------------

async function launchBrowser() {
  const { chromium } = require('playwright-core');
  return chromium.launch({
    headless: !args.headed,
    executablePath: '/opt/pw-browsers/chromium',
    args: [
      '--enable-precise-memory-info',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
  });
}

async function samplePageHeap(cdp) {
  try {
    const { metrics } = await cdp.send('Performance.getMetrics');
    const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
    return m.JSHeapUsedSize ?? null;
  } catch {
    return null;
  }
}

async function sampleWorkerHeaps(page) {
  const out = [];
  for (const worker of page.workers()) {
    try {
      out.push(
        await worker.evaluate(
          () => globalThis.performance?.memory?.usedJSHeapSize ?? null,
        ),
      );
    } catch {
      out.push(null);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// black-box driver
// ---------------------------------------------------------------------------

class Driver {
  constructor(page) {
    this.page = page;
  }

  async clickButton(label) {
    const rect = await this.page.evaluate(
      (l) => globalThis.__x.buttonRect(l),
      label,
    );
    if (!rect) throw new Error(`button not found: ${label}`);
    await this.page.mouse.click(rect.x, rect.y);
  }

  async clickCell(rowIndex, cls) {
    const rect = await this.page.evaluate(
      ({ rowIndex, cls }) => globalThis.__x.cellRect(rowIndex, cls),
      { rowIndex, cls },
    );
    if (!rect) throw new Error(`cell not found: row ${rowIndex} ${cls}`);
    await this.page.mouse.click(rect.x, rect.y);
  }

  /** Arm the predicate, perform the click, return measured ms. */
  async measureButton(label, spec, timeoutMs) {
    const armed = this.page.evaluate(
      ({ spec, timeoutMs }) => globalThis.__x.arm(spec, timeoutMs),
      { spec, timeoutMs },
    );
    await this.clickButton(label);
    const { ms } = await armed;
    return ms;
  }

  async measureCell(rowIndex, cls, spec) {
    const armed = this.page.evaluate((s) => globalThis.__x.arm(s), spec);
    await this.clickCell(rowIndex, cls);
    const { ms } = await armed;
    return ms;
  }

  async until(spec) {
    await this.page.evaluate((s) => globalThis.__x.until(s), spec);
  }

  async settle() {
    await this.page.evaluate(() => globalThis.__x.settle());
  }

  labelAt(i) {
    return this.page.evaluate((idx) => globalThis.__x.labelAt(idx), i);
  }

  rowCount() {
    return this.page.evaluate(() => globalThis.__x.rowCount());
  }

  // -- composed operations ---------------------------------------------------

  async create1k() {
    return this.measureButton('Create 1,000 rows', { type: 'rowCount', value: 1000 });
  }

  async clearTo() {
    await this.clickButton('Clear');
    await this.until({ type: 'rowCount', value: 0 });
    await this.settle();
  }
}

/**
 * Full black-box scenario against one loaded app. Mirrors the op sequence of
 * shared/bench-core.ts runScenario, driven purely through the UI.
 */
async function runScenario(driver, { count = COUNT, heavyCount = HEAVY_COUNT } = {}) {
  const samples = [];
  const record = (op, ms) => samples.push({ op, ms });

  // warmup (unmeasured)
  for (let i = 0; i < 3; i++) {
    await driver.clickButton('Create 1,000 rows');
    await driver.until({ type: 'rowCount', value: 1000 });
    await driver.clearTo();
  }

  // create1k
  for (let i = 0; i < count; i++) {
    record('create1k', await driver.create1k());
    await driver.settle();
    await driver.clearTo();
  }

  // update10th — on a fresh 1k table
  await driver.create1k();
  await driver.settle();
  for (let i = 0; i < count; i++) {
    const before = await driver.labelAt(0);
    record(
      'update10th',
      await driver.measureButton('Update every 10th row', {
        type: 'labelAt',
        index: 0,
        equals: `${before} !!!`,
      }),
    );
    await driver.settle();
  }

  // select — tap the label cell of a near-top row (cycles rows 1..8)
  for (let i = 0; i < count; i++) {
    const idx = (i % 8) + 1;
    record(
      'select',
      await driver.measureCell(idx, 'col-label', { type: 'dangerAt', index: idx }),
    );
    await driver.settle();
  }

  // swap
  for (let i = 0; i < count; i++) {
    const before1 = await driver.labelAt(1);
    const before998 = await driver.labelAt(998);
    if (before1 === before998) continue; // label collision: swap unobservable
    record(
      'swap',
      await driver.measureButton('Swap Rows', {
        type: 'labelAt',
        index: 1,
        equals: before998,
      }),
    );
    await driver.settle();
  }

  // remove — tap the x cell of the 3rd row
  for (let i = 0; i < count; i++) {
    const beforeCount = await driver.rowCount();
    record(
      'remove',
      await driver.measureCell(2, 'col-remove', {
        type: 'rowCount',
        value: beforeCount - 1,
      }),
    );
    await driver.settle();
  }

  // append1k — reset to 1k first
  for (let i = 0; i < count; i++) {
    await driver.clearTo();
    await driver.create1k();
    await driver.settle();
    record(
      'append1k',
      await driver.measureButton('Append 1,000 rows', {
        type: 'rowCount',
        value: 2000,
      }),
    );
    await driver.settle();
  }

  // create10k / clear10k
  for (let i = 0; i < heavyCount; i++) {
    await driver.clearTo();
    record(
      'create10k',
      await driver.measureButton('Create 10,000 rows', {
        type: 'rowCount',
        value: 10000,
      }),
    );
    await driver.settle();
    record(
      'clear10k',
      await driver.measureButton('Clear', { type: 'rowCount', value: 0 }),
    );
    await driver.settle();
  }

  return samples;
}

async function loadApp(browser, mode) {
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable').catch(() => {});
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto(`http://127.0.0.1:${PORT}/bench.html`, { waitUntil: 'load' });
  await page.evaluate(
    (url) => globalThis.__x.createView(url),
    `http://127.0.0.1:${PORT}/${mode}/main.web.bundle`,
  );
  await page.waitForFunction(
    () => globalThis.__x.findText('UI Benchmark on Lynx'),
    undefined,
    { timeout: 60_000, polling: 16 },
  );
  const firstScreen = await page.evaluate(
    () => performance.now() - globalThis.__x.viewAttachTime,
  );
  return { page, cdp, errors, firstScreen };
}

async function runScenarioLoad(browser, mode) {
  const { page, cdp, errors, firstScreen } = await loadApp(browser, mode);
  const driver = new Driver(page);
  const memory = [];

  const mem = async (phase) =>
    memory.push({
      phase,
      pageHeap: await samplePageHeap(cdp),
      workerHeaps: await sampleWorkerHeaps(page),
    });

  await mem('mounted');

  // Run the scenario, then sample memory at the same points as run.mjs.
  const samples = [];

  try {
    samples.push(...(await runScenario(driver)));
    // memory after a final 10k build / clear, matching the vdom-vs-vapor run
    await driver.clickButton('Create 10,000 rows');
    await driver.until({ type: 'rowCount', value: 10000 });
    await driver.settle();
    await mem('after10k');
    await driver.clickButton('Clear');
    await driver.until({ type: 'rowCount', value: 0 });
    await driver.settle();
    await mem('afterClear');
  } finally {
    await page.close();
  }
  return { mode, samples, memory, firstScreen, errors };
}

async function runStartupLoad(browser, mode) {
  const { page, firstScreen } = await loadApp(browser, mode);
  await page.close();
  return firstScreen;
}

/**
 * Cold single-shot pass: a FRESH app per sample, one measured create1k and
 * one measured create10k, no warmup, no prior operations. Separates the
 * intrinsic cost of an operation from degradation accumulated over a long
 * scenario (frameworks that leak or accumulate per-op state look much worse
 * in the sustained scenario than here).
 */
async function runFreshLoad(browser, mode) {
  const { page } = await loadApp(browser, mode);
  const driver = new Driver(page);
  try {
    await driver.settle();
    const create1k = await driver.create1k();
    await driver.settle();
    await driver.clearTo();
    const create10k = await driver.measureButton('Create 10,000 rows', {
      type: 'rowCount',
      value: 10000,
    });
    return { create1k, create10k };
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// storms suite: update-heavy scenarios where sub-frame update costs become
// user-observable. Fresh app per (mode, table size, rep):
//   - one-shot update10th / select while 1k or 10k rows are mounted
//     (a 10k-row table makes vdom's full-list diff span multiple frames)
//   - update storm ×50 / select storm ×100: one click triggers N sequential
//     state→render→cross-thread→DOM ticks in the app; total wall time to
//     the final DOM state amplifies per-tick cost N× above the frame floor
// ---------------------------------------------------------------------------

const STORM_TIMEOUT_MS = 240000;

const STORM_SIZES = {
  '1k': { button: 'Create 1,000 rows', rows: 1000 },
  '10k': { button: 'Create 10,000 rows', rows: 10000 },
};

async function runStormRep(browser, mode, sizeKey) {
  const size = STORM_SIZES[sizeKey];
  const { page, errors } = await loadApp(browser, mode);
  const driver = new Driver(page);
  const samples = [];
  const record = (op, ms) => samples.push({ op: `${op}@${sizeKey}`, ms });

  try {
    await driver.settle();
    await driver.clickButton(size.button);
    await driver.until({ type: 'rowCount', value: size.rows });
    await driver.settle();

    // one-shot update10th ×3
    for (let i = 0; i < 3; i++) {
      const before = await driver.labelAt(0);
      record(
        'update10th',
        await driver.measureButton('Update every 10th row', {
          type: 'labelAt',
          index: 0,
          equals: `${before} !!!`,
        }),
      );
      await driver.settle();
    }

    // one-shot select ×3 (cycle near-top rows)
    for (let i = 0; i < 3; i++) {
      const idx = i + 1;
      record(
        'select',
        await driver.measureCell(idx, 'col-label', { type: 'dangerAt', index: idx }),
      );
      await driver.settle();
    }

    // Storms can legitimately fail to finish within the timeout (a framework
    // whose per-op cost degrades superlinearly never completes 50 ticks on a
    // big table). Record that as a DNF sample and abort the rep — the app's
    // state is undefined mid-storm, so later measures would be meaningless.
    const dnf = (op) => samples.push({ op: `${op}@${sizeKey}`, ms: null, dnf: true });

    // update storm ×2 (50 ticks) — ends with every 10th label = "bench 50"
    for (let i = 0; i < 2; i++) {
      try {
        record(
          'updateStorm',
          await driver.measureButton('Update storm', {
            type: 'labelAt',
            index: 0,
            equals: 'bench 50',
          }, STORM_TIMEOUT_MS),
        );
      } catch (err) {
        if (!String(err).includes('predicate timeout')) throw err;
        dnf('updateStorm');
        return { samples, errors };
      }
      await driver.settle();
      // perturb labels so the next storm's end state differs from the start
      const before = await driver.labelAt(0);
      await driver.clickButton('Update every 10th row');
      await driver.until({ type: 'labelAt', index: 0, equals: `${before} !!!` });
      await driver.settle();
    }

    // select storm ×2 (30 ticks) — ends selecting row 0
    for (let i = 0; i < 2; i++) {
      try {
        record(
          'selectStorm',
          await driver.measureButton('Select storm', {
            type: 'dangerAt',
            index: 0,
          }, STORM_TIMEOUT_MS),
        );
      } catch (err) {
        if (!String(err).includes('predicate timeout')) throw err;
        dnf('selectStorm');
        return { samples, errors };
      }
      await driver.settle();
      // move selection off row 0 so the next storm's end state is observable
      await driver.clickCell(3, 'col-label');
      await driver.until({ type: 'dangerAt', index: 3 });
      await driver.settle();
    }
  } finally {
    await page.close();
  }
  return { samples, errors };
}

function stormMarkdownReport(result) {
  const { meta, perOp } = result;
  let md = `# Update-heavy black-box scenarios — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx\n\n`;
  md += `- date: ${meta.date}\n- git: ${meta.sha}\n- node: ${meta.node}, chromium (playwright-core ${meta.playwright})\n`;
  md += `- host: ${meta.cpus}× ${meta.cpuModel}\n`;
  md += `- versions: @lynx-js/react ${meta.reactLynxVersion}, vue ${meta.vueVersion}, @lynx-js/web-core ${meta.webCoreVersion}\n`;
  md += `- fresh app per (mode, size, rep); reps: ${meta.stormReps}; `;
  md += `one-shot ops ×3 and storms ×2 per rep\n`;
  md += `- storms: one click triggers N sequential state→render→DOM ticks `;
  md += `(update ×50, select ×30; one macrotask each); latency = pointerdown → final DOM state\n\n`;

  for (const sizeKey of Object.keys(STORM_SIZES)) {
    md += `## Table size: ${sizeKey} rows (ms, median ±CI95, lower is better)\n\n`;
    md += `| op | react | vdom | vapor | vdom/react | vapor/vdom |\n|---|---|---|---|---|---|\n`;
    const ratio = (a, b) =>
      a && b && b.median > 0 ? (a.median / b.median).toFixed(2) + '×' : 'n/a';
    const cell = (s) => {
      if (s?.median == null && s?.dnf) return `DNF ×${s.dnf} (>${STORM_TIMEOUT_MS / 1000}s)`;
      if (s?.median == null) return 'n/a';
      const base = `${fmt(s.median)} ±${fmt(s.ci95)}`;
      return s.dnf ? `${base} (+${s.dnf} DNF)` : base;
    };
    for (const op of ['update10th', 'select', 'updateStorm', 'selectStorm']) {
      const key = `${op}@${sizeKey}`;
      const r = perOp.react?.[key];
      const d = perOp.vdom?.[key];
      const p = perOp.vapor?.[key];
      md += `| ${op} | ${cell(r)} | ${cell(d)} | ${cell(p)} | ${ratio(d, r)} | ${ratio(p, d)} |\n`;
    }
    md += `\n`;
  }
  md += `Per-tick cost: divide storm medians by 50 (update) / 30 (select).\n`;
  return md;
}

async function runStormsSuite(browser) {
  const loads = { react: [], vdom: [], vapor: [] };
  for (const sizeKey of Object.keys(STORM_SIZES)) {
    for (let rep = 0; rep < STORM_REPS; rep++) {
      const order = MODES.map((_, k) => MODES[(k + rep) % MODES.length]);
      for (const mode of order) {
        console.log(`[storms] ${sizeKey} rep ${rep + 1}/${STORM_REPS} — ${mode}`);
        const { samples, errors } = await runStormRep(browser, mode, sizeKey);
        if (errors.length) {
          console.warn(`[storms] page errors (${mode}):`, errors.slice(0, 3));
        }
        for (const s of samples) console.log(`[storms]   ${s.op}: ${s.dnf ? 'DNF' : s.ms.toFixed(1) + 'ms'}`);
        loads[mode].push({ samples });
      }
    }
  }

  let sha = 'unknown';
  try {
    sha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
  } catch {}

  const result = {
    meta: {
      date: new Date().toISOString(),
      sha,
      node: process.version,
      playwright: require('playwright-core/package.json').version,
      reactLynxVersion:
        require(path.join(root, 'apps/ui-react/node_modules/@lynx-js/react/package.json')).version,
      vueVersion: require('vue/package.json').version,
      webCoreVersion: require('@lynx-js/web-core/package.json').version,
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model ?? 'unknown',
      stormReps: STORM_REPS,
    },
    perOp: Object.fromEntries(MODES.map((m) => [m, aggregate(loads[m])])),
    raw: loads,
  };

  const outDir = path.join(root, 'results');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'cross-storms-latest.json'),
    JSON.stringify(result, null, 2),
  );
  const md = stormMarkdownReport(result);
  fs.writeFileSync(path.join(outDir, 'cross-storms-latest.md'), md);
  console.log('\n' + md);
  console.log('[storms] wrote results/cross-storms-latest.{json,md}');
}

// ---------------------------------------------------------------------------
// smoke mode: load each app, click Create once, verify and screenshot
// ---------------------------------------------------------------------------

async function smoke(browser) {
  for (const mode of MODES) {
    const { page, errors } = await loadApp(browser, mode);
    const driver = new Driver(page);
    const ms = await driver.create1k();
    const count = await driver.rowCount();
    const label0 = await driver.labelAt(0);
    await driver.measureCell(1, 'col-label', { type: 'dangerAt', index: 1 });
    const shot = path.join(root, `results/smoke-${mode}.png`);
    await page.screenshot({ path: shot });
    console.log(
      `[smoke] ${mode}: create1k=${ms.toFixed(1)}ms rows=${count} label0="${label0}" select=ok errors=${errors.length}`,
    );
    if (errors.length) console.log(`[smoke]   errors:`, errors.slice(0, 3));
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// statistics + report
// ---------------------------------------------------------------------------

function stats(values) {
  const clean = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = n % 2
    ? sorted[(n - 1) / 2]
    : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const std = Math.sqrt(
    sorted.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / n,
  );
  return { n, min: sorted[0], max: sorted[n - 1], mean, median, std, ci95: 1.96 * (std / Math.sqrt(n)) };
}

function aggregate(loads) {
  const byOp = {};
  const dnfByOp = {};
  for (const load of loads) {
    for (const s of load.samples) {
      if (s.dnf) dnfByOp[s.op] = (dnfByOp[s.op] ?? 0) + 1;
      else (byOp[s.op] ??= []).push(s.ms);
    }
  }
  const out = Object.fromEntries(
    Object.entries(byOp).map(([op, arr]) => [op, stats(arr)]),
  );
  for (const [op, n] of Object.entries(dnfByOp)) {
    out[op] = { ...(out[op] ?? {}), dnf: n };
  }
  return out;
}

/**
 * Within-load drift: median(last 3 samples) / median(first 3 samples),
 * averaged across loads. ~1.0 = stable per-op cost over the scenario;
 * >1 = the framework slows down as operations accumulate.
 */
function drift(loads, op) {
  const ratios = [];
  for (const load of loads) {
    const arr = load.samples.filter((s) => s.op === op).map((s) => s.ms);
    if (arr.length < 6) continue;
    const first = stats(arr.slice(0, 3)).median;
    const last = stats(arr.slice(-3)).median;
    if (first > 0) ratios.push(last / first);
  }
  return ratios.length ? stats(ratios).mean : null;
}

const fmt = (x, digits = 1) => (x == null ? 'n/a' : x.toFixed(digits));

function markdownReport(result) {
  const { meta, perOp, startup, memory, bundles, fresh, driftByOp } = result;
  const ops = [
    'create1k', 'update10th', 'select', 'swap', 'remove',
    'append1k', 'create10k', 'clear10k',
  ].filter((op) => MODES.some((m) => perOp[m]?.[op]));

  let md = `# Cross-framework black-box benchmark — ReactLynx vs Vue VDOM vs Vue Vapor on Lynx\n\n`;
  md += `- date: ${meta.date}\n- git: ${meta.sha}\n- node: ${meta.node}, chromium (playwright-core ${meta.playwright})\n`;
  md += `- host: ${meta.cpus}× ${meta.cpuModel}\n`;
  md += `- versions: @lynx-js/react ${meta.reactLynxVersion}, vue ${meta.vueVersion}, @lynx-js/web-core ${meta.webCoreVersion}\n`;
  md += `- loads per mode: ${meta.loads}; samples per op per load: ${meta.count} (heavy: ${meta.heavyCount})\n`;
  md += `- method: real clicks → composed-DOM end-state polled per animation frame; `;
  md += `latency = pointerdown → first frame at end state (resolution ≈ one frame, ~17 ms)\n\n`;

  md += `## Interaction latency (ms, median ±CI95, lower is better)\n\n`;
  md += `| op | react | vdom | vapor | vdom/react | vapor/react | vapor/vdom |\n|---|---|---|---|---|---|---|\n`;
  const ratio = (a, b) =>
    a && b && b.median > 0 ? (a.median / b.median).toFixed(2) + '×' : 'n/a';
  for (const op of ops) {
    const r = perOp.react?.[op];
    const d = perOp.vdom?.[op];
    const p = perOp.vapor?.[op];
    md += `| ${op} | ${fmt(r?.median)} ±${fmt(r?.ci95)} | ${fmt(d?.median)} ±${
      fmt(d?.ci95)
    } | ${fmt(p?.median)} ±${fmt(p?.ci95)} | ${ratio(d, r)} | ${ratio(p, r)} | ${ratio(p, d)} |\n`;
  }

  if (fresh) {
    md += `\n## Cold single-shot latency (FRESH app per sample — no prior operations, ms)\n\n`;
    md += `Separates intrinsic op cost from degradation accumulated over the sustained scenario above.\n\n`;
    md += `| op | react | vdom | vapor |\n|---|---|---|---|\n`;
    for (const op of ['create1k', 'create10k']) {
      const cell = (m) => {
        const s = fresh[m]?.[op];
        return s ? `${fmt(s.median)} ±${fmt(s.ci95)}` : 'n/a';
      };
      md += `| ${op} | ${cell('react')} | ${cell('vdom')} | ${cell('vapor')} |\n`;
    }

    md += `\n## Within-scenario drift (median of last 3 samples ÷ first 3; ~1.0 = stable)\n\n`;
    md += `| op | react | vdom | vapor |\n|---|---|---|---|\n`;
    for (const op of ops) {
      const cell = (m) => {
        const v = driftByOp?.[m]?.[op];
        return v == null ? 'n/a' : `${v.toFixed(2)}×`;
      };
      md += `| ${op} | ${cell('react')} | ${cell('vdom')} | ${cell('vapor')} |\n`;
    }
  }

  md += `\n## Startup (first screen: lynx-view attach → first content, ms)\n\n`;
  md += `| mode | median | mean | std | n |\n|---|---|---|---|---|\n`;
  for (const mode of MODES) {
    const s = startup[mode];
    md += `| ${mode} | ${fmt(s?.median)} | ${fmt(s?.mean)} | ${fmt(s?.std)} | ${s?.n ?? 0} |\n`;
  }

  md += `\n## Memory (JS heap, MB — indicative, no forced GC)\n\n`;
  md += `| phase | react page | vdom page | vapor page |\n|---|---|---|---|\n`;
  const mb = (x) => (x == null ? 'n/a' : (x / 1048576).toFixed(1));
  for (const phase of ['mounted', 'after10k', 'afterClear']) {
    const cell = (mode) => {
      const vals = memory[mode]
        .filter((m) => m.phase === phase)
        .map((m) => m.pageHeap)
        .filter((v) => v != null);
      return vals.length ? mb(stats(vals).median) : 'n/a';
    };
    md += `| ${phase} | ${cell('react')} | ${cell('vdom')} | ${cell('vapor')} |\n`;
  }

  md += `\n## Bundle size (bytes)\n\n`;
  md += `| bundle | react raw | react gzip | vdom raw | vdom gzip | vapor raw | vapor gzip |\n|---|---|---|---|---|---|---|\n`;
  for (const file of ['main.lynx.bundle', 'main.web.bundle']) {
    const cell = (mode) => {
      const b = bundles[APP_DIR[mode]]?.[file];
      return `${b?.raw ?? 'n/a'} | ${b?.gzip ?? 'n/a'}`;
    };
    md += `| ${file} | ${cell('react')} | ${cell('vdom')} | ${cell('vapor')} |\n`;
  }
  return md;
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

function buildAll() {
  buildApps({ apps: ['ui-vdom', 'ui-vapor'] });
  const cwd = path.join(root, 'apps/ui-react');
  fs.rmSync(path.join(cwd, 'dist'), { recursive: true, force: true });
  console.log('[bench] building apps/ui-react (production)…');
  execSync('npx rspeedy build', {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  if (!args['skip-build']) buildAll();

  const server = await startServer();
  const browser = await launchBrowser();

  try {
    if (args.smoke) {
      fs.mkdirSync(path.join(root, 'results'), { recursive: true });
      await smoke(browser);
      return;
    }

    if (args.storms) {
      await runStormsSuite(browser);
      return;
    }

    const loads = { react: [], vdom: [], vapor: [] };
    const startupSamples = { react: [], vdom: [], vapor: [] };

    // Rotate mode order across loads to spread thermal / JIT drift fairly.
    for (let i = 0; i < LOADS; i++) {
      const order = MODES.map((_, k) => MODES[(k + i) % MODES.length]);
      for (const mode of order) {
        console.log(`[bench] scenario load ${i + 1}/${LOADS} — ${mode}`);
        const load = await runScenarioLoad(browser, mode);
        if (load.errors.length) {
          console.warn(`[bench] page errors (${mode}):`, load.errors.slice(0, 3));
        }
        console.log(
          `[bench]   ${load.samples.length} samples, firstScreen ${load.firstScreen.toFixed(1)}ms`,
        );
        loads[mode].push(load);
        startupSamples[mode].push(load.firstScreen);
      }
    }

    for (let i = 0; i < STARTUP_COUNT; i++) {
      for (const mode of MODES) {
        const t = await runStartupLoad(browser, mode);
        startupSamples[mode].push(t);
        console.log(`[bench] startup ${mode}: ${t.toFixed(1)}ms`);
      }
    }

    const freshSamples = { react: [], vdom: [], vapor: [] };
    for (let i = 0; i < FRESH_COUNT; i++) {
      const order = MODES.map((_, k) => MODES[(k + i) % MODES.length]);
      for (const mode of order) {
        const f = await runFreshLoad(browser, mode);
        freshSamples[mode].push(f);
        console.log(
          `[bench] fresh ${mode}: create1k ${f.create1k.toFixed(1)}ms, create10k ${f.create10k.toFixed(1)}ms`,
        );
      }
    }

    let sha = 'unknown';
    try {
      sha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
    } catch {}

    const result = {
      meta: {
        date: new Date().toISOString(),
        sha,
        node: process.version,
        playwright: require('playwright-core/package.json').version,
        reactLynxVersion:
          require(path.join(root, 'apps/ui-react/node_modules/@lynx-js/react/package.json')).version,
        vueVersion: require('vue/package.json').version,
        webCoreVersion: require('@lynx-js/web-core/package.json').version,
        cpus: os.cpus().length,
        cpuModel: os.cpus()[0]?.model ?? 'unknown',
        loads: LOADS,
        count: COUNT,
        heavyCount: HEAVY_COUNT,
        freshCount: FRESH_COUNT,
      },
      perOp: Object.fromEntries(MODES.map((m) => [m, aggregate(loads[m])])),
      fresh: Object.fromEntries(
        MODES.map((m) => [
          m,
          {
            create1k: stats(freshSamples[m].map((f) => f.create1k)),
            create10k: stats(freshSamples[m].map((f) => f.create10k)),
          },
        ]),
      ),
      driftByOp: Object.fromEntries(
        MODES.map((m) => [
          m,
          Object.fromEntries(
            [
              'create1k', 'update10th', 'select', 'swap', 'remove',
              'append1k', 'create10k', 'clear10k',
            ].map((op) => [op, drift(loads[m], op)]),
          ),
        ]),
      ),
      startup: Object.fromEntries(MODES.map((m) => [m, stats(startupSamples[m])])),
      memory: Object.fromEntries(
        MODES.map((m) => [m, loads[m].flatMap((l) => l.memory)]),
      ),
      bundles: bundleSizes(Object.values(APP_DIR)),
      raw: loads,
    };

    const outDir = path.join(root, 'results');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'cross-latest.json'),
      JSON.stringify(result, null, 2),
    );
    const md = markdownReport(result);
    fs.writeFileSync(path.join(outDir, 'cross-latest.md'), md);
    console.log('\n' + md);
    console.log('[bench] wrote results/cross-latest.json + results/cross-latest.md');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
