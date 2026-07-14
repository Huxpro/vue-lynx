/**
 * Build the talk deck as the SITE ROOT (base=/) for the `vueconf-2026` preview
 * line, so the domain root *is* the deck — easier to share, and the deck's
 * root-absolute links (`/speaker.html`, `/examples/*`) all resolve correctly.
 *
 * This is deliberately a *branch-only* build. Production (the `main` branch)
 * keeps the docs site via `website`'s normal `build` script; `vueconf-2026`'s
 * vercel.json points at THIS script instead. The two branch lines carry
 * different vercel.json on purpose — do not merge vueconf-2026 into main.
 *
 * Output layout (served at `/`):
 *   /index.html, /speaker.html, /assets/…   ← deck built with DECK_BASE=/
 *   /examples/…                             ← live <lynx-view> bundles
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBSITE_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(WEBSITE_DIR, '..');
const SLIDES_DIST = path.resolve(REPO_ROOT, 'slides/dist');
const EXAMPLES_SRC = path.resolve(WEBSITE_DIR, 'docs/public/examples');
const OUT = path.resolve(WEBSITE_DIR, 'deck-root');

// 1. Example bundles — the live embeds fetch `/examples/<bundle>` at runtime.
console.log('[deck-root] building example bundles …');
execSync('pnpm prepare-examples', { cwd: WEBSITE_DIR, stdio: 'inherit' });

// 2. The deck itself, at base=/ (so /assets, /speaker.html are root-absolute).
console.log('[deck-root] building slides with base=/ …');
execSync('pnpm --filter vue-lynx-slides run build', {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  env: { ...process.env, DECK_BASE: '/' },
});
if (!fs.existsSync(SLIDES_DIST)) {
  throw new Error('[deck-root] expected build output at ' + SLIDES_DIST);
}

// 3. Assemble the output dir = deck at root + /examples.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(SLIDES_DIST, OUT, { recursive: true });

if (fs.existsSync(EXAMPLES_SRC)) {
  fs.cpSync(EXAMPLES_SRC, path.join(OUT, 'examples'), { recursive: true });
  console.log('[deck-root] copied examples → /examples');
} else {
  console.warn('[deck-root] examples not found at ' + EXAMPLES_SRC +
    ' — live demos will 404');
}

console.log('[deck-root] output ready at ' + OUT);
