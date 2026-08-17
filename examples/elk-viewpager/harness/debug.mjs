// Verbose debug run: log all console output + network activity.
import { chromium } from 'playwright';

const query = process.argv[2] || '';
const waitMs = Number(process.argv[3] || 12000);
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  headless: true,
  proxy: proxy ? { server: proxy, bypass: 'localhost,127.0.0.1' } : undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  ignoreHTTPSErrors: true,
});
const page = await ctx.newPage();

page.on('console', msg => console.log(`[${msg.type()}]`, msg.text().slice(0, 300)));
page.on('pageerror', err => console.log('[pageerror]', String(err).slice(0, 300)));
page.on('requestfailed', (req) => {
  if (!req.url().includes('localhost'))
    console.log('[reqfail]', req.method(), req.url().slice(0, 120), req.failure()?.errorText);
});
page.on('response', (res) => {
  if (!res.url().includes('localhost'))
    console.log('[response]', res.status(), res.url().slice(0, 120));
});

await page.goto(`http://localhost:${process.env.PORT || 8975}/${query}`, { waitUntil: 'load' });
await page.waitForTimeout(waitMs);
await browser.close();
