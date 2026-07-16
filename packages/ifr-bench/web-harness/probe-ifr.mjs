/**
 * Diagnostic probe: load one .web.bundle in the harness page, capture the
 * browser console, and sample the content element count on a fine timer so
 * the paint timeline (MT first paint vs BG hydration/replay) is visible.
 *
 *   node web-harness/probe-ifr.mjs <bundlesDir> <bundleFile>
 */

import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(_dirname, '../package.json'));
const { chromium } = require('playwright-core');

const bundlesDir = process.argv[2];
const bundleFile = process.argv[3];
const PORT = 8322;

const server = spawn(process.execPath, [
  path.join(_dirname, 'server.mjs'),
  String(PORT),
  bundlesDir,
], { stdio: 'pipe' });
await new Promise((r) => server.stdout.once('data', r));

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH
    ?? execFileSync('bash', ['-c', 'ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome'], { encoding: 'utf8' }).trim(),
  headless: true,
});

const ctx = await browser.newContext();
const page = await ctx.newPage();
const consoleLines = [];
page.on('console', (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => consoleLines.push(`[pageerror] ${err.message}`));

await page.addInitScript(() => {
  window.__timeline = [];
  const sample = () => {
    const view = document.querySelector('lynx-view');
    let n = 0;
    const walk = (node) => {
      if (!node) return;
      if (node.shadowRoot) walk(node.shadowRoot);
      for (const c of node.children ?? []) {
        const tag = c.tagName?.toLowerCase() ?? '';
        if (tag.startsWith('x-') || tag === 'image' || tag === 'view' || tag === 'text') n++;
        walk(c);
      }
    };
    walk(view);
    const last = window.__timeline[window.__timeline.length - 1];
    if (!last || last.n !== n) {
      window.__timeline.push({ t: performance.now(), n });
    }
    setTimeout(sample, 4);
  };
  setTimeout(sample, 4);
});

await page.goto(`http://127.0.0.1:${PORT}/?bundle=${bundleFile}`);
await page.waitForFunction(() => window.__settled !== undefined, null, { timeout: 30000 });
const result = await page.evaluate(() => ({
  fcp: window.__fcp,
  settled: window.__settled,
  finalCount: window.__finalCount,
  timeline: window.__timeline,
}));

console.log(`bundle: ${bundleFile}`);
console.log(`fcp=${result.fcp?.toFixed(1)}ms settled=${result.settled?.toFixed(1)}ms nodes=${result.finalCount}`);
console.log('content-count timeline (t ms → n elements):');
for (const { t, n } of result.timeline) console.log(`  ${t.toFixed(1).padStart(9)}  ${n}`);
console.log('console:');
for (const line of consoleLines) console.log(`  ${line}`);

await ctx.close();
await browser.close();
server.kill();
