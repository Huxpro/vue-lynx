/**
 * Benchmark orchestrator.
 *
 *   pnpm bench            # both engine modes, all scenes/sizes/variants
 *   node run.mjs --quick  # small size only, fewer iterations
 *
 * Spawns one subprocess per (mode × scene × size × variant) so every
 * configuration gets fresh module state and a genuine cold first iteration.
 * Results land in results/results.json and are printed as tables.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const quick = process.argv.includes('--quick');

const MODES = [
  { name: 'v8', nodeArgs: ['--expose-gc'] },
  { name: 'jitless', nodeArgs: ['--jitless', '--expose-gc'] },
];
const SCENES = ['static-heavy', 'content', 'list'];
const SIZES = quick ? ['small'] : ['small', 'large'];
const VARIANTS = [
  'bg-baseline',
  'ifr-replay',
  'ifr-direct',
  'ifr-static-tpl',
  'ifr-block-tpl',
  'ifr-vapor',
  'papi-floor',
];
const ITERATIONS = quick ? 10 : 30;

const results = [];

for (const mode of MODES) {
  for (const size of SIZES) {
    for (const scene of SCENES) {
      for (const variant of VARIANTS) {
        const cfg = JSON.stringify({ variant, scene, size, iterations: ITERATIONS });
        const out = execFileSync(
          process.execPath,
          [
            ...mode.nodeArgs,
            '--import',
            path.join(_dirname, 'register-hooks.mjs'),
            path.join(_dirname, 'src/harness.mjs'),
            cfg,
          ],
          { cwd: _dirname, encoding: 'utf8' },
        );
        const parsed = JSON.parse(out.trim().split('\n').pop());
        results.push({ mode: mode.name, ...parsed });
        process.stderr.write(
          `${mode.name.padEnd(8)} ${size.padEnd(6)} ${scene.padEnd(13)} ${
            variant.padEnd(15)
          } cold ${parsed.coldMs.toFixed(2).padStart(8)}ms  warm ${
            parsed.warmMedianMs.toFixed(3).padStart(8)
          }ms\n`,
        );
      }
    }
  }
}

fs.mkdirSync(path.join(_dirname, 'results'), { recursive: true });
fs.writeFileSync(
  path.join(_dirname, 'results/results.json'),
  JSON.stringify(results, null, 2),
);

// ---------------------------------------------------------------------------
// Summary tables
// ---------------------------------------------------------------------------

function table(mode, size, metric) {
  const rows = [];
  const header = ['variant', ...SCENES];
  rows.push(header);
  for (const variant of VARIANTS) {
    const row = [variant];
    for (const scene of SCENES) {
      const r = results.find(
        (x) => x.mode === mode && x.size === size && x.scene === scene && x.variant === variant,
      );
      row.push(r ? r[metric].toFixed(3) : '-');
    }
    rows.push(row);
  }
  const widths = header.map((_, i) => Math.max(...rows.map((r) => String(r[i]).length)));
  console.log(`\n== ${metric} (ms) — mode=${mode} size=${size} ==`);
  for (const r of rows) {
    console.log(r.map((c, i) => String(c).padEnd(widths[i] + 2)).join(''));
  }
}

for (const mode of MODES.map((m) => m.name)) {
  for (const size of SIZES) {
    table(mode, size, 'warmMedianMs');
  }
}
console.log('\nFull results: results/results.json');
