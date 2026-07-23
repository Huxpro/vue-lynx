/**
 * Authoritative single-host full sweep on the flags-consolidation matrix:
 *   - table storms: all published modes (incl. vapor-bang / vapor-code + react)
 *     × 1k/10k/30k (warmup discarded in cross.mjs)
 *   - content FCP ladder via unified-content.mjs (single provenance):
 *       ×1 across 1k→30k, ×4 through 10k
 *   - factor decomposition + synthesize + unified report
 *
 *   node harness/run-full-single-host.mjs [--skip-build] [--skip-storms]
 *     [--skip-fcp] [--skip-fcp-build] [--synthesize-only]
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

/** Label for the storms JSON written by cross.mjs. */
const STORMS_LABEL = 'graph-eng-flags-full';

const STORM_MODES = [
  'vdom',
  'vdom-et',
  'vdom-ifr',
  'vdom-ifr-et',
  'vapor',
  'vapor-dense',
  'vapor-bang',
  'vapor-code',
  'vapor-engine',
  'vapor-ifr',
  'vapor-ifr-dense',
  'vapor-ifr-sparse',
  'vapor-ifr-engine-et',
  'react',
].join(',');

const FCP_CELLS = [
  'vue-vdom-off',
  'vue-vdom-et',
  'vue-vdom-ifr',
  'vue-vdom-ifr-et',
  'vue-vapor-off',
  'vue-vapor-dense',
  'vue-vapor-bang',
  'vue-vapor-code',
  'vue-vapor-engine',
  'vue-vapor-ifr',
  'vue-vapor-ifr-dense',
  'vue-vapor-ifr-sparse',
  'vue-vapor-ifr-engine-et',
  'react',
].join(',');

const { values: args } = parseArgs({
  options: {
    'skip-build': { type: 'boolean', default: false },
    'skip-storms': { type: 'boolean', default: false },
    'skip-fcp': { type: 'boolean', default: false },
    'skip-fcp-build': { type: 'boolean', default: false },
    'synthesize-only': { type: 'boolean', default: false },
  },
});

const env = {
  ...process.env,
  PLAYWRIGHT_CHROMIUM_PATH:
    process.env.PLAYWRIGHT_CHROMIUM_PATH || '/usr/local/bin/google-chrome',
};

function run(cmd, cwd = root) {
  console.log(`\n===== $ ${cmd} =====\n`);
  execSync(cmd, { cwd, stdio: 'inherit', env });
}

fs.mkdirSync(path.join(root, 'results/unified'), { recursive: true });

if (args['synthesize-only']) {
  run(
    `node harness/graph-eng-unified-factors.mjs results/cross-storms-${STORMS_LABEL}.json`,
  );
  run('node harness/synthesize.mjs');
  run('node harness/report-unified.mjs');
  process.exit(0);
}

if (!args['skip-build']) {
  run('pnpm --filter vue-lynx run build', repoRoot);
  run(`node harness/build-unified.mjs --only=${STORM_MODES}`);
}

if (!args['skip-storms']) {
  run(
    `node harness/cross.mjs --skip-build --storms --modes ${STORM_MODES} --storm-sizes 1k,10k,30k --storm-reps 2 --label ${STORMS_LABEL}`,
  );
}

if (!args['skip-fcp']) {
  // Fresh single-provenance files — avoid merging with a different-host prior run.
  for (const f of [
    'results/unified-content-x1.json',
    'results/unified-content-x4.json',
  ]) {
    const abs = path.join(root, f);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  }
  const skipBuild = args['skip-fcp-build'] ? ' --skip-build' : '';
  // ×1 full ladder (matches committed sweep: runs=3).
  run(
    `node harness/unified-content.mjs --label content --cpu 1 --runs 3 --rungs 1000,3000,5000,10000,20000,30000 --cells ${FCP_CELLS}${skipBuild}`,
  );
  // ×4 through 10k only. Bundles from ×1 are reused when --skip-fcp-build
  // (or after the ×1 build above already populated unified-bundles/content).
  run(
    `node harness/unified-content.mjs --label content --cpu 4 --runs 3 --rungs 1000,3000,5000,10000 --cells ${FCP_CELLS} --skip-build`,
  );
}

run(
  `node harness/graph-eng-unified-factors.mjs results/cross-storms-${STORMS_LABEL}.json`,
);
run('node harness/synthesize.mjs');
run('node harness/report-unified.mjs');
console.log('\n[full-single-host] done → results/unified/{ANALYSIS.md,report.html}\n');
