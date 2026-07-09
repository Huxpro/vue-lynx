// Build both benchmark apps (production). The vapor app's App.vue is
// generated from the vdom source by inserting the `vapor` attribute, so the
// two modes are guaranteed to run identical workloads.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function generateVaporApp() {
  const src = fs.readFileSync(
    path.join(root, 'apps/vdom/src/App.vue'),
    'utf-8',
  );
  const marker = '<!-- BENCH_MODE_SCRIPT --><script setup lang="ts">';
  if (!src.startsWith(marker)) {
    throw new Error('apps/vdom/src/App.vue lost its BENCH_MODE_SCRIPT marker');
  }
  const vapor = `<!-- GENERATED from apps/vdom/src/App.vue — do not edit -->\n${
    src.replace(marker, '<script setup vapor lang="ts">')
  }`;
  fs.writeFileSync(path.join(root, 'apps/vapor/src/App.vue'), vapor);
}

export function buildApps({ silent = false } = {}) {
  generateVaporApp();
  for (const app of ['vdom', 'vapor']) {
    const cwd = path.join(root, 'apps', app);
    fs.rmSync(path.join(cwd, 'dist'), { recursive: true, force: true });
    fs.rmSync(path.join(cwd, 'node_modules/.cache'), {
      recursive: true,
      force: true,
    });
    if (!silent) console.log(`[bench] building apps/${app} (production)…`);
    execSync('npx rspeedy build', {
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });
  }
}

export function bundleSizes() {
  const out = {};
  for (const app of ['vdom', 'vapor']) {
    const dist = path.join(root, 'apps', app, 'dist');
    out[app] = {};
    for (const file of ['main.web.bundle', 'main.lynx.bundle']) {
      const p = path.join(dist, file);
      if (!fs.existsSync(p)) continue;
      const buf = fs.readFileSync(p);
      out[app][file] = {
        raw: buf.length,
        gzip: gzipSize(buf),
      };
    }
  }
  return out;
}

function gzipSize(buf) {
  const zlib = requireZlib();
  return zlib.gzipSync(buf, { level: 6 }).length;
}

let _zlib;
function requireZlib() {
  if (!_zlib) {
    _zlib = process.getBuiltinModule
      ? process.getBuiltinModule('node:zlib')
      : null;
  }
  if (!_zlib) throw new Error('zlib unavailable');
  return _zlib;
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  buildApps();
  console.log(JSON.stringify(bundleSizes(), null, 2));
}
