/**
 * Unified benchmark orchestrator.
 *
 *   node harness/unified.mjs --campaign focused|smoke|full [--skip-build]
 *
 * focused (default):
 *   1. Build Vue IFR matrix for the table app
 *   2. Measure empty-shell startup across IFR cells
 *   3. Run storms at 1k/10k/30k for Vue IFR × Vapor IFR cells
 *   4. Synthesize with committed FCP / instrumented / prior React storms
 *
 * This is the campaign that closes the biggest coverage hole: interaction
 * metrics were never collected on IFR builds.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { FOCUSED_CAMPAIGN } from './matrix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    campaign: { type: 'string', default: 'focused' },
    'skip-build': { type: 'boolean', default: false },
    'skip-storms': { type: 'boolean', default: false },
    'skip-startup': { type: 'boolean', default: false },
    'synthesize-only': { type: 'boolean', default: false },
  },
});

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

function focused() {
  const c = FOCUSED_CAMPAIGN;
  const modes = c.tableStormModes.join(',');
  const scales = c.tableStormScales.join(',');

  if (!args['skip-build']) {
    run(
      `node harness/build-unified.mjs --skip-react --only=${modes}`,
    );
    // React needed for startup baseline comparison in focused campaign.
    if (c.tableStartupModes.some((m) => m.startsWith('react'))) {
      run('node harness/build-unified.mjs --only=react');
    }
  }

  // Startup is sampled inside storm reps (fresh loadApp each time). A separate
  // sustained-scenario pass is optional via omitting --skip-startup.
  if (!args['skip-startup'] && process.env.UNIFIED_STARTUP === '1') {
    run(
      `node harness/cross.mjs --skip-build --modes ${c.tableStartupModes.join(',')} --loads 1 --count 1 --heavy-count 1 --startup-count ${c.tableStartupCount} --fresh-count 0 --label unified-startup`,
    );
  }

  if (!args['skip-storms']) {
    run(
      `node harness/cross.mjs --skip-build --storms --modes ${modes} --storm-sizes ${scales} --storm-reps ${c.tableStormReps} --label unified-ifr`,
    );
  }

  run('node harness/synthesize.mjs');
}

function smoke() {
  const modes = FOCUSED_CAMPAIGN.tableStormModes.join(',');
  if (!args['skip-build']) {
    run(`node harness/build-unified.mjs --skip-react --only=${modes}`);
  }
  run(`node harness/cross.mjs --skip-build --smoke --modes ${modes}`);
  run('node harness/synthesize.mjs');
}

function full() {
  // Full = focused Vue IFR storms on all scales + react variants + synthesize.
  // Content-probe FCP rebuild is expensive and lives in ifr-bench; ingest
  // committed scale results unless IFR_SCALE_REBUILD=1.
  const allVue = 'vdom,vdom-ifr,vdom-ifr-et,vapor,vapor-ifr,vapor-ifr-et';
  const all = `${allVue},react,react-naive,react-compiler`;
  if (!args['skip-build']) {
    run(`node harness/build-unified.mjs --only=${all}`);
  }
  run(
    `node harness/cross.mjs --skip-build --storms --modes ${all} --storm-reps 2 --label unified-full`,
  );
  if (process.env.IFR_SCALE_REBUILD === '1') {
    run(
      'node sfc-probe/build-scale-matrix.mjs web-bundles-scale --force',
      { cwd: path.join(root, '../ifr-bench') },
    );
    run(
      'node web-harness/run-browser.mjs web-bundles-scale 5 1 scale-x1',
      { cwd: path.join(root, '../ifr-bench') },
    );
  }
  run('node harness/synthesize.mjs');
}

fs.mkdirSync(path.join(root, 'results/unified'), { recursive: true });

if (args['synthesize-only']) {
  run('node harness/synthesize.mjs');
} else if (args.campaign === 'smoke') {
  smoke();
} else if (args.campaign === 'full') {
  full();
} else {
  focused();
}
