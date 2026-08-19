// Wire-bytes counter for the create path (#337 `+b:c` / #338 `+b!`).
//
// Loads the INSTRUMENTED vapor app (apps/vapor) built in three delivery /
// staging cells — off (runtime REGISTER_TREE), bundle (`+b!`), code
// (`+b:c`) — and reports the serialized ops-buffer bytes and op counts per
// operation from the in-app `__VUE_LYNX_FLUSH_HOOK__` instrumentation
// (shared/bench-core.ts). Bytes are deterministic per workload, so one
// scenario load per cell suffices; bg/e2e timings ride along as context.
//
// Usage: node harness/wire-bytes.mjs [--skip-build] [--port 8321]
//   → results/wire-bytes-latest.{json,md}

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { generateVaporApp } from './build.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    'skip-build': { type: 'boolean', default: false },
    port: { type: 'string', default: '8321' },
  },
});
const PORT = Number(args.port);

const CELLS = [
  { id: 'vapor', cell: 'off', dist: 'apps/vapor/dist' },
  { id: 'vapor-bang', cell: 'bundle', dist: 'apps/vapor/dist-bundle' },
  { id: 'vapor-code', cell: 'code', dist: 'apps/vapor/dist-code' },
];

function build() {
  generateVaporApp();
  const cwd = path.join(root, 'apps/vapor');
  for (const c of CELLS) {
    fs.rmSync(path.join(cwd, 'node_modules/.cache'), {
      recursive: true,
      force: true,
    });
    const distName = c.cell === 'off' ? 'dist' : `dist-${c.cell}`;
    fs.rmSync(path.join(cwd, distName), { recursive: true, force: true });
    console.log(`[wire-bytes] building apps/vapor BENCH_CELL=${c.cell}`);
    execSync('npx rspeedy build', {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'production', BENCH_CELL: c.cell },
    });
  }
}

const webCoreClientJs = require.resolve('@lynx-js/web-core/client.prod.js');
const webCoreRoot = path.resolve(path.dirname(webCoreClientJs), '../..');

const MIME = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.bundle': 'application/octet-stream',
  '.wasm': 'application/wasm',
};

const BENCH_HTML = `<!doctype html><html><head><meta charset="utf-8">
<script type="module" src="/webcore/static/js/client.js"></script>
<link rel="stylesheet" href="/webcore/static/css/client.css">
</head><body><script>
globalThis.__benchCreateView = (u) => {
  const v = document.createElement('lynx-view');
  v.setAttribute('url', u);
  v.style.cssText = 'display:block;width:800px;height:640px;';
  document.body.appendChild(v);
  return true;
};
</script></body></html>`;

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
      for (const c of CELLS) {
        const prefix = `/${c.id}/`;
        if (url.pathname.startsWith(prefix)) {
          filePath = path.join(root, c.dist, url.pathname.slice(prefix.length));
          break;
        }
      }
    }
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404);
      res.end('not found');
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

async function runCell(browser, cell) {
  const page = await browser.newPage();
  const samples = [];
  let resolveDone;
  const done = new Promise((r) => (resolveDone = r));
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.startsWith('__BENCH__')) {
      try {
        samples.push(JSON.parse(text.slice('__BENCH__'.length)));
      } catch {}
    } else if (text.startsWith('__BENCH_DONE__')) resolveDone();
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto(`http://127.0.0.1:${PORT}/bench.html`, { waitUntil: 'load' });
  await page.evaluate(
    (u) => globalThis.__benchCreateView(u),
    `http://127.0.0.1:${PORT}/${cell.id}/main.web.bundle`,
  );
  await Promise.race([
    done,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${cell.id}`)), 600_000)
    ),
  ]);
  await page.close();
  if (errors.length) console.warn(`[wire-bytes] ${cell.id} errors:`, errors.slice(0, 3));
  return samples;
}

function median(values) {
  const s = values.filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}

async function main() {
  if (!args['skip-build']) build();
  const server = await startServer();
  const { chromium } = require('playwright-core');
  const { resolveChromium } = await import('./chromium.mjs');
  const browser = await chromium.launch({
    headless: true,
    executablePath: resolveChromium(),
  });

  const perCell = {};
  try {
    for (const cell of CELLS) {
      console.log(`[wire-bytes] scenario — ${cell.id}`);
      const samples = await runCell(browser, cell);
      const byOp = {};
      for (const s of samples) {
        (byOp[s.op] ??= { bytes: [], ops: [], bg: [], e2e: [] });
        byOp[s.op].bytes.push(s.bytes);
        byOp[s.op].ops.push(s.ops);
        byOp[s.op].bg.push(s.bg);
        byOp[s.op].e2e.push(s.e2e);
      }
      perCell[cell.id] = Object.fromEntries(
        Object.entries(byOp).map(([op, b]) => [op, {
          bytes: median(b.bytes),
          ops: median(b.ops),
          bg: median(b.bg),
          e2e: median(b.e2e),
        }]),
      );
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
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model ?? 'unknown',
      note:
        'Serialized vuePatchUpdate buffer bytes per op (BG flush hook), '
        + 'instrumented vapor app; cells: off=runtime REGISTER_TREE, '
        + 'bundle=+b! (REGISTER_TREE_BUNDLE hash only), code=+b:c '
        + '(INSTANTIATE_TEMPLATE only).',
    },
    perCell,
  };
  fs.mkdirSync(path.join(root, 'results'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'results/wire-bytes-latest.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  );

  const ops = Object.keys(perCell.vapor ?? {});
  let md = '# Create-path wire bytes — vapor delivery/staging cells (#337/#338)\n\n';
  md += `- date: ${result.meta.date}; git: ${sha}; host: ${result.meta.cpus}× ${result.meta.cpuModel}\n`;
  md += `- ${result.meta.note}\n\n`;
  md += '| op | vapor bytes | +b! bytes | +b:c bytes | vapor ops | +b! ops | +b:c ops |\n|---|--:|--:|--:|--:|--:|--:|\n';
  for (const op of ops) {
    const c = (id, k) => perCell[id]?.[op]?.[k] ?? 'n/a';
    md += `| ${op} | ${c('vapor', 'bytes')} | ${c('vapor-bang', 'bytes')} | ${c('vapor-code', 'bytes')} | ${c('vapor', 'ops')} | ${c('vapor-bang', 'ops')} | ${c('vapor-code', 'ops')} |\n`;
  }
  fs.writeFileSync(path.join(root, 'results/wire-bytes-latest.md'), md);
  console.log(`\n${md}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
