/**
 * Pre-build script that builds the GenUI playground (examples/genui-playground)
 * and copies its static dist into docs/public/genui-playground/, where the
 * /playground page embeds it via an iframe.
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
// `pnpm build` runs rspeedy (lynx-src → www/) then rsbuild (shell → dist/,
// which copies www/ in as its public dir).
if (!fs.existsSync(path.join(PLAYGROUND_DIST, 'index.html'))) {
  const libBuilt = fs.existsSync(
    path.join(REPO_ROOT, 'packages/vue-lynx/plugin/dist/index.js'),
  ) || fs.existsSync(path.join(REPO_ROOT, 'plugin/dist/index.js'));
  if (!libBuilt) {
    console.info('Building vue-lynx library (required by the playground)...');
    execSync('pnpm build', { cwd: REPO_ROOT, stdio: 'inherit' });
  }
  console.info('Building playground (no dist/ found)...');
  execSync('pnpm build', { cwd: PLAYGROUND_DIR, stdio: 'inherit' });
}

if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true });
}
copyDirRecursive(PLAYGROUND_DIST, DEST);

console.info(`Done! Copied playground dist -> ${DEST}`);
