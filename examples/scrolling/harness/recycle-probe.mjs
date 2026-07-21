/**
 * Headless Chromium probe for ListRecycle web preview (#302).
 *
 * Usage (dev server already running):
 *   node examples/scrolling/harness/recycle-probe.mjs [baseUrl]
 *
 * Clicks the pink "Run recycle probe" button and asserts the banner shows
 * self-reuse PASS + cross-item PASS. Screenshots are written to ARTIFACT_DIR.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(
  path.join(__dirname, '../../../packages/ifr-bench/package.json'),
);
const { chromium } = require('playwright-core');

const baseUrl = process.argv[2] || 'http://127.0.0.1:3000';
const previewUrl =
  `${baseUrl}/__web_preview?casename=${encodeURIComponent('ListRecycle.web.bundle')}`;
const outDir = process.env.ARTIFACT_DIR
  || '/opt/cursor/artifacts/list-recycle';
fs.mkdirSync(outDir, { recursive: true });

function resolveChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }
  const candidates = [
    'command -v google-chrome',
    'ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null',
    'ls -d /opt/pw-browsers/chromium 2>/dev/null',
    'ls -d /home/ubuntu/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null',
  ];
  for (const cmd of candidates) {
    try {
      const p = execFileSync('bash', ['-c', cmd], { encoding: 'utf8' })
        .trim()
        .split('\n')[0];
      if (p) return p;
    } catch {
      // try next
    }
  }
  throw new Error('No Chromium executable found');
}

const browser = await chromium.launch({
  executablePath: resolveChromium(),
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});

console.log('goto', previewUrl);
await page.goto(previewUrl, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

const beforeShot = path.join(outDir, 'list-recycle-before.png');
await page.screenshot({ path: beforeShot, fullPage: false });
console.log('saved', beforeShot);

// Button is left-aligned under the header (not screen-center).
// Empirically: ~css (90, 165) at 390×844 / deviceScaleFactor 1.
const clickPoints = [
  { x: 90, y: 165 },
  { x: 110, y: 170 },
  { x: 80, y: 158 },
  { x: 100, y: 175 },
];

for (const pt of clickPoints) {
  console.log('click', pt);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(1500);
}

const afterShot = path.join(outDir, 'list-recycle-after.png');
await page.screenshot({ path: afterShot, fullPage: false });
console.log('saved', afterShot);

// Closed lynx-view shadow: read pixels via screenshot + write a marker file
// for vision review. Also try CDP search for PASS strings.
const session = await page.context().newCDPSession(page);
await session.send('DOM.enable');
let pierced = '';
try {
  const { searchId, resultCount } = await session.send('DOM.performSearch', {
    query: 'self-reuse: PASS',
    includeUserAgentShadowDOM: true,
  });
  pierced += `selfPassHits=${resultCount}\n`;
  await session.send('DOM.discardSearchResults', { searchId });
  const cross = await session.send('DOM.performSearch', {
    query: 'cross-item: PASS',
    includeUserAgentShadowDOM: true,
  });
  pierced += `crossPassHits=${cross.resultCount}\n`;
  await session.send('DOM.discardSearchResults', { searchId: cross.searchId });
  const passed = await session.send('DOM.performSearch', {
    query: 'Recycle probe passed',
    includeUserAgentShadowDOM: true,
  });
  pierced += `probePassedHits=${passed.resultCount}\n`;
  await session.send('DOM.discardSearchResults', { searchId: passed.searchId });
} catch (err) {
  pierced += `cdpSearchError=${String(err)}\n`;
}
fs.writeFileSync(path.join(outDir, 'list-recycle-cdp.txt'), pierced);

const selfPass = /selfPassHits=([1-9]\d*)/.test(pierced);
const crossPass = /crossPassHits=([1-9]\d*)/.test(pierced);
const probePassed = /probePassedHits=([1-9]\d*)/.test(pierced);

const result = {
  previewUrl,
  selfPass,
  crossPass,
  probePassed,
  pierced,
  errors: errors.slice(0, 15),
  screenshots: { beforeShot, afterShot },
};
fs.writeFileSync(
  path.join(outDir, 'list-recycle-result.json'),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));

await browser.close();

if (selfPass && crossPass) {
  console.log('OK: recycle probe PASS (CDP shadow search)');
  process.exit(0);
}

console.error(
  'FAIL: CDP did not find PASS strings — inspect screenshots in',
  outDir,
);
process.exit(2);
