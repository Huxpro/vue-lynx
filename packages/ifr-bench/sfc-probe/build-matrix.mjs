/**
 * Build the same-source matrix for browser FCP:
 *   VDOM:  off | ifr (ET=false) | ifr-et
 *   Vapor: off | ifr
 *
 * Vapor has no Element Templates path — tree protocol is always on.
 *
 *   node build-matrix.mjs [outDir=../web-bundles] [nCards=125]
 *
 * Also records raw/gzip sizes of each bundle and of its MT (lepusCode.root)
 * and BG (/app-service.js) sections into <outDir>/sfc-probe-sizes.json.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

import { generateProbe } from './generate.mjs';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(_dirname, process.argv[2] ?? '../web-bundles');
const nCards = Number(process.argv[3] ?? 125);

// Explicit ET flag: after #216, enableIFR alone defaults ET on for VDOM.
const CELLS = [
  { name: 'content-vdom', mode: 'vdom', ifr: '0', et: '0' },
  { name: 'content-vdom-ifr', mode: 'vdom', ifr: '1', et: '0' },
  { name: 'content-vdom-ifr-et', mode: 'vdom', ifr: '1', et: '1' },
  { name: 'content-vapor', mode: 'vapor', ifr: '0', et: '0' },
  { name: 'content-vapor-ifr', mode: 'vapor', ifr: '1', et: '0' },
];

const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;

fs.mkdirSync(outDir, { recursive: true });
const sizes = [];

for (const cell of CELLS) {
  generateProbe(cell.mode, nCards);
  // rspeedy's webpack persistent cache keys miss env-var-driven plugin
  // options; a stale cache serves the previous cell's bundle (AGENTS.md's #1
  // phantom-error cause). Clear it between cells.
  fs.rmSync(path.join(_dirname, 'node_modules/.cache'), {
    recursive: true,
    force: true,
  });
  fs.rmSync(path.join(_dirname, 'dist'), { recursive: true, force: true });
  console.log(
    `[build] ${cell.name} (vapor=${cell.mode === 'vapor' ? 1 : 0} ifr=${cell.ifr} et=${cell.et})`,
  );
  execFileSync(
    path.join(_dirname, 'node_modules/.bin/rspeedy'),
    ['build'],
    {
      cwd: _dirname,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        SFC_PROBE_VAPOR: cell.mode === 'vapor' ? '1' : '0',
        SFC_PROBE_IFR: cell.ifr,
        SFC_PROBE_ET: cell.et,
      },
    },
  );

  const webBundlePath = path.join(_dirname, 'dist/main.web.bundle');
  const raw = fs.readFileSync(webBundlePath);
  fs.copyFileSync(webBundlePath, path.join(outDir, `${cell.name}.web.bundle`));

  const parsed = JSON.parse(raw.toString('utf8'));
  const mt = Buffer.from(parsed.lepusCode?.root ?? '', 'utf8');
  const bg = Buffer.from(parsed.manifest?.['/app-service.js'] ?? '', 'utf8');
  const lynxBundlePath = path.join(_dirname, 'dist/main.lynx.bundle');
  const lynxRaw = fs.existsSync(lynxBundlePath)
    ? fs.readFileSync(lynxBundlePath)
    : null;
  sizes.push({
    cell: cell.name,
    flags: {
      vapor: cell.mode === 'vapor',
      enableIFR: cell.ifr === '1',
      enableElementTemplates: cell.et === '1',
    },
    webBundle: { raw: raw.length, gzip: gz(raw) },
    lynxBundle: lynxRaw ? { raw: lynxRaw.length, gzip: gz(lynxRaw) } : null,
    mtSection: { raw: mt.length, gzip: gz(mt) },
    bgSection: { raw: bg.length, gzip: gz(bg) },
  });
}

fs.writeFileSync(
  path.join(outDir, 'sfc-probe-sizes.json'),
  `${JSON.stringify({ nCards, cells: sizes }, null, 2)}\n`,
);
console.log(`\nbundles + sfc-probe-sizes.json written to ${outDir}`);
for (const s of sizes) {
  console.log(
    `${s.cell.padEnd(22)} web ${String(s.webBundle.raw).padStart(8)}B (gz ${s.webBundle.gzip})  MT ${
      String(s.mtSection.raw).padStart(8)
    }B (gz ${s.mtSection.gzip})  BG ${String(s.bgSection.raw).padStart(8)}B (gz ${s.bgSection.gzip})`,
  );
}
