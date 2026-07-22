/**
 * Build the architecture × scale matrix for FCP trend charts.
 *
 * Variants (product-relevant architectures):
 *   vdom            — IFR off, ET off
 *   vdom-ifr        — IFR on,  ET off
 *   vdom-ifr-et     — IFR on,  ET on  (VDOM product default with IFR)
 *   vapor           — IFR off
 *   vapor-ifr       — IFR on
 *
 * Scales (nCards → ~elements = 4 + nCards*8), matching the playground ladder:
 *   125 → ~1k,  375 → ~3k,  625 → ~5k,  1250 → ~10k,
 *   2500 → ~20k, 3750 → ~30k
 *
 *   node build-scale-matrix.mjs [outDir=../web-bundles-scale] [--only=20k,30k]
 *   Existing cells are kept; pass --force to rebuild every cell.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

import { generateProbe } from './generate.mjs';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const onlyFlag = [...flags].find((f) => f.startsWith('--only='));
const onlyTags = onlyFlag
  ? new Set(onlyFlag.slice('--only='.length).split(',').filter(Boolean))
  : null;
const force = flags.has('--force');

const outDir = path.resolve(
  _dirname,
  args[0] ?? path.join(_dirname, '../web-bundles-scale'),
);

const VARIANTS = [
  { id: 'vdom', mode: 'vdom', ifr: '0', et: '0', label: 'VDOM' },
  { id: 'vdom-et', mode: 'vdom', ifr: '0', et: '1', label: 'VDOM+ET (no IFR)' },
  { id: 'vdom-ifr', mode: 'vdom', ifr: '1', et: '0', label: 'VDOM+IFR' },
  { id: 'vdom-ifr-et', mode: 'vdom', ifr: '1', et: '1', label: 'VDOM+IFR+ET' },
  { id: 'vapor', mode: 'vapor', ifr: '0', et: '0', label: 'Vapor' },
  { id: 'vapor-dense', mode: 'vapor', ifr: '0', et: '0', sparse: '0', label: 'Vapor dense' },
  { id: 'vapor-engine', mode: 'vapor', ifr: '0', et: '0', staging: 'engine', label: 'Vapor engine (stub)' },
  { id: 'vapor-ifr', mode: 'vapor', ifr: '1', et: '0', label: 'Vapor+IFR' },
  { id: 'vapor-ifr-dense', mode: 'vapor', ifr: '1', et: '0', sparse: '0', label: 'Vapor+IFR dense' },
  { id: 'vapor-ifr-engine-et', mode: 'vapor', ifr: '1', et: '0', ifrPaint: 'engine-et', label: 'Vapor+IFR engine-et (stub)' },
];

const SCALES = [
  { tag: '1k', nCards: 125 },
  { tag: '3k', nCards: 375 },
  { tag: '5k', nCards: 625 },
  { tag: '10k', nCards: 1250 },
  { tag: '20k', nCards: 2500 },
  { tag: '30k', nCards: 3750 },
];

const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;

fs.mkdirSync(outDir, { recursive: true });
const manifestPath = path.join(outDir, 'scale-manifest.json');
const prev = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : { cells: [] };
const cellByName = new Map((prev.cells ?? []).map((c) => [c.name, c]));
const manifest = { variants: VARIANTS, scales: SCALES, cells: [] };

for (const scale of SCALES) {
  for (const v of VARIANTS) {
    const name = `${v.id}@${scale.tag}`;
    const destName = `${name}.web.bundle`;
    const destPath = path.join(outDir, destName);
    if (onlyTags && !onlyTags.has(scale.tag)) {
      if (cellByName.has(name)) manifest.cells.push(cellByName.get(name));
      continue;
    }
    if (!force && fs.existsSync(destPath) && cellByName.has(name)) {
      console.log(`[skip] ${name} (already built)`);
      manifest.cells.push(cellByName.get(name));
      continue;
    }

    const { elements } = generateProbe(v.mode, scale.nCards);
    fs.rmSync(path.join(_dirname, 'node_modules/.cache'), {
      recursive: true,
      force: true,
    });
    fs.rmSync(path.join(_dirname, 'dist'), { recursive: true, force: true });

    console.log(
      `[build] ${name} (cards=${scale.nCards} ~${elements} els vapor=${
        v.mode === 'vapor' ? 1 : 0
      } ifr=${v.ifr} et=${v.et})`,
    );

    const t0 = Date.now();
    const rspeedyJs = path.join(
      _dirname,
      'node_modules/@lynx-js/rspeedy/bin/rspeedy.js',
    );
    // Large unrolled SFCs (vapor especially) need a deeper V8 stack than
    // the default ~1k frames — otherwise the Vue compiler overflows.
    execFileSync(
      process.execPath,
      ['--stack-size=65536', rspeedyJs, 'build'],
      {
        cwd: _dirname,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          SFC_PROBE_VAPOR: v.mode === 'vapor' ? '1' : '0',
          SFC_PROBE_IFR: v.ifr,
          SFC_PROBE_ET: v.et,
          SFC_PROBE_SPARSE: v.sparse ?? '1',
          ...(v.staging ? { SFC_PROBE_STAGING: v.staging } : {}),
          ...(v.ifrPaint ? { SFC_PROBE_IFR_PAINT: v.ifrPaint } : {}),
        },
      },
    );

    const webBundlePath = path.join(_dirname, 'dist/main.web.bundle');
    const raw = fs.readFileSync(webBundlePath);
    fs.copyFileSync(webBundlePath, destPath);

    const parsed = JSON.parse(raw.toString('utf8'));
    const mt = Buffer.from(parsed.lepusCode?.root ?? '', 'utf8');
    const bg = Buffer.from(parsed.manifest?.['/app-service.js'] ?? '', 'utf8');
    const lynxBundlePath = path.join(_dirname, 'dist/main.lynx.bundle');
    const lynxRaw = fs.existsSync(lynxBundlePath)
      ? fs.readFileSync(lynxBundlePath)
      : null;

    const cell = {
      name,
      variant: v.id,
      label: v.label,
      scale: scale.tag,
      nCards: scale.nCards,
      elements,
      buildMs: Date.now() - t0,
      flags: {
        vapor: v.mode === 'vapor',
        enableIFR: v.ifr === '1',
        enableElementTemplates: v.et === '1',
      },
      webBundle: { raw: raw.length, gzip: gz(raw) },
      lynxBundle: lynxRaw
        ? { raw: lynxRaw.length, gzip: gz(lynxRaw) }
        : null,
      mtSection: { raw: mt.length, gzip: gz(mt) },
      bgSection: { raw: bg.length, gzip: gz(bg) },
    };
    manifest.cells.push(cell);
    console.log(
      `  → web gz ${(cell.webBundle.gzip / 1024).toFixed(1)}KB  MT gz ${
        (cell.mtSection.gzip / 1024).toFixed(1)
      }KB  (${cell.buildMs}ms)`,
    );
  }
}

fs.writeFileSync(
  path.join(outDir, 'scale-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`\n${manifest.cells.length} bundles → ${outDir}`);
