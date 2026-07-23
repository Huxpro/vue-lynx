// Per-flag bundle-size accounting — the third cost dimension next to the
// storm factor decomposition (latency) and wire-bytes.mjs (wire traffic).
//
// For each graph-eng flag, build the SAME app in the flag-off and flag-on
// cells and report the marginal web/MT/BG size (raw + gzip). Because every
// runtime read of an axis goes through the per-package flags modules
// (runtime/src/flags.ts, main-thread/src/flags.ts), a flag's OFF build
// carries no residual and its delta is the flag's true bundle cost:
// bootstrap code + (for bundle-delivered cells) the baked residual.
//
// Also emits a `codeSurface` section — occurrences of each axis accessor /
// define across packages/vue-lynx/*/src — a crude but trackable
// maintenance-cost proxy per axis (grep the same names for the deletion
// list when retiring).
//
// Usage: node harness/flag-size.mjs [--skip-build]
//   → results/flag-size-latest.{json,md}

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { webBundleSections } from '../core/bundle.mjs';
import { buildVueMatrix } from './build-unified.mjs';
import { ARCHITECTURES } from './matrix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

const { values: args } = parseArgs({
  options: {
    'skip-build': { type: 'boolean', default: false },
  },
});

/**
 * One row per flag: marginal size of turning THAT flag on, everything else
 * held fixed (same app, same config otherwise). Pairs mirror the storm
 * factor pairs in graph-eng-unified-factors.mjs.
 */
const FLAG_PAIRS = [
  { flag: '+b (vapor naming block)', from: 'vapor-dense', to: 'vapor' },
  { flag: '+b! (vapor bundle delivery)', from: 'vapor', to: 'vapor-bang' },
  { flag: '+b:c (vapor code staging)', from: 'vapor', to: 'vapor-code' },
  { flag: '+b:e (vapor engine staging, stub on web)', from: 'vapor', to: 'vapor-engine' },
  { flag: '+ifr (vapor)', from: 'vapor', to: 'vapor-ifr' },
  { flag: '+b (vdom element templates)', from: 'vdom', to: 'vdom-et' },
  { flag: '+ifr (vdom)', from: 'vdom', to: 'vdom-ifr' },
  { flag: '+b on top of +ifr (vdom)', from: 'vdom-ifr', to: 'vdom-ifr-et' },
];

const CELL_IDS = [...new Set(FLAG_PAIRS.flatMap((p) => [p.from, p.to]))];

/** Axis accessors + defines whose grep count ≈ per-axis code surface. */
const CODE_SURFACE_SYMBOLS = {
  'naming (sparse/dense)': ['sparseNamingEnabled', '__VUE_LYNX_SPARSE_NAMING__'],
  'staging code (+b:c)': ['codeStagingRequested', 'RegisterVaporTemplate', 'BIND_VAPOR_TEMPLATE', 'INSTANTIATE_BOUND_TEMPLATE'],
  'delivery bundle (+b!)': ['bundleDeliveryRequested', 'RegisterVaporStructure', 'REGISTER_TREE_BUNDLE'],
  'staging engine (+b:e)': ['engineStagingRequested', 'EngineTemplate', '__VUE_LYNX_ENGINE_ET_STATUS__'],
  'ifr paint': ['__VUE_LYNX_IFR_PAINT__', 'ifrPaint'],
};

function distFor(cellId) {
  const arch = ARCHITECTURES.find((a) => a.id === cellId);
  if (!arch) throw new Error(`unknown cell id: ${cellId}`);
  return path.join(root, 'apps', arch.tableDist, 'main.web.bundle');
}

function scanCodeSurface() {
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.ts$/.test(e.name) && !/\.d\.ts$/.test(e.name)) files.push(p);
    }
  };
  walk(path.join(repoRoot, 'packages/vue-lynx'));
  const sources = files.map((f) => [f, fs.readFileSync(f, 'utf8')]);
  const out = {};
  for (const [axis, symbols] of Object.entries(CODE_SURFACE_SYMBOLS)) {
    let occurrences = 0;
    const touched = new Set();
    for (const [f, src] of sources) {
      for (const sym of symbols) {
        const n = src.split(sym).length - 1;
        if (n > 0) {
          occurrences += n;
          touched.add(path.relative(repoRoot, f));
        }
      }
    }
    out[axis] = { occurrences, files: [...touched].sort() };
  }
  return out;
}

function main() {
  if (!args['skip-build']) buildVueMatrix(new Set(CELL_IDS));

  const perCell = {};
  for (const id of CELL_IDS) {
    const sections = webBundleSections(distFor(id));
    if (!sections) throw new Error(`missing bundle for ${id} — build first`);
    perCell[id] = sections;
  }

  const delta = (a, b) => ({
    raw: b.raw - a.raw,
    gz: b.gz - a.gz,
    gzPct: a.gz ? +(((b.gz - a.gz) / a.gz) * 100).toFixed(1) : null,
  });
  const flags = FLAG_PAIRS.map(({ flag, from, to }) => {
    const a = perCell[from];
    const b = perCell[to];
    return {
      flag,
      from,
      to,
      web: delta(a.web, b.web),
      mt: a.mt && b.mt ? delta(a.mt, b.mt) : null,
      bg: a.bg && b.bg ? delta(a.bg, b.bg) : null,
    };
  });

  let sha = 'unknown';
  try {
    sha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
  } catch {}
  const result = {
    meta: {
      date: new Date().toISOString(),
      sha,
      note:
        'Marginal bundle size of turning ONE flag on (same app, everything '
        + 'else fixed; table app apps/ui-*). web = whole .web.bundle; '
        + 'mt/bg = lepusCode.root / app-service sections. Flag-off builds '
        + 'carry no residual (all axis reads go through the per-package '
        + 'flags modules), so deltas are true per-flag costs.',
    },
    perCell,
    flags,
    codeSurface: scanCodeSurface(),
  };

  fs.mkdirSync(path.join(root, 'results'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'results/flag-size-latest.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  );

  const kb = (n) => `${(n / 1024).toFixed(1)}k`;
  const cellTxt = (d) =>
    d
      ? `${d.gz >= 0 ? '+' : ''}${d.gz} B gz (${d.gzPct >= 0 ? '+' : ''}${d.gzPct}%)`
      : 'n/a';
  let md = '# Per-flag bundle-size cost (generated by harness/flag-size.mjs)\n\n';
  md += `- date: ${result.meta.date}; git: ${sha}\n- ${result.meta.note}\n\n`;
  md += '| flag | pair | Δweb (gz) | ΔMT (gz) | ΔBG (gz) |\n|---|---|---|---|---|\n';
  for (const f of flags) {
    md += `| ${f.flag} | ${f.from} → ${f.to} | ${cellTxt(f.web)} | ${cellTxt(f.mt)} | ${cellTxt(f.bg)} |\n`;
  }
  md += '\n## Per-cell absolute sizes (gzip)\n\n| cell | web | MT | BG |\n|---|---|---|---|\n';
  for (const [id, s] of Object.entries(perCell)) {
    md += `| ${id} | ${kb(s.web.gz)} | ${s.mt ? kb(s.mt.gz) : 'n/a'} | ${s.bg ? kb(s.bg.gz) : 'n/a'} |\n`;
  }
  md += '\n## Code surface per axis (occurrences across packages/vue-lynx/*/src)\n\n| axis | occurrences | files |\n|---|--:|--:|\n';
  for (const [axis, s] of Object.entries(result.codeSurface)) {
    md += `| ${axis} | ${s.occurrences} | ${s.files.length} |\n`;
  }
  fs.writeFileSync(path.join(root, 'results/flag-size-latest.md'), md);
  console.log(md);
}

main();
