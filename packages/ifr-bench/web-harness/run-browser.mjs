/**
 * Real-browser FCP experiment driver (Lynx for Web = genuinely dual-threaded:
 * the background runtime runs in a Web Worker; IPC is real postMessage).
 *
 *   node web-harness/run-browser.mjs <bundlesDir> [runsPerBundle=7] [cpuThrottle=1]
 *
 * Expects bundle files inside <bundlesDir>; measures every *.web.bundle
 * found there. Prints per-bundle medians of:
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

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH
    ?? execFileSync('bash', ['-c', 'ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome'], { encoding: 'utf8' }).trim(),
  headless: true,
});

const bundles = fs.readdirSync(bundlesDir).filter((f) => f.endsWith('.web.bundle')).sort();
const results = [];

for (const bundle of bundles) {
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
    await page.goto(`http://127.0.0.1:${PORT}/?bundle=${bundle}`);
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
