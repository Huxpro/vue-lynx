/**
 * Build the talk deck (../slides) and copy its output into the website's
 * static assets so it is served at `/deck/` on the same Vercel deployment.
 *
 * The deck is a standalone Vite app; here we build it with `base=/deck/` and
 * drop the result into docs/public/deck. The live <lynx-view> embeds fetch
 * bundles from `/examples/...` (site root), which prepare-examples already
 * populates — so no extra wiring is needed for the demos.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SLIDES_DIR = path.resolve(REPO_ROOT, 'slides');
const SLIDES_DIST = path.resolve(SLIDES_DIR, 'dist');
const DECK_DEST = path.resolve(__dirname, '../docs/public/deck');

if (!fs.existsSync(SLIDES_DIR)) {
  console.warn('[deck] slides/ not found — skipping deck build');
  process.exit(0);
}

console.log('[deck] building slides with base=/deck/ …');
execSync('pnpm --filter vue-lynx-slides run build', {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  env: { ...process.env, DECK_BASE: '/deck/' },
});

if (!fs.existsSync(SLIDES_DIST)) {
  throw new Error('[deck] expected build output at ' + SLIDES_DIST);
}

fs.rmSync(DECK_DEST, { recursive: true, force: true });
fs.mkdirSync(path.dirname(DECK_DEST), { recursive: true });
fs.cpSync(SLIDES_DIST, DECK_DEST, { recursive: true });

console.log(`[deck] copied ${SLIDES_DIST} -> ${DECK_DEST}`);
