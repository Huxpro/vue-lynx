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
 * Scales (nCards → ~elements = 4 + nCards*8):
 *   125 → ~1k,  375 → ~3k,  625 → ~5k,  1250 → ~10k
 *
 *   node build-scale-matrix.mjs [outDir=../web-bundles-scale]
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

import { generateProbe } from './generate.mjs';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(
  _dirname,
  process.argv[2] ?? path.join(_dirname, '../web-bundles-scale'),
);

const VARIANTS = [
  { id: 'vdom', mode: 'vdom', ifr: '0', et: '0', label: 'VDOM' },
  { id: 'vdom-ifr', mode: 'vdom', ifr: '1', et: '0', label: 'VDOM+IFR' },
  { id: 'vdom-ifr-et', mode: 'vdom', ifr: '1', et: '1', label: 'VDOM+IFR+ET' },
  { id: 'vapor', mode: 'vapor', ifr: '0', et: '0', label: 'Vapor' },
  { id: 'vapor-ifr', mode: 'vapor', ifr: '1', et: '0', label: 'Vapor+IFR' },
];

const SCALES = [
  { tag: '1k', nCards: 125 },
  { tag: '3k', nCards: 375 },
  { tag: '5k', nCards: 625 },
  { tag: '10k', nCards: 1250 },
];

const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;

fs.mkdirSync(outDir, { recursive: true });
const manifest = { variants: VARIANTS, scales: SCALES, cells: [] };

for (const scale of SCALES) {
  for (const v of VARIANTS) {
    const { elements } = generateProbe(v.mode, scale.nCards);
    fs.rmSync(path.join(_dirname, 'node_modules/.cache'), {
      recursive: true,
      force: true,
    });
    fs.rmSync(path.join(_dirname, 'dist'), { recursive: true, force: true });

    const name = `${v.id}@${scale.tag}`;
    console.log(
      `[build] ${name} (cards=${scale.nCards} ~${elements} els vapor=${
        v.mode === 'vapor' ? 1 : 0
      } ifr=${v.ifr} et=${v.et})`,
    );

    const t0 = Date.now();
    execFileSync(
      path.join(_dirname, 'node_modules/.bin/rspeedy'),
      ['build'],
      {
        cwd: _dirname,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          SFC_PROBE_VAPOR: v.mode === 'vapor' ? '1' : '0',
          SFC_PROBE_IFR: v.ifr,
          SFC_PROBE_ET: v.et,
        },
      },
    );

    const webBundlePath = path.join(_dirname, 'dist/main.web.bundle');
    const raw = fs.readFileSync(webBundlePath);
    const destName = `${name}.web.bundle`;
    fs.copyFileSync(webBundlePath, path.join(outDir, destName));

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
