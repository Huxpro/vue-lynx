// VDOM vs Vapor benchmark harness.
//
// Serves the two built apps plus the Lynx-for-Web runtime, loads each app's
// .web.bundle into a <lynx-view> in headless Chromium (Playwright), and
// collects:
//   - per-operation samples streamed by the in-app scenario
//     (__BENCH__ console lines; bg / e2e ms, flushes / ops / bytes)
//   - first-screen time (lynx-view attach → first content text visible)
//   - JS heap at scenario memory markers (page + BG worker, best effort)
//   - bundle sizes
//
// Usage: node harness/run.mjs [--loads 2] [--startup-count 3] [--skip-build]
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
    'startup-count': { type: 'string', default: '3' },
    'skip-build': { type: 'boolean', default: false },
    headed: { type: 'boolean', default: false },
    port: { type: 'string', default: '8317' },
  },
});
const LOADS = Number(args.loads);
const STARTUP_COUNT = Number(args['startup-count']);
const PORT = Number(args.port);

// ---------------------------------------------------------------------------
// static server
// ---------------------------------------------------------------------------

const webCoreClientJs = require.resolve('@lynx-js/web-core/client.prod.js');
// …/dist/client_prod/static/js/client.js → …/dist/client_prod
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
  globalThis.__benchCreateView = (bundleUrl) => {
    const view = document.createElement('lynx-view');
    view.setAttribute('url', bundleUrl);
    view.style.cssText = 'display:block;width:800px;height:640px;';
    globalThis.__viewAttachTime = performance.now();
    document.body.appendChild(view);
    return true;
  };
  globalThis.__benchFindText = (needle) => {
    const walk = (node) => {
      if (!node) return false;
      if (node.nodeType === 3 && node.textContent.includes(needle)) return true;
      if (node.shadowRoot && walk(node.shadowRoot)) return true;
      const children = node.childNodes || [];
      for (const child of children) if (walk(child)) return true;
      return false;
    };
    return walk(document.body);
  };
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
    } else if (url.pathname.startsWith('/vdom/')) {
      filePath = path.join(root, 'apps/vdom/dist', url.pathname.slice(6));
    } else if (url.pathname.startsWith('/vapor/')) {
      filePath = path.join(root, 'apps/vapor/dist', url.pathname.slice(7));
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
  const { resolveChromium } = await import('./chromium.mjs');
  return chromium.launch({
    headless: !args.headed,
    executablePath: resolveChromium(),
    args: [
      '--enable-precise-memory-info',
      '--js-flags=--expose-gc',
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
      const used = await worker.evaluate(
        () => globalThis.performance?.memory?.usedJSHeapSize ?? null,
      );
      out.push(used);
    } catch {
      out.push(null);
    }
  }
  return out;
}

/**
 * Load one app, run the full in-app scenario, collect samples + memory +
 * first-screen time.
 */
async function runScenarioLoad(browser, mode) {
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable').catch(() => {});

  const samples = [];
  const memory = [];
  let doneResult = null;
  let doneResolve;
  const donePromise = new Promise((resolve) => (doneResolve = resolve));

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.startsWith('__BENCH__')) {
      try {
        samples.push(JSON.parse(text.slice('__BENCH__'.length)));
      } catch {}
    } else if (text.startsWith('__BENCH_MEM__')) {
      const phase = text.slice('__BENCH_MEM__'.length);
      void (async () => {
        memory.push({
          phase,
          pageHeap: await samplePageHeap(cdp),
          workerHeaps: await sampleWorkerHeaps(page),
        });
      })();
    } else if (text.startsWith('__BENCH_DONE__')) {
      try {
        doneResult = JSON.parse(text.slice('__BENCH_DONE__'.length));
      } catch {}
      doneResolve();
    }
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto(`http://127.0.0.1:${PORT}/bench.html`, {
    waitUntil: 'load',
  });
  await page.evaluate(
    (url) => globalThis.__benchCreateView(url),
    `http://127.0.0.1:${PORT}/${mode}/main.web.bundle`,
  );

  // first screen: attach → title text visible
  await page.waitForFunction(
    () => globalThis.__benchFindText('Benchmark on Lynx'),
    undefined,
    { timeout: 60_000, polling: 16 },
  );
  const firstScreen = await page.evaluate(
    () => performance.now() - globalThis.__viewAttachTime,
  );

  await Promise.race([
    donePromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`scenario timeout (${mode})`)), 600_000)
    ),
  ]);

  await page.close();
  return { mode, samples, memory, firstScreen, errors, doneResult };
}

/** Startup-only load: measure attach → first content, then bail. */
async function runStartupLoad(browser, mode) {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/bench.html`, { waitUntil: 'load' });
  await page.evaluate(
    (url) => globalThis.__benchCreateView(url),
    `http://127.0.0.1:${PORT}/${mode}/main.web.bundle`,
  );
  await page.waitForFunction(
    () => globalThis.__benchFindText('Benchmark on Lynx'),
    undefined,
    { timeout: 60_000, polling: 16 },
  );
  const firstScreen = await page.evaluate(
    () => performance.now() - globalThis.__viewAttachTime,
  );
  await page.close();
  return firstScreen;
}

// ---------------------------------------------------------------------------
// statistics
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
    sorted.map((x) => (x - mean) ** 2).reduce((a, b) => a + b, 0) / n,
  );
  const ci95 = 1.96 * (std / Math.sqrt(n));
  return {
    n,
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median,
    std,
    ci95,
  };
}

function aggregate(loads) {
  const byOp = {};
  for (const load of loads) {
    for (const sample of load.samples) {
      const bucket = (byOp[sample.op] ??= {
        bg: [],
        e2e: [],
        ops: [],
        bytes: [],
        flushes: [],
      });
      bucket.bg.push(sample.bg);
      bucket.e2e.push(sample.e2e);
      bucket.ops.push(sample.ops);
      bucket.bytes.push(sample.bytes);
      bucket.flushes.push(sample.flushes);
    }
  }
  const out = {};
  for (const [op, bucket] of Object.entries(byOp)) {
    out[op] = {
      bg: stats(bucket.bg),
      e2e: stats(bucket.e2e),
      ops: stats(bucket.ops),
      bytes: stats(bucket.bytes),
      flushes: stats(bucket.flushes),
    };
  }
  return out;
}

const fmt = (x, digits = 2) => (x == null ? 'n/a' : x.toFixed(digits));

function markdownReport(result) {
  const { meta, perOp, startup, memory, bundles } = result;
  const ops = Object.keys(perOp.vdom ?? {});
  let md = `# VDOM vs Vapor on Lynx — benchmark results\n\n`;
  md += `- date: ${meta.date}\n- git: ${meta.sha}\n- node: ${meta.node}, chromium (playwright-core ${meta.playwright})\n`;
  md += `- host: ${meta.cpus}× ${meta.cpuModel}\n`;
  md += `- scenario loads per mode: ${meta.loads}; in-app samples per op per load: 10 (heavy ops: 5)\n\n`;

  md += `## Interaction operations (ms, lower is better)\n\n`;
  md += `bg = Background-Thread cost (reactivity + render + ops serialization). `;
  md += `e2e = bg + cross-thread transfer + Main-Thread applyOps (DOM applied).\n\n`;
  md += `| op | vdom bg median | vapor bg median | Δbg | vdom e2e median | vapor e2e median | Δe2e |\n|---|---|---|---|---|---|---|\n`;
  for (const op of ops) {
    const v = perOp.vdom[op];
    const p = perOp.vapor[op];
    const ratio = (a, b) =>
      a && b && b.median > 0
        ? `${(a.median / b.median).toFixed(2)}× vdom/vapor`
        : 'n/a';
    md += `| ${op} | ${fmt(v?.bg?.median)} ±${fmt(v?.bg?.ci95)} | ${
      fmt(p?.bg?.median)
    } ±${fmt(p?.bg?.ci95)} | ${ratio(v?.bg, p?.bg)} | ${
      fmt(v?.e2e?.median)
    } ±${fmt(v?.e2e?.ci95)} | ${fmt(p?.e2e?.median)} ±${
      fmt(p?.e2e?.ci95)
    } | ${ratio(v?.e2e, p?.e2e)} |\n`;
  }

  md += `\n## Ops-stream shape (median per operation)\n\n`;
  md += `| op | vdom ops | vapor ops | vdom bytes | vapor bytes |\n|---|---|---|---|---|\n`;
  for (const op of ops) {
    const v = perOp.vdom[op];
    const p = perOp.vapor[op];
    md += `| ${op} | ${fmt(v?.ops?.median, 0)} | ${fmt(p?.ops?.median, 0)} | ${
      fmt(v?.bytes?.median, 0)
    } | ${fmt(p?.bytes?.median, 0)} |\n`;
  }

  md += `\n## Startup (first screen: lynx-view attach → first content, ms)\n\n`;
  md += `| mode | median | mean | std | n |\n|---|---|---|---|---|\n`;
  for (const mode of ['vdom', 'vapor']) {
    const s = startup[mode];
    md += `| ${mode} | ${fmt(s?.median)} | ${fmt(s?.mean)} | ${fmt(s?.std)} | ${s?.n ?? 0} |\n`;
  }

  md += `\n## Memory (JS heap, MB — indicative, no forced GC)\n\n`;
  md += `| phase | vdom page | vdom worker | vapor page | vapor worker |\n|---|---|---|---|---|\n`;
  const phases = ['mounted', 'after10k', 'afterClear'];
  const mb = (x) => (x == null ? 'n/a' : (x / 1048576).toFixed(1));
  for (const phase of phases) {
    const cell = (mode, key) => {
      const entries = memory[mode].filter((m) => m.phase === phase);
      if (entries.length === 0) return 'n/a';
      const vals = entries
        .map((m) =>
          key === 'page'
            ? m.pageHeap
            : m.workerHeaps?.find((w) => w != null) ?? null
        )
        .filter((x) => x != null);
      return vals.length ? mb(stats(vals).median) : 'n/a';
    };
    md += `| ${phase} | ${cell('vdom', 'page')} | ${cell('vdom', 'worker')} | ${
      cell('vapor', 'page')
    } | ${cell('vapor', 'worker')} |\n`;
  }

  md += `\n## Bundle size (bytes)\n\n`;
  md += `| bundle | vdom raw | vdom gzip | vapor raw | vapor gzip |\n|---|---|---|---|---|\n`;
  for (const file of ['main.lynx.bundle', 'main.web.bundle']) {
    md += `| ${file} | ${bundles.vdom?.[file]?.raw ?? 'n/a'} | ${
      bundles.vdom?.[file]?.gzip ?? 'n/a'
    } | ${bundles.vapor?.[file]?.raw ?? 'n/a'} | ${
      bundles.vapor?.[file]?.gzip ?? 'n/a'
    } |\n`;
  }
  return md;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  if (!args['skip-build']) buildApps();

  const server = await startServer();
  const browser = await launchBrowser();

  const loads = { vdom: [], vapor: [] };
  const startupSamples = { vdom: [], vapor: [] };

  try {
    // Alternate modes across loads to spread thermal / JIT drift fairly.
    for (let i = 0; i < LOADS; i++) {
      for (const mode of i % 2 === 0 ? ['vdom', 'vapor'] : ['vapor', 'vdom']) {
        console.log(`[bench] scenario load ${i + 1}/${LOADS} — ${mode}`);
        const load = await runScenarioLoad(browser, mode);
        if (load.errors.length) {
          console.warn(`[bench] page errors (${mode}):`, load.errors.slice(0, 3));
        }
        console.log(
          `[bench]   ${load.samples.length} samples, firstScreen ${
            load.firstScreen.toFixed(1)
          }ms`,
        );
        loads[mode].push(load);
        startupSamples[mode].push(load.firstScreen);
      }
    }

    for (let i = 0; i < STARTUP_COUNT; i++) {
      for (const mode of ['vdom', 'vapor']) {
        const t = await runStartupLoad(browser, mode);
        startupSamples[mode].push(t);
        console.log(`[bench] startup ${mode}: ${t.toFixed(1)}ms`);
      }
    }
  } finally {
    await browser.close();
    server.close();
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
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model ?? 'unknown',
      loads: LOADS,
    },
    perOp: {
      vdom: aggregate(loads.vdom),
      vapor: aggregate(loads.vapor),
    },
    startup: {
      vdom: stats(startupSamples.vdom),
      vapor: stats(startupSamples.vapor),
    },
    memory: {
      vdom: loads.vdom.flatMap((l) => l.memory),
      vapor: loads.vapor.flatMap((l) => l.memory),
    },
    bundles: bundleSizes(),
    raw: loads,
  };

  const outDir = path.join(root, 'results');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'latest.json'),
    JSON.stringify(result, null, 2),
  );
  const md = markdownReport(result);
  fs.writeFileSync(path.join(outDir, 'latest.md'), md);
  console.log('\n' + md);
  console.log(`[bench] wrote results/latest.json + results/latest.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
