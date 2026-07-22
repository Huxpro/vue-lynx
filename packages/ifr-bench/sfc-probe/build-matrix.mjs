/**
 * Build the same-source matrix for browser FCP + the four-axis graph-eng
 * matrix (#301/#321/#325). Cells carry four-axis coordinates
 * (staging/naming/provenance/deployment — see vue-lynx/internal/matrix):
 *   VDOM:  op-stream | +IFR | Code-Template (+IFR) | Code-Template no-IFR
 *   Vapor: Data-Template (sparse) ± IFR | Named Tree (dense) ± IFR |
 *          Engine-Template staging (probe; reports stub when the engine
 *          PAPI family is absent — never a faked win)
 *
 *   node build-matrix.mjs [outDir=../web-bundles] [nCards=125]
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

// Explicit flags — never rely on enableIFR→ET defaulting.
// `staging`/`ifrPaint` are optional overrides (axis A / axis D paint).
// `coord` is the four-axis label recorded into sfc-probe-sizes.json.
const CELLS = [
  { name: 'content-vdom', mode: 'vdom', ifr: '0', et: '0', sparse: '1',
    coord: 'OpStream/Dense/intrinsic/Split·Durable' },
  { name: 'content-vdom-ifr', mode: 'vdom', ifr: '1', et: '0', sparse: '1',
    coord: 'OpStream/Dense/intrinsic/Split·Durable+Ephemeral' },
  { name: 'content-vdom-ifr-et', mode: 'vdom', ifr: '1', et: '1', sparse: '1',
    coord: 'Code/Sparse/intrinsic/Split·Durable+Ephemeral' },
  // Code-Template without IFR — the §6 "create-benefit" cell.
  { name: 'content-vdom-et', mode: 'vdom', ifr: '0', et: '1', sparse: '1',
    coord: 'Code/Sparse/intrinsic/Split·Durable' },
  { name: 'content-vapor', mode: 'vapor', ifr: '0', et: '0', sparse: '1',
    coord: 'Data/Sparse/recovered/Split·Durable' },
  // Named Tree without IFR — dense naming main-effect anchor.
  { name: 'content-vapor-dense', mode: 'vapor', ifr: '0', et: '0', sparse: '0',
    coord: 'Data/Dense/—/Split·Durable' },
  { name: 'content-vapor-ifr', mode: 'vapor', ifr: '1', et: '0', sparse: '1',
    coord: 'Data/Sparse/recovered/Split·Durable+Ephemeral' },
  // Graph-eng naming-density pair (#301): same IFR vapor, A1 vs A2.
  {
    name: 'content-vapor-ifr-dense',
    mode: 'vapor',
    ifr: '1',
    et: '0',
    sparse: '0',
    coord: 'Data/Dense/—/Split·Durable+Ephemeral',
  },
  {
    name: 'content-vapor-ifr-sparse',
    mode: 'vapor',
    ifr: '1',
    et: '0',
    sparse: '1',
    coord: 'Data/Sparse/recovered/Split·Durable+Ephemeral',
  },
  // Engine staging (#323): probe + stub fallback. On Lynx-for-Web the
  // engine ET PAPI family is absent → the MT reports 'stub' and interprets;
  // this cell measures the probe overhead honestly, not a faked engine win.
  {
    name: 'content-vapor-engine',
    mode: 'vapor',
    ifr: '0',
    et: '0',
    sparse: '1',
    staging: 'engine',
    coord: 'Engine/Sparse/recovered/Split·Durable (stub-capable)',
  },
  {
    name: 'content-vapor-ifr-engine-et',
    mode: 'vapor',
    ifr: '1',
    et: '0',
    sparse: '1',
    ifrPaint: 'engine-et',
    coord: 'Data/Sparse/recovered/Split·Durable+Ephemeral(engine-et paint)',
  },
];

const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;

fs.mkdirSync(outDir, { recursive: true });
const sizes = [];

for (const cell of CELLS) {
  generateProbe(cell.mode, nCards);
  fs.rmSync(path.join(_dirname, 'node_modules/.cache'), {
    recursive: true,
    force: true,
  });
  fs.rmSync(path.join(_dirname, 'dist'), { recursive: true, force: true });
  console.log(
    `[build] ${cell.name} (vapor=${cell.mode === 'vapor' ? 1 : 0} ifr=${cell.ifr} et=${cell.et} sparse=${cell.sparse})`,
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
        SFC_PROBE_SPARSE: cell.sparse,
        ...(cell.staging ? { SFC_PROBE_STAGING: cell.staging } : {}),
        ...(cell.ifrPaint ? { SFC_PROBE_IFR_PAINT: cell.ifrPaint } : {}),
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
      templateNaming: cell.sparse === '1' ? 'sparse' : 'dense',
      templateStaging: cell.staging
        ?? (cell.mode === 'vapor' ? 'data' : (cell.et === '1' ? 'code' : 'opstream')),
      ifrPaint: cell.ifrPaint ?? (cell.ifr === '1' ? 'plain' : null),
      slots: cell.et === '1' ? 'on' : 'off',
      naming: cell.mode === 'vapor'
        ? (cell.sparse === '1' ? 'sparse' : 'dense')
        : 'n/a',
      coordinate: cell.coord,
      // Engine staging is honest-by-construction: the MT publishes
      // __VUE_LYNX_ENGINE_ET_STATUS__ = 'native'|'stub' at runtime.
      nativeEt: cell.staging === 'engine' ? 'probe(stub-on-web)' : 'stub',
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
    `${s.cell.padEnd(28)} web gz ${String(s.webBundle.gzip).padStart(7)}  `
      + `slots=${s.flags.slots} naming=${s.flags.naming} native=${s.flags.nativeEt}`,
  );
}
