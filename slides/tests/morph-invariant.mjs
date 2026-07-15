// =============================================================================
// Magic-move invariant test — guards the FLIP contract so the "absolutely-
// positioned element dropped into flow mid-morph" class of bug can't return.
//
// For every adjacent slide pair that shares data-flip ids, this script:
//   1. loads each slide fresh and records every flip element's resting rect;
//   2. drives the real transition (ArrowRight) and samples each shared
//      element's rect mid-morph;
//   3. asserts the mid-morph rect stays inside the bounding box spanned by
//      its source and target rects (a FLIP tween is a straight-line
//      interpolation — anything off-path means the element lost its
//      positioning scheme, e.g. the .flane bug where the MT lane sank by a
//      full lane-height on the first frame);
//   4. asserts the settled rect matches the fresh-load rect of the target
//      slide (no end-of-animation snap).
//
// Run:  pnpm test:morph          (spawns its own vite dev server)
// Env:  CHROMIUM_PATH=<binary>   (defaults: $PLAYWRIGHT_BROWSERS_PATH/chromium,
//                                 then macOS Chrome, then /opt/pw-browsers/chromium)
// =============================================================================
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;

const PATH_MARGIN = 24; // px of slack around the from→to bounding box
const LAND_EPSILON = 2; // px tolerance for the settled position

function chromiumPath() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    process.env.PLAYWRIGHT_BROWSERS_PATH &&
      path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/opt/pw-browsers/chromium',
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    console.error('No Chromium binary found — set CHROMIUM_PATH.');
    process.exit(2);
  }
  return found;
}

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`vite dev server never became ready at ${url}`);
}

const vite = spawn(
  path.join(ROOT, 'node_modules', '.bin', 'vite'),
  ['--port', String(PORT), '--host', '127.0.0.1'],
  { cwd: ROOT, stdio: 'ignore', detached: false },
);
process.on('exit', () => vite.kill());

try {
  await waitForServer(BASE);
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const grabRects = () => page.evaluate(() => {
    const out = {};
    document
      .querySelectorAll('.slide.is-active [data-flip]')
      .forEach((el) => {
        const r = el.getBoundingClientRect();
        out[el.getAttribute('data-flip')] = {
          left: r.left, top: r.top, right: r.right, bottom: r.bottom,
        };
      });
    return out;
  });

  // Fixed sleeps are flaky under load (the slide-enter transition may still
  // be running when we'd sample). A rect only counts once two consecutive
  // reads agree — i.e. all motion has genuinely stopped.
  const same = (a, b) =>
    a && b && Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every((k) => b[k] &&
      Math.abs(a[k].left - b[k].left) < 0.5 && Math.abs(a[k].top - b[k].top) < 0.5);
  async function stableRects(tries = 20) {
    // The slide-enter transition (translateY(20px) -> 0) can START late when
    // boot work (QR generation, demo loaders) blocks the main thread — two
    // early samples would agree on the frozen pre-transition state. Wait for
    // the active slide's transform to be identity first; that's the
    // deterministic "entrance finished" signal.
    await page.waitForFunction(() => {
      const s = document.querySelector('.slide.is-active');
      if (!s) return false;
      const t = getComputedStyle(s).transform;
      return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    }, null, { timeout: 10000 });
    let prev = await grabRects();
    for (let t = 0; t < tries; t++) {
      await page.waitForTimeout(160);
      const next = await grabRects();
      if (same(prev, next)) return next;
      prev = next;
    }
    return prev; // last read; the assertions will surface any residual drift
  }

  // Pass 1 — resting rects for every slide (fresh load each, cache-busted so
  // the deck reboots instead of doing a same-document hash navigation).
  await page.goto(`${BASE}/?lang=en&mi=0#1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const total = await page.evaluate(() => document.querySelectorAll('.slide').length);
  const resting = [null]; // 1-indexed
  for (let i = 1; i <= total; i++) {
    await page.goto(`${BASE}/?lang=en&mi=${i}#${i}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    resting[i] = await stableRects();
  }

  // Pass 2 — drive each transition that shares flip ids; sample mid + settled.
  const failures = [];
  let checked = 0;
  for (let i = 1; i < total; i++) {
    const shared = Object.keys(resting[i]).filter((k) => resting[i + 1][k]);
    if (shared.length === 0) continue;

    await page.goto(`${BASE}/?lang=en&mv=${i}#${i}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    await stableRects(); // let the entry settle before driving the morph
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250); // mid-FLIP (engine runs 640ms)
    const mid = await grabRects();
    await page.waitForTimeout(700);
    const end = await stableRects();

    for (const id of shared) {
      checked++;
      const a = resting[i][id];
      const b = resting[i + 1][id];
      const m = mid[id];
      const e = end[id];
      const box = {
        left: Math.min(a.left, b.left) - PATH_MARGIN,
        top: Math.min(a.top, b.top) - PATH_MARGIN,
        right: Math.max(a.right, b.right) + PATH_MARGIN,
        bottom: Math.max(a.bottom, b.bottom) + PATH_MARGIN,
      };
      if (m && (m.left < box.left || m.top < box.top ||
                m.right > box.right || m.bottom > box.bottom)) {
        failures.push(
          `#${i}->#${i + 1} [${id}] OFF-PATH mid-morph: ` +
          `top ${Math.round(m.top)} vs corridor ${Math.round(box.top)}..${Math.round(box.bottom)}`,
        );
      }
      if (e && (Math.abs(e.left - b.left) > LAND_EPSILON ||
                Math.abs(e.top - b.top) > LAND_EPSILON)) {
        failures.push(
          `#${i}->#${i + 1} [${id}] LANDING SNAP: settled at ` +
          `(${Math.round(e.left)},${Math.round(e.top)}), expected ` +
          `(${Math.round(b.left)},${Math.round(b.top)})`,
        );
      }
    }
  }

  await browser.close();
  console.log(`morph-invariant: ${checked} flip transitions checked across ${total} slides`);
  if (failures.length) {
    console.error(`FAIL (${failures.length}):`);
    for (const f of failures) console.error('  ' + f);
    process.exit(1);
  }
  console.log('PASS');
} finally {
  vite.kill();
}
