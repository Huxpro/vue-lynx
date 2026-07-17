/**
 * Measurement sweep over the bundles produced by orchestrate.mjs.
 *
 *   node examples-sweep/sweep.mjs <bundles-dir> [samples=5]
 *
 * For every example × config × engine mode, runs measure-run.mjs in fresh
 * subprocesses and aggregates medians; collects size metrics from the .lynx
 * bundle (raw + gzip) and the web bundle's MT/BG section split; checks that
 * every config renders the same final document. Writes results to
 * results/examples-results.json.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlesDir = process.argv[2];
const SAMPLES = Number(process.argv[3] ?? 5);
const CONFIGS = ['off', 'ifr', 'ifr-et'];
const MODES = [
  { name: 'v8', args: [] },
  { name: 'jitless', args: ['--jitless'] },
];

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const results = [];

for (const example of fs.readdirSync(bundlesDir).sort()) {
  const dir = path.join(bundlesDir, example);
  if (!fs.statSync(dir).isDirectory()) continue;

  const docs = {};
  for (const cfg of CONFIGS) {
    const webBundle = path.join(dir, `${cfg}.web.bundle`);
    const lynxBundle = path.join(dir, `${cfg}.lynx.bundle`);
    if (!fs.existsSync(webBundle)) continue;

    // Sizes.
    const lynxRaw = fs.statSync(lynxBundle).size;
    const lynxGz = zlib.gzipSync(fs.readFileSync(lynxBundle)).length;
    const web = JSON.parse(fs.readFileSync(webBundle, 'utf8'));
    const mtBytes = web.lepusCode.root.length;
    const bgBytes = Object.values(web.manifest)[0]?.length ?? 0;

    const entry = { example, cfg, lynxRaw, lynxGz, mtBytes, bgBytes };

    for (const mode of MODES) {
      const runs = [];
      for (let i = 0; i < SAMPLES; i++) {
        try {
          const out = execFileSync(
            process.execPath,
            [...mode.args, path.join(_dirname, 'measure-run.mjs'), webBundle],
            { encoding: 'utf8', timeout: 60_000 },
          );
          runs.push(JSON.parse(out.trim().split('\n').pop()));
        } catch (e) {
          entry[`${mode.name}Error`] = String(e).slice(0, 200);
          break;
        }
      }
      if (runs.length === 0) continue;
      const r0 = runs[0];
      const mt = median(runs.map((r) => r.mtEvalMs));
      const mtParse = median(runs.map((r) => r.mtParseMs));
      const mtExec = median(runs.map((r) => r.mtExecMs));
      const rp = median(runs.map((r) => r.renderPageMs));
      const bg = median(runs.map((r) => r.bgMs));
      const painted = r0.contentAtRenderPage > 0;
      entry[mode.name] = {
        mtEvalMs: mt,
        mtParseMs: mtParse,
        mtExecMs: mtExec,
        renderPageMs: rp,
        bgMs: bg,
        fcpMs: painted ? mt + rp : mt + rp + bg,
        // Device proxy: lepus ships as precompiled bytecode, so the MT
        // parse component does not exist on devices.
        fcpDeviceMs: painted ? mtExec + rp : mtExec + rp + bg,
        ttiMs: mt + rp + bg,
        ttiDeviceMs: mtExec + rp + bg,
        contentAtRenderPage: r0.contentAtRenderPage,
        contentFinal: r0.contentFinal,
        firstBatchBytes: r0.firstBatchBytes,
        batches: r0.batches,
        bgError: r0.bgError,
      };
      if (mode.name === 'v8') docs[cfg] = r0.doc;
    }
    results.push(entry);
    const v = entry.v8;
    console.log(
      `${example.padEnd(20)} ${cfg.padEnd(7)} ${
        v
          ? `fcp ${v.fcpMs.toFixed(1).padStart(7)}ms  tti ${
            v.ttiMs.toFixed(1).padStart(7)
          }ms  nodes ${String(v.contentFinal).padStart(4)} ${
            v.bgError ? ' bgErr' : ''
          }`
          : 'FAILED'
      }`,
    );
  }

  // Correctness across configs (final documents must match).
  const base = docs['off'];
  for (const cfg of ['ifr', 'ifr-et']) {
    if (base && docs[cfg] !== undefined) {
      const entry = results.find((r) => r.example === example && r.cfg === cfg);
      entry.docMatchesOff = docs[cfg] === base;
      if (!entry.docMatchesOff) {
        console.log(`  ⚠ ${example}/${cfg}: final document differs from off`);
      }
    }
  }
}

const outPath = path.resolve(_dirname, '../results/examples-results.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log('wrote', outPath);
