// Screenshot the real Elk (elk.zone) through the MITM relay for
// side-by-side comparison with the Lynx port.
// Usage: node shot-elk.mjs <out.png> <path> [waitMs] [actionsJson]
import { chromium } from 'playwright';

const out = process.argv[2] || 'elk.png';
const path = process.argv[3] || '/mas.to/public/local';
const waitMs = Number(process.argv[4] || 12000);
const actions = process.argv[5] ? JSON.parse(process.argv[5]) : [];

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  headless: true,
  args: [
    // do NOT inherit the env HTTPS_PROXY — all traffic must hit the local
    // MITM relay via host-resolver-rules instead
    '--no-proxy-server',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    // resolve EVERYTHING to the local MITM relay
    '--host-resolver-rules=MAP * 127.0.0.1, EXCLUDE localhost',
    '--ignore-certificate-errors',
  ],
});

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  ignoreHTTPSErrors: true,
  isMobile: true,
  hasTouch: true,
  colorScheme: process.env.DARK ? 'dark' : 'light',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
const page = await ctx.newPage();

page.on('pageerror', err => console.log('[pageerror]', String(err).slice(0, 200)));

await page.goto(`https://elk.zone${path}`, { waitUntil: 'load', timeout: 60000 });
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
  else if (action.wait) {
    await page.waitForTimeout(action.wait);
  }
}

await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 390, height: 844 } });
await browser.close();
console.log('saved', out);
