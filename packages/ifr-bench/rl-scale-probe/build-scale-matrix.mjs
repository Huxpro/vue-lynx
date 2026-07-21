/**
 * Build ReactLynx content-probe cells onto the shared scale ladder:
 *   react@1k … react@30k  →  ../web-bundles-scale/
 *
 * Same nCards → ~elements mapping as sfc-probe/build-scale-matrix.mjs.
 *
 *   node build-scale-matrix.mjs [outDir=../web-bundles-scale] [--only=1k,10k] [--force]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

import { generateReactProbe } from './generate.mjs';

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
const manifestPath = path.join(outDir, 'scale-manifest-react.json');
const prev = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : { cells: [] };
const cellByName = new Map((prev.cells ?? []).map((c) => [c.name, c]));
const manifest = { variant: 'react', scales: SCALES, cells: [] };

for (const scale of SCALES) {
  const name = `react@${scale.tag}`;
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

  const { elements } = generateReactProbe(scale.nCards);
  fs.rmSync(path.join(_dirname, 'node_modules/.cache'), {
    recursive: true,
    force: true,
  });
  fs.rmSync(path.join(_dirname, 'dist'), { recursive: true, force: true });

  console.log(
    `[build] ${name} (cards=${scale.nCards} ~${elements} els ReactLynx Snapshot+IFR)`,
  );

  const t0 = Date.now();
  const rspeedyJs = path.join(
    _dirname,
    'node_modules/@lynx-js/rspeedy/bin/rspeedy.js',
  );
  execFileSync(
    process.execPath,
    ['--stack-size=65536', rspeedyJs, 'build'],
    {
      cwd: _dirname,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    },
  );

  const webBundlePath = path.join(_dirname, 'dist/main.web.bundle');
  const raw = fs.readFileSync(webBundlePath);
  fs.copyFileSync(webBundlePath, destPath);

  // Newer ReactLynx rspeedy emits opaque binary .web.bundle (not the JSON
  // envelope Vue sfc-probe still uses). Fall back to whole-bundle sizes.
  let mtSection = null;
  let bgSection = null;
  try {
    const parsed = JSON.parse(raw.toString('utf8'));
    const mt = Buffer.from(parsed.lepusCode?.root ?? '', 'utf8');
    const bg = Buffer.from(parsed.manifest?.['/app-service.js'] ?? '', 'utf8');
    mtSection = { raw: mt.length, gzip: gz(mt) };
    bgSection = { raw: bg.length, gzip: gz(bg) };
  } catch {
    // binary envelope — ok
  }
  const lynxBundlePath = path.join(_dirname, 'dist/main.lynx.bundle');
  const lynxRaw = fs.existsSync(lynxBundlePath)
    ? fs.readFileSync(lynxBundlePath)
    : null;

  const cell = {
    name,
    variant: 'react',
    label: 'ReactLynx',
    scale: scale.tag,
    nCards: scale.nCards,
    elements,
    buildMs: Date.now() - t0,
    flags: { reactLynx: true, snapshot: true, ifr: 'always-on' },
    webBundle: { raw: raw.length, gzip: gz(raw) },
    lynxBundle: lynxRaw
      ? { raw: lynxRaw.length, gzip: gz(lynxRaw) }
      : null,
    mtSection,
    bgSection,
  };
  manifest.cells.push(cell);
  const mtNote = mtSection
    ? `MT gz ${(mtSection.gzip / 1024).toFixed(1)}KB`
    : `lynx gz ${((lynxRaw ? gz(lynxRaw) : 0) / 1024).toFixed(1)}KB`;
  console.log(
    `  → web gz ${(cell.webBundle.gzip / 1024).toFixed(1)}KB  ${mtNote}  (${cell.buildMs}ms)`,
  );
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\n${manifest.cells.length} react bundles → ${outDir}`);
