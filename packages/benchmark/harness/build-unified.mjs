/**
 * Build every Vue table-app cell in the unified architecture matrix.
 *
 *   node harness/build-unified.mjs [--only=vdom,vapor-ifr]
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { generateVaporUiApp, bundleSizes } from './build.mjs';
import { ARCHITECTURES } from './matrix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    only: { type: 'string' },
    'skip-react': { type: 'boolean', default: false },
  },
});

const only = args.only
  ? new Set(args.only.split(',').map((s) => s.trim()).filter(Boolean))
  : null;

const VUE_CELLS = [
  { id: 'vdom', app: 'ui-vdom', cell: 'off' },
  { id: 'vdom-ifr', app: 'ui-vdom', cell: 'ifr' },
  { id: 'vdom-ifr-et', app: 'ui-vdom', cell: 'ifr-et' },
  { id: 'vdom-et', app: 'ui-vdom', cell: 'et' },
  { id: 'vapor', app: 'ui-vapor', cell: 'off' },
  { id: 'vapor-ifr', app: 'ui-vapor', cell: 'ifr' },
  // Graph-eng four-axis cells (#301/#321/#325) — opt-in via --only=.
  { id: 'vapor-dense', app: 'ui-vapor', cell: 'dense' },
  { id: 'vapor-engine', app: 'ui-vapor', cell: 'engine' },
  { id: 'vapor-ifr-dense', app: 'ui-vapor', cell: 'ifr-dense' },
  { id: 'vapor-ifr-sparse', app: 'ui-vapor', cell: 'ifr-sparse' },
  { id: 'vapor-ifr-engine-et', app: 'ui-vapor', cell: 'ifr-engine-et' },
];

export function buildVueMatrix(filter = null) {
  generateVaporUiApp();
  for (const c of VUE_CELLS) {
    if (filter && !filter.has(c.id)) continue;
    const cwd = path.join(root, 'apps', c.app);
    // Clear webpack persistent cache — stale IFR/ET flags are a known footgun.
    fs.rmSync(path.join(cwd, 'node_modules/.cache'), {
      recursive: true,
      force: true,
    });
    const distName = c.cell === 'off' ? 'dist' : `dist-${c.cell}`;
    fs.rmSync(path.join(cwd, distName), { recursive: true, force: true });
    console.log(`[unified-build] ${c.id} (apps/${c.app} BENCH_CELL=${c.cell})`);
    execSync('npx rspeedy build', {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        BENCH_CELL: c.cell,
      },
    });
  }
}

export function buildReactMatrix(filter = null) {
  const reactModes = ['react', 'react-naive', 'react-compiler'];
  if (filter && !reactModes.some((m) => filter.has(m))) return;
  const cwd = path.join(root, 'apps/ui-react');
  const variants = [
    ['react', 'dist', 'npx rspeedy build'],
    ['react-naive', 'dist-naive', 'npx rspeedy build --config lynx.naive.config.ts'],
    [
      'react-compiler',
      'dist-compiler',
      'npx rspeedy build --config lynx.compiler.config.ts',
    ],
  ];
  for (const [id, dist, cmd] of variants) {
    if (filter && !filter.has(id)) continue;
    fs.rmSync(path.join(cwd, dist), { recursive: true, force: true });
    console.log(`[unified-build] ${id}`);
    execSync(cmd, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });
  }
}

export function buildUnified({ onlyIds = null, skipReact = false } = {}) {
  const filter = onlyIds ? new Set(onlyIds) : null;
  buildVueMatrix(filter);
  if (!skipReact) buildReactMatrix(filter);

  const dists = ARCHITECTURES.filter((a) => !filter || filter.has(a.id)).map(
    (a) => a.tableDist,
  );
  const sizes = bundleSizes(dists);
  console.log('[unified-build] bundle sizes:', JSON.stringify(sizes, null, 2));
  return sizes;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  buildUnified({
    onlyIds: only ? [...only] : null,
    skipReact: args['skip-react'],
  });
}
