/**
 * Prepare benchmark assets for the docs site:
 *   1. build the black-box benchmark apps if their dist is missing
 *      (Vercel/CI — dist dirs are gitignored)
 *   2. copy each config's main.web.bundle to docs/public/benchmark/<mode>/
 *   3. generate the krausest-style results table from the committed results
 *      JSON into docs/public/benchmark/table.html
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const BENCH_ROOT = path.join(REPO_ROOT, 'packages/benchmark');
const DEST = path.resolve(__dirname, '../docs/public/benchmark');

const MODES = {
  react: 'apps/ui-react/dist',
  'react-naive': 'apps/ui-react/dist-naive',
  'react-compiler': 'apps/ui-react/dist-compiler',
  vdom: 'apps/ui-vdom/dist',
  vapor: 'apps/ui-vapor/dist',
};

function ensureLibBuilt() {
  const libBuilt = fs.existsSync(
    path.join(REPO_ROOT, 'packages/vue-lynx/plugin/dist/index.js'),
  );
  if (!libBuilt) {
    console.info('Building vue-lynx library (required by benchmark apps)...');
    execSync('pnpm build', {
      cwd: path.join(REPO_ROOT, 'packages/vue-lynx'),
      stdio: 'inherit',
    });
  }
}

function ensureBundles() {
  const missing = Object.values(MODES).filter(
    (dist) => !fs.existsSync(path.join(BENCH_ROOT, dist, 'main.web.bundle')),
  );
  if (missing.length === 0) return;

  ensureLibBuilt();
  console.info('Building benchmark apps (missing dist):', missing.join(', '));

  // Vue apps (ui-vapor's App.vue is generated from ui-vdom's).
  execSync(
    'node -e "import(\'./harness/build.mjs\').then(m => m.buildApps({ apps: [\'ui-vdom\', \'ui-vapor\'] }))"',
    { cwd: BENCH_ROOT, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } },
  );
  // React variants (own rspeedy toolchain).
  const reactDir = path.join(BENCH_ROOT, 'apps/ui-react');
  for (const cmd of [
    'npx rspeedy build',
    'npx rspeedy build --config lynx.naive.config.ts',
    'npx rspeedy build --config lynx.compiler.config.ts',
  ]) {
    execSync(cmd, {
      cwd: reactDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });
  }
}

function copyBundles() {
  for (const [mode, dist] of Object.entries(MODES)) {
    const src = path.join(BENCH_ROOT, dist, 'main.web.bundle');
    const destDir = path.join(DEST, mode);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, path.join(destDir, 'main.web.bundle'));
    console.info(`  -> benchmark/${mode}/main.web.bundle`);
  }
}

function generateTable() {
  execSync(
    `node harness/report-table.mjs --out ${path.join(DEST, 'table.html')}`,
    { cwd: BENCH_ROOT, stdio: 'inherit' },
  );
}

function generateUnifiedReport() {
  const out = path.join(DEST, 'unified.html');
  execSync(`node harness/report-unified.mjs --out ${out}`, {
    cwd: BENCH_ROOT,
    stdio: 'inherit',
  });
  // report-unified writes EN + ZH next to --out (unified.html + unified.zh.html).
  const outZh = path.join(DEST, 'unified.zh.html');
  const repoDir = path.join(BENCH_ROOT, 'results/unified');
  fs.copyFileSync(out, path.join(repoDir, 'report.html'));
  if (fs.existsSync(outZh)) {
    fs.copyFileSync(outZh, path.join(repoDir, 'report.zh.html'));
    console.info('  -> benchmark/unified.html');
    console.info('  -> benchmark/unified.zh.html');
  } else {
    console.info('  -> benchmark/unified.html');
  }
}

function copyIfrScaleTrends() {
  const ifrResults = path.join(REPO_ROOT, 'packages/ifr-bench/results');
  const copies = [
    ['scale-trends-scale-x1.html', 'ifr-scale-trends-x1.html'],
    ['scale-trends-scale-x4.html', 'ifr-scale-trends-x4.html'],
  ];
  for (const [srcName, destName] of copies) {
    const src = path.join(ifrResults, srcName);
    if (!fs.existsSync(src)) {
      console.warn(`  skip ${destName} (missing ${srcName})`);
      continue;
    }
    fs.copyFileSync(src, path.join(DEST, destName));
    console.info(`  -> benchmark/${destName}`);
  }
}

console.info('Preparing benchmark playground assets...');
fs.rmSync(DEST, { recursive: true, force: true });
ensureBundles();
copyBundles();
generateTable();
generateUnifiedReport();
copyIfrScaleTrends();
console.info('Done.');
