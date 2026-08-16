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
//   5. the orb settles where it was dropped — the default release mode — and
//      the particles die out
//   6. a second rapid zigzag drag still spawns effects (pool recycling)
//   7. the hidden switch (the hint label) flips the release mode both ways:
//      to homing (the orb springs back to the centre) and back to free
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

async function shotPng(name) {
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
  fs.writeFileSync(path.join(SHOTS, name), png);
  return png;
}

async function shot(name, poi) {
  return await stats(await shotPng(name), poi);
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
// Finish the drag in a corner far from home first: settling at the drop point
// and springing back to the centre have to be tellable apart by pixels alone.
for (let i = 1; i <= 10; i++) {
  p = [cx + (125 * i) / 10, cy + (280 * i) / 10];
  await touch('touchMove', [p]);
  await page.waitForTimeout(16);
}
const DROPPED = { x: p[0], y: p[1], r: 170 };
await touch('touchEnd', []);
await page.waitForTimeout(200);
const boom = await shot('03-firework.png', { x: p[0], y: p[1], r: 200 });
check('release: firework burst at release point', boom.near > 300, `green near release=${boom.near}`);

// --- settle ----------------------------------------------------------------------
// Frame-based animation timing: headless Chromium can run well below 60fps,
// so poll (up to 15s wall clock) instead of assuming a fixed decay time.
let settledPng;
let settled;
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(1000);
  settledPng = await shotPng('04-settled.png');
  settled = await stats(settledPng, DROPPED);
  if (settled.near > 2000 && settled.total < idle.total * 1.35) break;
}
const settledHome = await stats(settledPng, HOME);
check(
  'settle: orb rests where it was dropped, particles die out',
  settled.near > 2000 && settledHome.near < 2000 && settled.total < idle.total * 1.35,
  `near drop=${settled.near}, near home=${settledHome.near}, total=${settled.total} (idle=${idle.total})`,
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

// --- easter egg: the hint label is a hidden mode switch ---------------------------
// It sits in a 20px-tall box, half the stage wide, 52px off the bottom — see
// .hint in touch-fx.css. Pressing and releasing it flips the release mode.
const SWITCH = [W / 2, H - 62];
async function pressSwitch() {
  await touch('touchStart', [SWITCH]);
  await page.waitForTimeout(60);
  await touch('touchEnd', []);
  await page.waitForTimeout(250);
}

// Wait for the stage to go quiet again (frame-based decay, so poll).
async function settleAt(name, poi) {
  let s;
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(1000);
    s = await shot(name, poi);
    if (s.total < idle.total * 1.35) break;
  }
  return s;
}

// Fling the orb to a corner and let go, so the mode under test decides where
// it ends up.
const FLUNG = { x: 310, y: 660, r: 170 };
async function flingToCorner() {
  await touch('touchStart', [[FLUNG.x, FLUNG.y - 40]]);
  for (let i = 1; i <= 10; i++) {
    await touch('touchMove', [[FLUNG.x, FLUNG.y - 40 + i * 4]]);
    await page.waitForTimeout(16);
  }
  await touch('touchEnd', []);
}

await settleAt('07-pre-egg.png', HOME);

// Press once: homing mode. The orb leaves the corner it was parked in and
// heads home on its own, without being touched.
await pressSwitch();
const flipped = await settleAt('08-switched-to-homing.png', HOME);
check(
  'easter egg: the switch sends the parked orb home',
  flipped.near > 2000,
  `near home=${flipped.near} (idle=${idle.near})`,
);

// ...and the mode sticks: drag it out again and it comes back by itself.
await flingToCorner();
let homingPng;
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(1000);
  homingPng = await shotPng('09-homing.png');
  if ((await stats(homingPng, HOME)).total < idle.total * 1.35) break;
}
const homingHome = await stats(homingPng, HOME);
const homingCorner = await stats(homingPng, FLUNG);
check(
  'easter egg: homing mode springs the orb back after every release',
  homingHome.near > 2000 && homingCorner.near < 2000,
  `near home=${homingHome.near}, near corner=${homingCorner.near}`,
);

// Press again: back to the default, and the orb stays put once more.
await pressSwitch();
await flingToCorner();
let freePng;
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(1000);
  freePng = await shotPng('10-back-to-free.png');
  if ((await stats(freePng, FLUNG)).total < idle.total * 1.35) break;
}
const freeCorner = await stats(freePng, FLUNG);
const freeHome = await stats(freePng, HOME);
check(
  'easter egg: pressing the switch again restores the default free mode',
  freeCorner.near > 2000 && freeHome.near < 2000,
  `near corner=${freeCorner.near}, near home=${freeHome.near}`,
);

// --- summary -----------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed; shots in ${SHOTS}`);

await browser.close();
server.kill();
process.exit(failed.length ? 1 : 0);
