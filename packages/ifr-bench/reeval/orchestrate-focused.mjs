/**
 * Focused IFR/ET reevaluation build matrix.
 *
 * Fixes the post-#216 flag semantics bug in examples-sweep/orchestrate.mjs:
 * `enableIFR: true` alone now ALSO enables Element Templates by default, so
 * the old `ifr` inject (without an explicit opt-out) was identical to `ifr-et`.
 *
 * Configs measured:
 *   off     — enableIFR: false, enableElementTemplates: false
 *   et      — ET only (advanced composition)
 *   ifr     — IFR without ET (explicit enableElementTemplates: false)
 *   ifr-et  — IFR + ET (product default when enableIFR: true)
 *
 *   node packages/ifr-bench/reeval/orchestrate-focused.mjs <bundles-out-dir>
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(_dirname, '../../..');
const examplesDir = path.join(repoRoot, 'examples');
const outDir = process.argv[2];
if (!outDir) throw new Error('usage: orchestrate-focused.mjs <bundles-out-dir>');

/** Focus set: small sanity + TodoMVC + larger apps the published matrix skipped. */
export const ENTRIES = {
  'hello-world': 'main',
  todomvc: 'main',
  'todomvc-day1': 'main',
  gallery: 'GalleryComplete',
  'hackernews-css': 'main',
  'ai-chat': 'main',
  elk: 'main',
};

/**
 * Explicit flags for every dimension — never rely on defaults for a benchmark.
 * Comments are stripped by rewriteConfig, so keep inject as pure option lines.
 */
const CONFIGS = {
  off: '      enableIFR: false,\n      enableElementTemplates: false,\n',
  et: '      enableIFR: false,\n      enableElementTemplates: true,\n',
  ifr: '      enableIFR: true,\n      enableElementTemplates: false,\n',
  'ifr-et': '      enableIFR: true,\n      enableElementTemplates: true,\n',
};

function rewriteConfig(configPath, inject) {
  let src = fs.readFileSync(configPath, 'utf8');
  src = src.replace(/^\s*\/\/.*(?:IFR|first screen|Element templates|first frame|snapshot).*\n/gim, '');
  src = src.replace(/^\s*enable(?:IFR|ElementTemplates):.*\n/gm, '');
  if (!/pluginVueLynx\(\{/.test(src)) {
    src = src.replace(/pluginVueLynx\(\)/, 'pluginVueLynx({})');
    src = src.replace(/pluginVueLynx\(\{\}\)/, 'pluginVueLynx({\n    })');
  }
  src = src.replace(/pluginVueLynx\(\{\n?/, `pluginVueLynx({\n${inject}`);
  fs.writeFileSync(configPath, src);
}

function gzipSize(buf) {
  return execFileSync('gzip', ['-c'], { input: buf }).length;
}

const results = [];
fs.mkdirSync(outDir, { recursive: true });

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
        timeout: 360_000,
      });
    } catch (e) {
      ok = false;
      err = String(e.stderr ?? e.stdout ?? e).slice(-600);
    }
    const buildMs = Date.now() - t0;

    const sizes = {};
    for (const platform of ['web', 'lynx']) {
      const bundle = path.join(dir, 'dist', `${entry}.${platform}.bundle`);
      const dest = path.join(outDir, `${example}-${cfg}.${platform}.bundle`);
      if (ok && fs.existsSync(bundle)) {
        fs.copyFileSync(bundle, dest);
        const raw = fs.readFileSync(bundle);
        sizes[platform] = {
          bytes: raw.length,
          gzip: gzipSize(raw),
        };
      } else if (ok) {
        ok = false;
        err = `bundle missing: ${entry}.${platform}.bundle`;
      }
    }
    results.push({ example, entry, cfg, ok, buildMs, err, sizes });
    console.log(
      `${ok ? 'OK  ' : 'FAIL'} ${example.padEnd(16)} ${cfg.padEnd(7)} ${
        String(buildMs).padStart(6)
      }ms  web.gz=${sizes.web ? (sizes.web.gzip / 1024).toFixed(1) + 'KiB' : '-'}  ${err}`,
    );
  }
  fs.writeFileSync(configPath, original);
}

fs.writeFileSync(
  path.join(outDir, 'builds.json'),
  JSON.stringify(results, null, 2),
);
console.log('done:', results.filter((r) => r.ok).length, '/', results.length);
