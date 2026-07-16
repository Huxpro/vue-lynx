/**
 * Example sweep orchestrator: builds every example under three configs
 * (off / ifr / ifr+et), stashing the produced bundles for measurement.
 *
 *   node examples-sweep/orchestrate.mjs <bundles-out-dir>
 *
 * Configs are produced by rewriting each example's lynx.config.ts in place
 * (existing enableIFR/enableElementTemplates lines stripped, flags injected
 * after `pluginVueLynx({`). Restore with `git checkout -- examples` after.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(_dirname, '../../..');
const examplesDir = path.join(repoRoot, 'examples');
const outDir = process.argv[2];
if (!outDir) throw new Error('usage: orchestrate.mjs <bundles-out-dir>');

/** example → entry to measure (tutorials: completed state). */
export const ENTRIES = {
  '7guis': 'cells',
  basic: 'main',
  'css-features': 'main',
  gallery: 'GalleryComplete',
  'hackernews-css': 'main',
  'hackernews-tailwind': 'main',
  'hello-world': 'main',
  'keep-alive': 'main',
  'main-thread': 'cross-thread-calls',
  networking: 'main',
  'option-api': 'main',
  pinia: 'main',
  'provide-inject': 'main',
  reactivity: 'main',
  slots: 'main',
  suspense: 'main',
  swiper: 'Swiper',
  tailwindcss: 'main',
  todomvc: 'main',
  'todomvc-codex': 'main',
  'todomvc-day1': 'main',
  transition: 'transition',
  'v-model': 'main',
  'vue-router': 'main',
  // 'event-modifiers': pre-existing VueCompilerError on the base branch — skipped
};

const CONFIGS = {
  off: '',
  ifr: '      enableIFR: true,\n',
  'ifr-et': '      enableIFR: true,\n      enableElementTemplates: true,\n',
};

function rewriteConfig(configPath, inject) {
  let src = fs.readFileSync(configPath, 'utf8');
  // Strip any existing flags (and the descriptive comments above them).
  src = src.replace(/^\s*\/\/.*(?:IFR|first screen|Element templates|first frame|snapshot).*\n/gim, '');
  src = src.replace(/^\s*enable(?:IFR|ElementTemplates):.*\n/gm, '');
  if (!/pluginVueLynx\(\{/.test(src)) {
    src = src.replace(/pluginVueLynx\(\)/, 'pluginVueLynx({})');
    src = src.replace(/pluginVueLynx\(\{\}\)/, 'pluginVueLynx({\n    })');
  }
  src = src.replace(/pluginVueLynx\(\{\n?/, `pluginVueLynx({\n${inject}`);
  fs.writeFileSync(configPath, src);
}

const results = [];
for (const [example, entry] of Object.entries(ENTRIES)) {
  const dir = path.join(examplesDir, example);
  const configPath = path.join(dir, 'lynx.config.ts');
  const original = fs.readFileSync(configPath, 'utf8');

  for (const [cfg, inject] of Object.entries(CONFIGS)) {
    fs.writeFileSync(configPath, original);
    rewriteConfig(configPath, inject);
    fs.rmSync(path.join(dir, 'dist'), { recursive: true, force: true });
    fs.rmSync(path.join(dir, 'node_modules/.cache'), {
      recursive: true,
      force: true,
    });
    const t0 = Date.now();
    let ok = true;
    let err = '';
    try {
      execFileSync('pnpm', ['build'], {
        cwd: dir,
        stdio: 'pipe',
        timeout: 240_000,
      });
    } catch (e) {
      ok = false;
      err = String(e.stdout ?? e).slice(-400);
    }
    const buildMs = Date.now() - t0;

    const destDir = path.join(outDir, example);
    fs.mkdirSync(destDir, { recursive: true });
    for (const platform of ['web', 'lynx']) {
      const bundle = path.join(dir, 'dist', `${entry}.${platform}.bundle`);
      if (ok && fs.existsSync(bundle)) {
        fs.copyFileSync(bundle, path.join(destDir, `${cfg}.${platform}.bundle`));
      } else if (ok) {
        ok = false;
        err = `bundle missing: ${entry}.${platform}.bundle`;
      }
    }
    results.push({ example, entry, cfg, ok, buildMs, err });
    console.log(
      `${ok ? 'OK  ' : 'FAIL'} ${example.padEnd(20)} ${cfg.padEnd(7)} ${buildMs}ms ${err}`,
    );
  }
  fs.writeFileSync(configPath, original);
}

fs.writeFileSync(
  path.join(outDir, 'builds.json'),
  JSON.stringify(results, null, 2),
);
console.log('done:', results.filter((r) => r.ok).length, '/', results.length);
