// Screenshot the harness with headless Chromium.
// Usage: node shot.mjs <out.png> [waitMs] [actionsJson]
// actions: [{"tap":{"x":195,"y":818}}, {"type":"hello"}, {"wait":2000}, {"scroll":300}]
// The app renders inside <lynx-view> shadow DOM (closed to selectors), so
// interactions are coordinate-based.
import { chromium } from 'playwright';

const out = process.argv[2] || 'shot.png';
const waitMs = Number(process.argv[3] || 8000);
const actions = process.argv[4] ? JSON.parse(process.argv[4]) : [];

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  headless: true,
  proxy: proxy ? { server: proxy, bypass: 'localhost,127.0.0.1' } : undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  ignoreHTTPSErrors: true,
});
const page = await ctx.newPage();

page.on('pageerror', err => console.log('[pageerror]', String(err).slice(0, 300)));

await page.goto(`http://localhost:${process.env.PORT || 8975}/`, { waitUntil: 'load' });
await page.waitForTimeout(waitMs);

for (const action of actions) {
  if (action.tap) {
    await page.mouse.click(action.tap.x, action.tap.y);
    await page.waitForTimeout(action.tap.wait ?? 2500);
  }
  else if (action.type) {
    await page.keyboard.type(action.type, { delay: 40 });
    await page.waitForTimeout(2500);
  }
  else if (action.scroll) {
    await page.mouse.move(195, 420);
    await page.mouse.wheel(0, action.scroll);
    await page.waitForTimeout(1200);
  }
  else if (action.wait) {
    await page.waitForTimeout(action.wait);
  }
}

await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 390, height: 844 } });
await browser.close();
console.log('saved', out);
