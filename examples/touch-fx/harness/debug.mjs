// One-touch debug run: full pageerror stacks + worker console.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HARNESS = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8977;

const server = spawn(process.execPath, [path.join(HARNESS, 'serve.mjs')], {
  stdio: 'pipe',
  env: { ...process.env, PORT: String(PORT) },
});
await new Promise((r) => server.stdout.once('data', r));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
});
const page = await ctx.newPage();
page.on('pageerror', (err) => console.log('[pageerror]', err.stack ?? String(err)));
page.on('console', (msg) => console.log(`[console.${msg.type()}]`, msg.text().slice(0, 500)));
page.on('worker', (w) => {
  console.log('[worker]', w.url());
});

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
await page.waitForTimeout(4000);

const cdp = await ctx.newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 500 }] });
await page.waitForTimeout(300);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 220, y: 520 }] });
await page.waitForTimeout(300);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForTimeout(500);

await browser.close();
server.kill();
