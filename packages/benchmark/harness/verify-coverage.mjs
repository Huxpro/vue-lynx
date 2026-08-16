/**
 * Assert that every published architecture actually has data everywhere the
 * report claims to show it.
 *
 *   node harness/verify-coverage.mjs [--arch octane] [--quiet]
 *
 * The report renders a cell as an em-dash when a number is missing, which is
 * indistinguishable at a glance from a cell that was never meant to be there.
 * This walks results/unified/latest.json against the same coordinate lists the
 * report uses and prints, per architecture, exactly which storm ops and which
 * FCP rungs are missing. Exit code 1 if anything requested via --arch is
 * incomplete, so it can gate a run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: {
    arch: { type: 'string', default: '' },
    quiet: { type: 'boolean', default: false },
  },
});

const unified = JSON.parse(
  fs.readFileSync(path.join(root, 'results/unified/latest.json'), 'utf8'),
);

/** Same coordinates the report's storm table and FCP tables render. */
const STORM_OPS = [
  'create@1k',
  'updateStorm@1k',
  'selectStorm@1k',
  'create@10k',
  'update10th@10k',
  'select@10k',
  'updateStorm@10k',
  'selectStorm@10k',
  'create@30k',
  'updateStorm@30k',
  'selectStorm@30k',
];
const FCP_SCALES_X1 = ['1k', '3k', '5k', '10k', '20k', '30k'];
const FCP_SCALES_X4 = ['1k', '3k', '5k', '10k'];

/**
 * What the report actually publishes — COLUMN_KEYS ∪ FCP_ARCH_KEYS in
 * report-unified.mjs, minus the cells it renders as N/A. Keep in sync with
 * that file; anything outside this set (bare-dom baselines, the unpublished
 * react-naive / react-compiler variants) is not a gap.
 */
const PUBLISHED = [
  'vdom',
  'vdom-et',
  'vdom-ifr',
  'vdom-ifr-et',
  'vapor-dense',
  'vapor',
  'vapor-bang',
  'vapor-code',
  'vapor-ifr-dense',
  'vapor-ifr',
  'vapor-ifr-code-paint',
  'react',
  'octane',
];
/** Cells whose FCP exists only at the fixed-size 1k rung by design. */
const FIXED_SIZE_FCP = new Set(['vdom-et', 'vapor-dense']);
/**
 * Cells the report shows in one table but not the other, by construction.
 * `vapor-ifr-code-paint` (#340) was added to the FCP ladder only — it has no
 * storm run, so its entire storm column is em-dashes today.
 */
const FCP_ONLY = new Set(['vapor-ifr-code-paint']);

const has = (arch, metric, scale, workload, cpu = 1) =>
  unified.cells.some(
    (c) =>
      c.architecture === arch
      && c.metric === metric
      && c.scale === scale
      && c.workload === workload
      && (c.cpuThrottle ?? 1) === cpu
      && c.median != null,
  );

const architectures = PUBLISHED;

let failed = false;
const rows = [];

for (const arch of architectures) {
  const stormMissing = STORM_OPS.filter((key) => {
    const [op, scale] = key.split('@');
    return !has(arch, op, scale, 'table');
  });
  const fcp1Missing = FCP_SCALES_X1.filter(
    (s) => !has(arch, 'fcp', s, 'content-probe', 1),
  );
  const fcp4Missing = FCP_SCALES_X4.filter(
    (s) => !has(arch, 'fcp', s, 'content-probe', 4),
  );
  const fixed = FIXED_SIZE_FCP.has(arch);
  const fcpOnly = FCP_ONLY.has(arch);
  const complete =
    (fcpOnly || stormMissing.length === 0)
    && (fixed || (fcp1Missing.length === 0 && fcp4Missing.length === 0));
  rows.push({ arch, stormMissing, fcp1Missing, fcp4Missing, fixed, fcpOnly, complete });
  if (args.arch && arch === args.arch && !complete) failed = true;
}

if (!args.quiet) {
  console.log('architecture           storms      FCP ×1      FCP ×4');
  console.log('-'.repeat(58));
  for (const r of rows) {
    const s = r.fcpOnly
      ? 'FCP-only'
      : `${STORM_OPS.length - r.stormMissing.length}/${STORM_OPS.length}`;
    const f1 = r.fixed
      ? '1k only'
      : `${FCP_SCALES_X1.length - r.fcp1Missing.length}/${FCP_SCALES_X1.length}`;
    const f4 = r.fixed
      ? '1k only'
      : `${FCP_SCALES_X4.length - r.fcp4Missing.length}/${FCP_SCALES_X4.length}`;
    console.log(
      `${r.arch.padEnd(22)} ${s.padEnd(11)} ${f1.padEnd(11)} ${f4.padEnd(11)}`
        + (r.complete ? '' : '  ← gaps'),
    );
    if (!r.complete) {
      if (!r.fcpOnly && r.stormMissing.length) console.log(`    storms: ${r.stormMissing.join(', ')}`);
      if (!r.fixed && r.fcp1Missing.length) console.log(`    fcp ×1: ${r.fcp1Missing.join(', ')}`);
      if (!r.fixed && r.fcp4Missing.length) console.log(`    fcp ×4: ${r.fcp4Missing.join(', ')}`);
    }
  }
}

if (args.arch) {
  const r = rows.find((x) => x.arch === args.arch);
  if (!r) {
    console.error(`\n${args.arch}: no cells at all in the unified schema`);
    process.exit(1);
  }
  console.log(`\n${args.arch}: ${r.complete ? 'COMPLETE' : 'INCOMPLETE'}`);
}
process.exit(failed ? 1 : 0);
