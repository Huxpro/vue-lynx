/**
 * Real-browser FCP experiment driver (Lynx for Web = genuinely dual-threaded:
 * the background runtime runs in a Web Worker; IPC is real postMessage).
 *
 *   node web-harness/run-browser.mjs <bundlesDir> [runsPerBundle=7] [cpuThrottle=1]
 *
 * Expects bundle files inside <bundlesDir>; measures every *.web.bundle
 * found there, plus the single-threaded plain-web baselines (vanilla Vue /
 * ReactLynx's preact fork rendering straight into the DOM, warm + cold —
 * see web-harness/plain/). Prints per-entry medians of:
 *   fcp     — lynx-view insertion → first painted content (≥5 elements)
 *   settled — content stopped changing (≈ full first screen + hydration)
 */

import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(_dirname, '../package.json'));
const { chromium } = require('playwright-core');

const bundlesDir = process.argv[2];
const RUNS = Number(process.argv[3] ?? 7);
const THROTTLE = Number(process.argv[4] ?? 1);
const PORT = 8321;

// Cold plain variants are pure concatenations — generate, don't commit.
for (const [fw, app, out] of [
  ['vue-framework.js', 'vue-app.js', 'vue-cold.js'],
  ['preact-framework.js', 'preact-app.js', 'preact-cold.js'],
]) {
  fs.writeFileSync(
    path.join(_dirname, 'plain', out),
    `${fs.readFileSync(path.join(_dirname, 'plain', fw), 'utf8')}\n;\n${
      fs.readFileSync(path.join(_dirname, 'plain', app), 'utf8')}`,
  );
}

const server = spawn(process.execPath, [
  path.join(_dirname, 'server.mjs'),
  String(PORT),
  bundlesDir,
], { stdio: 'pipe' });
await new Promise((r) => server.stdout.once('data', r));

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

function resolveChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }
  const candidates = [
    'ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null',
    'ls -d /home/ubuntu/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null',
    'ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null',
    'command -v google-chrome',
  ];
  for (const cmd of candidates) {
    try {
      const path = execFileSync('bash', ['-c', cmd], { encoding: 'utf8' })
        .trim()
        .split('\n')[0];
      if (path) return path;
    } catch {
      // try next
    }
  }
  throw new Error('No Chromium executable found for Playwright');
}

const browser = await chromium.launch({
  executablePath: resolveChromium(),
  headless: true,
});

const PLAIN = [
  // warm: framework preloaded before t0 (parity with web-core's client.js)
  { name: 'plain-vue', query: 'plain=vue-app.js&pre=vue-framework.js' },
  { name: 'plain-preact', query: 'plain=preact-app.js&pre=preact-framework.js' },
  // cold: framework+app fetched/parsed after t0 (parity with lynx bundles
  // carrying the framework runtime inside the .web.bundle)
  { name: 'plain-vue-cold', query: 'plain=vue-cold.js' },
  { name: 'plain-preact-cold', query: 'plain=preact-cold.js' },
];

const bundles = [
  ...fs.readdirSync(bundlesDir).filter((f) => f.endsWith('.web.bundle')).sort(),
  ...PLAIN.map((p) => p.name),
];
const results = [];

for (const bundle of bundles) {
  const plainEntry = PLAIN.find((p) => p.name === bundle);
  const fcps = [];
  const settleds = [];
  let finalCount = 0;
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    if (THROTTLE > 1) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
    }
    await page.goto(
      `http://127.0.0.1:${PORT}/?${plainEntry ? plainEntry.query : `bundle=${bundle}`}`,
    );
    await page.waitForFunction(() => window.__settled !== undefined, null, { timeout: 30000 });
    const r = await page.evaluate(() => ({
      fcp: window.__fcp,
      settled: window.__settled,
      finalCount: window.__finalCount,
    }));
    fcps.push(r.fcp);
    settleds.push(r.settled);
    finalCount = r.finalCount;
    await ctx.close();
  }
  const row = {
    bundle,
    fcpMedianMs: median(fcps),
    settledMedianMs: median(settleds),
    finalCount,
    fcps,
  };
  results.push(row);
  console.log(
    `${bundle.padEnd(28)} fcp ${row.fcpMedianMs.toFixed(1).padStart(8)}ms  settled ${
      row.settledMedianMs.toFixed(1).padStart(8)
    }ms  nodes ${String(finalCount).padStart(4)}  throttle×${THROTTLE}`,
  );
}

fs.writeFileSync(
  path.resolve(_dirname, `../results/browser-results${THROTTLE > 1 ? `-x${THROTTLE}` : ''}.json`),
  JSON.stringify(results, null, 2),
);

await browser.close();
server.kill();
