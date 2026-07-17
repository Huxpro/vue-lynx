/**
 * Pre-build script that builds the GenUI playground (examples/genui-playground)
 * and copies its static dist into docs/public/genui-playground/, where the
 * /genui page embeds it via an iframe.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const PLAYGROUND_DIR = path.resolve(REPO_ROOT, 'examples/genui-playground');
const PLAYGROUND_DIST = path.join(PLAYGROUND_DIR, 'dist');
const DEST = path.resolve(__dirname, '../docs/public/genui-playground');
// Absolute prefix so hashed assets resolve even if a host strips the trailing
// slash from /genui-playground/ (e.g. Vercel cleanUrls + /index.html redirects).
const ASSET_PREFIX = '/genui-playground/';

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.info('Preparing GenUI playground...');

// The playground build needs the built Lynx bundles (www/) and the shell.
// Always rebuild with the website asset prefix so a leftover local `dist/`
// (dev `assetPrefix: 'auto'`) is never published under the wrong paths.
{
  // The playground imports both vue-lynx and vue-lynx-genui — make sure
  // both workspace dists exist (root `pnpm build` builds the two of them).
  const libBuilt = fs.existsSync(
    path.join(REPO_ROOT, 'packages/vue-lynx/plugin/dist/index.js'),
  );
  const genuiBuilt = fs.existsSync(
    path.join(REPO_ROOT, 'packages/genui/dist/index.js'),
  );
  if (!libBuilt || !genuiBuilt) {
    console.info('Building workspace libraries (required by the playground)...');
    execSync('pnpm build', { cwd: REPO_ROOT, stdio: 'inherit' });
  }
  console.info(
    `Building playground with ASSET_PREFIX=${ASSET_PREFIX}...`,
  );
  execSync('pnpm build', {
    cwd: PLAYGROUND_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      ASSET_PREFIX,
    },
  });
}

if (!fs.existsSync(path.join(PLAYGROUND_DIST, 'index.html'))) {
  throw new Error(
    `Playground build did not produce ${path.join(PLAYGROUND_DIST, 'index.html')}`,
  );
}

if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true });
}
copyDirRecursive(PLAYGROUND_DIST, DEST);

console.info(`Done! Copied playground dist -> ${DEST}`);
