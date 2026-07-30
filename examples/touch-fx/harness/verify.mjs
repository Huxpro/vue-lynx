// Headless verification of the touch-fx interaction:
//   node harness/verify.mjs
//
// Drives real CDP touch events through <lynx-view> (shadow DOM is closed to
// selectors, so everything is coordinate + pixel based) and asserts:
//   1. the app boots (green orb visible on the black stage)
//   2. effects spawn at touchstart
//   3. CONTINUITY — during one long drag, green effect pixels keep tracking
//      the finger at every sample point, start to finish
//   4. a firework burst appears at release
//   5. the system settles back to idle afterwards
//   6. a second rapid zigzag drag still spawns effects (pool recycling)
//
// Screenshots land in harness/shots/ for eyeballing.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HARNESS = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HARNESS, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const PORT = Number(process.env.PORT || 8976);
const W = 390;
const H = 844;

// --- static server -----------------------------------------------------------
const server = spawn(process.execPath, [path.join(HARNESS, 'serve.mjs')], {
  stdio: 'pipe',
  env: { ...process.env, PORT: String(PORT) },
});
await new Promise((r) => server.stdout.once('data', r));

// --- browser -----------------------------------------------------------------
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  hasTouch: true,
});
const page = await ctx.newPage();
page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 400)));
page.on('console', (msg) => {
  const t = msg.text();
  if (/error|warn/i.test(msg.type()) && !/favicon/.test(t)) {
    console.log(`[console.${msg.type()}]`, t.slice(0, 400));
  }
});

// Pixel analysis runs in a second blank page: draw the screenshot on a canvas
// and count green-ish pixels (globally and near a point of interest).
const lab = await ctx.newPage();
async function stats(png, poi) {
  const dataUrl = 'data:image/png;base64,' + png.toString('base64');
  return await lab.evaluate(
    async ({ dataUrl, poi }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g2d = c.getContext('2d', { willReadFrequently: true });
      g2d.drawImage(img, 0, 0);
      const { data } = g2d.getImageData(0, 0, c.width, c.height);
      let total = 0;
      let near = 0;
      const r2 = poi ? poi.r * poi.r : 0;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          const R = data[i];
          const G = data[i + 1];
          const B = data[i + 2];
          if (G > 70 && G > R * 1.15 && G > B * 1.15) {
            total++;
            if (poi) {
              const dx = x - poi.x;
              const dy = y - poi.y;
              if (dx * dx + dy * dy <= r2) near++;
            }
          }
        }
      }
      return { total, near };
    },
    { dataUrl, poi: poi ? { x: poi.x, y: poi.y, r: poi.r ?? 150 } : null },
  );
}

async function shot(name, poi) {
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
  fs.writeFileSync(path.join(SHOTS, name), png);
  return await stats(png, poi);
}

const cdp = await ctx.newCDPSession(page);
const touch = (type, points) =>
  cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map(([x, y]) => ({ x, y })),
  });

// --- boot ---------------------------------------------------------------------
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });

// Poll until the orb is painted (green pixels near the orb's home position).
const HOME = { x: W / 2, y: H * 0.42, r: 170 };
let idle;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(500);
  idle = await shot('00-idle.png', HOME);
  if (idle.near > 2000) break;
}

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
};

check('boot: orb visible at home', idle.near > 2000, `green near home=${idle.near}, total=${idle.total}`);

// --- long circular drag (the continuity test) ----------------------------------
// ~4s of continuous dragging around an ellipse; sample every ~600ms and
// require effect pixels near the CURRENT finger position at every sample.
const cx = W / 2;
const cy = H / 2;
const rx = 120;
const ry = 260;
const pos = (t) => [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];

let p = pos(0);
await touch('touchStart', [p]);
await page.waitForTimeout(120);
const startFx = await shot('01-touchstart.png', { x: p[0], y: p[1], r: 150 });
check('touchstart: splash spawns', startFx.near > 300, `green near finger=${startFx.near}`);

const STEPS = 96;
const dragSamples = [];
for (let i = 1; i <= STEPS; i++) {
  const t = (i / STEPS) * Math.PI * 2;
  p = pos(t);
  await touch('touchMove', [p]);
  await page.waitForTimeout(28);
  if (i % 16 === 0) {
    const s = await shot(`02-drag-${String(i).padStart(2, '0')}.png`, { x: p[0], y: p[1], r: 160 });
    dragSamples.push({ i, ...s });
  }
}
const weakest = dragSamples.reduce((a, b) => (a.near < b.near ? a : b));
check(
  'continuity: effects track the finger at EVERY drag sample',
  dragSamples.length === 6 && dragSamples.every((s) => s.near > 300),
  dragSamples.map((s) => `@${s.i}:${s.near}`).join(' ') + ` (weakest=${weakest.near})`,
);
check(
  'drag adds energy vs idle',
  dragSamples.every((s) => s.total > idle.total * 1.05),
  `drag totals=${dragSamples.map((s) => s.total).join(',')} vs idle=${idle.total}`,
);

// --- release firework -----------------------------------------------------------
await touch('touchEnd', []);
await page.waitForTimeout(200);
const boom = await shot('03-firework.png', { x: p[0], y: p[1], r: 200 });
check('release: firework burst at release point', boom.near > 300, `green near release=${boom.near}`);

// --- settle ----------------------------------------------------------------------
// Frame-based animation timing: headless Chromium can run well below 60fps,
// so poll (up to 15s wall clock) instead of assuming a fixed decay time.
let settled;
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(1000);
  settled = await shot('04-settled.png', HOME);
  if (settled.near > 2000 && settled.total < idle.total * 1.35) break;
}
check(
  'settle: orb returns home, particles die out',
  settled.near > 2000 && settled.total < idle.total * 1.35,
  `near home=${settled.near}, total=${settled.total} (idle=${idle.total})`,
);

// --- rapid zigzag (pool recycling under stress) -----------------------------------
let z = [60, 700];
await touch('touchStart', [z]);
for (let i = 1; i <= 60; i++) {
  z = [60 + (i % 2 ? 270 : 0) + i * 0.5, 700 - i * 8];
  await touch('touchMove', [z]);
  await page.waitForTimeout(16);
}
const zig = await shot('05-zigzag.png', { x: z[0], y: z[1], r: 170 });
await touch('touchEnd', []);
check('stress: effects still spawn at end of rapid zigzag', zig.near > 300, `green near finger=${zig.near}`);
await page.waitForTimeout(400);
await shot('06-zigzag-boom.png');

// --- summary -----------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed; shots in ${SHOTS}`);

await browser.close();
server.kill();
process.exit(failed.length ? 1 : 0);
