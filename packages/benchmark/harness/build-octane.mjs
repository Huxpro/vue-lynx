/**
 * Build the Octane table app and stage its bundles under `apps/octane/`.
 *
 * Octane's Lynx renderer (`@octanejs/lynx`) is private and unpublished — it
 * only exists inside the octanejs/octane monorepo — and its toolchain is
 * pinned to a different Rspeedy major than ours (0.16 vs 0.13). So the app
 * cannot be built in this workspace. It is authored here (apps/octane/src,
 * mirroring apps/ui-vdom/src/App.vue operation-for-operation), copied into an
 * octane checkout, and built with octane's own toolchain. Only the produced
 * `.lynx.bundle` files come back — which is all the harness serves anyway, so
 * the measurement stays black-box and the two toolchains never have to agree.
 *
 *   OCTANE_REPO=/path/to/octane node harness/build-octane.mjs
 *   OCTANE_REPO=/path/to/octane BENCH_AUTOROWS=1000 node harness/build-octane.mjs
 *
 * The octane checkout needs its dependencies installed:
 *   pnpm install --filter "@octanejs/rspeedy-plugin..." --filter "@octanejs/lynx..."
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Example directory created inside the octane checkout. */
const STAGE_NAME = 'vue-lynx-bench-table';

export function buildOctaneApp({ silent = false } = {}) {
  const repo = process.env.OCTANE_REPO;
  if (!repo) {
    throw new Error(
      'set OCTANE_REPO to an octanejs/octane checkout with dependencies installed',
    );
  }
  const pluginDir = path.join(repo, 'packages/rspeedy-plugin-octane');
  if (!fs.existsSync(path.join(pluginDir, 'package.json'))) {
    throw new Error(`@octanejs/rspeedy-plugin not found under ${repo}`);
  }

  // Stage our sources into the octane workspace so `@octanejs/lynx`, `octane`
  // and the tsrx compiler resolve through octane's own node_modules.
  const src = path.join(root, 'apps/octane');
  const stage = path.join(pluginDir, 'examples', STAGE_NAME);
  fs.rmSync(stage, { recursive: true, force: true });
  fs.mkdirSync(path.join(stage, 'src'), { recursive: true });
  for (const file of ['lynx.config.mjs', 'tsconfig.json']) {
    fs.copyFileSync(path.join(src, file), path.join(stage, file));
  }
  for (const file of fs.readdirSync(path.join(src, 'src'))) {
    fs.copyFileSync(path.join(src, 'src', file), path.join(stage, 'src', file));
  }

  if (!silent) console.log('[bench] building octane table app (production)…');
  execFileSync('npx', ['rspeedy', 'build', '--root', `examples/${STAGE_NAME}`], {
    cwd: pluginDir,
    stdio: silent ? 'pipe' : 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });

  // Mount-create ladder variants land in sibling dists on both sides.
  const autoRows = Number(process.env.BENCH_AUTOROWS ?? '0') || 0;
  const suffix = autoRows > 0 ? `-rows${autoRows}` : '';
  const from = path.join(stage, `dist${suffix}`);
  const to = path.join(src, `dist${suffix}`);
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(to, { recursive: true });
  for (const file of fs.readdirSync(from)) {
    fs.copyFileSync(path.join(from, file), path.join(to, file));
  }
  fs.rmSync(stage, { recursive: true, force: true });
  if (!silent) console.log(`[bench] staged octane bundles → apps/octane/dist${suffix}`);
  return to;
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) buildOctaneApp();
