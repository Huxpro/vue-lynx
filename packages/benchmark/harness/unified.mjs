#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { profiles, suites } from '../benchmark.config.mjs';
import { auditRecords, normalizeMode, statsToRecords } from './unified-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');
const { values: args } = parseArgs({ options: {
  profile: { type: 'string', default: 'quick' },
  run: { type: 'boolean', default: false },
  'skip-prepare': { type: 'boolean', default: false },
  suite: { type: 'string' },
  out: { type: 'string', default: 'results/unified' },
} });

function readJson(relative) {
  const file = path.resolve(repoRoot, relative);
  if (!fs.existsSync(file)) return null;
  return { file, value: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

function internalRecords(input) {
  if (!input) return [];
  const out = [];
  for (const [mode, ops] of Object.entries(input.value.perOp ?? {})) {
    for (const [workload, metrics] of Object.entries(ops)) {
      out.push(...statsToRecords({
        suite: 'internal', environment: 'lynx-for-web', variant: normalizeMode(mode),
        workload, scale: workload.includes('10k') ? 10000 : 1000,
        boundary: 'mixed-internal', revision: input.value.meta?.sha ?? 'unknown',
      }, metrics, path.relative(repoRoot, input.file)));
    }
  }
  for (const [mode, stat] of Object.entries(input.value.startup ?? {})) {
    out.push(...statsToRecords({
      suite: 'internal', environment: 'lynx-for-web', variant: normalizeMode(mode), workload: 'startup',
      scale: 1, boundary: 'view-attach-to-benchmark-title', revision: input.value.meta?.sha ?? 'unknown',
    }, { startup: stat }, path.relative(repoRoot, input.file)));
  }
  return out.map((r) => ({ ...r, boundary: r.metric === 'bg' ? 'bg-next-tick' : r.metric === 'e2e' ? 'mt-ack' : r.boundary }));
}

function crossRecords(input, suite = 'cross') {
  if (!input) return [];
  const out = [];
  for (const [mode, ops] of Object.entries(input.value.perOp ?? {})) {
    for (const [workload, stat] of Object.entries(ops)) {
      const match = workload.match(/@(\d+)k$/);
      const scale = match ? Number(match[1]) * 1000 : workload.includes('10k') ? 10000 : 1000;
      out.push(...statsToRecords({
        suite, environment: 'lynx-for-web', variant: normalizeMode(mode), workload,
        scale, boundary: 'pointerdown-to-dom-predicate', revision: input.value.meta?.sha ?? 'unknown',
      }, { latency: stat }, path.relative(repoRoot, input.file)));
    }
  }
  for (const [mode, stat] of Object.entries(input.value.startup ?? {})) {
    out.push(...statsToRecords({
      suite, environment: 'lynx-for-web', variant: normalizeMode(mode), workload: 'startup', scale: 1,
      boundary: 'view-attach-to-benchmark-title', revision: input.value.meta?.sha ?? 'unknown',
    }, { startup: stat }, path.relative(repoRoot, input.file)));
  }
  return out;
}

function ifrModelRecords(input) {
  if (!input) return [];
  return input.value.flatMap((row) => ['coldMs', 'warmMedianMs', 'warmP95Ms'].map((metric) => ({
    suite: 'ifr-model', environment: `node-counting-papi-${row.mode}`, variant: row.variant,
    workload: row.scene, scale: row.size, metric, boundary: 'synchronous-render', unit: 'ms',
    n: null, median: row[metric], mean: null, std: null, ci95: null, samples: null,
    revision: 'unknown', source: path.relative(repoRoot, input.file),
  })));
}

function ifrBrowserRecords(input, cpuThrottle) {
  if (!input) return [];
  return input.value.flatMap((row) => {
    const match = row.bundle.match(/^(.+?)@(\d+)k\.web\.bundle$/);
    if (!match) return [];
    return [
      ['fcp', 'view-attach-to-first-contentful-paint', row.fcps, row.fcpMedianMs],
      ['settled', 'view-attach-to-dom-settled', row.settleds, row.settledMedianMs],
    ].map(([metric, boundary, samples, median]) => ({
      suite: 'ifr-browser', environment: `lynx-for-web-cpu-x${cpuThrottle}`, variant: match[1], workload: 'first-frame',
      scale: Number(match[2]) * 1000, metric, boundary, unit: 'ms', n: samples.length, median,
      mean: samples.reduce((a, b) => a + b, 0) / samples.length, std: null, ci95: null, samples,
      revision: 'unknown', source: path.relative(repoRoot, input.file),
    }));
  });
}

function runSelected() {
  const selected = args.suite ? args.suite.split(',') : profiles[args.profile];
  if (!selected) throw new Error(`unknown profile: ${args.profile}`);
  if (!args['skip-prepare']) {
    console.error('\n[unified] preparing workspace library: pnpm build');
    execFileSync('pnpm', ['build'], { cwd: repoRoot, stdio: 'inherit' });
  }
  for (const name of selected) {
    const suite = suites[name];
    if (!suite) throw new Error(`unknown suite: ${name}`);
    const [command, ...baseArgs] = suite.command;
    console.error(`\n[unified] running ${name}: ${[command, ...baseArgs, ...suite.quickArgs].join(' ')}`);
    execFileSync(command, [...baseArgs, ...suite.quickArgs], { cwd: root, stdio: 'inherit' });
  }
}

if (args.run) runSelected();

const inputs = {
  internal: readJson('packages/benchmark/results/latest.json'),
  cross: readJson('packages/benchmark/results/cross-latest.json'),
  scale: readJson(args.run ? 'packages/benchmark/results/cross-storms-latest.json' : 'packages/benchmark/results/cross-storms-scale6.json'),
  ifrModel: readJson('packages/ifr-bench/results/results.json'),
  ifrBrowser1: readJson('packages/ifr-bench/results/browser-results-scale-x1.json'),
  ifrBrowser4: readJson('packages/ifr-bench/results/browser-results-scale-x4.json'),
};
const records = [
  ...internalRecords(inputs.internal), ...crossRecords(inputs.cross), ...crossRecords(inputs.scale, 'scale'),
  ...ifrModelRecords(inputs.ifrModel), ...ifrBrowserRecords(inputs.ifrBrowser1, 1), ...ifrBrowserRecords(inputs.ifrBrowser4, 4),
].sort((a, b) => `${a.suite}${a.workload}${a.variant}${a.metric}`.localeCompare(`${b.suite}${b.workload}${b.variant}${b.metric}`));
const audit = auditRecords(records);
const dimensions = Object.fromEntries(['suite', 'environment', 'variant', 'workload', 'scale', 'metric', 'boundary', 'revision']
  .map((key) => [key, [...new Set(records.map((r) => r[key]))].sort()]));

const outputBase = path.resolve(root, args.out);
fs.mkdirSync(path.dirname(outputBase), { recursive: true });
fs.writeFileSync(`${outputBase}.json`, JSON.stringify({
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  host: { platform: process.platform, arch: process.arch, node: process.version, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model },
  dimensions, records,
}, null, 2));

const missing = [];
const coreVariants = ['react', 'vue-vdom', 'vue-vapor'];
for (const workload of ['create@1k', 'update10th@1k', 'select@1k', 'updateStorm@1k', 'selectStorm@1k', 'create@10k', 'updateStorm@10k', 'selectStorm@10k']) {
  for (const variant of coreVariants) {
    if (!records.some((r) => r.suite === 'scale' && r.workload === workload && r.variant === variant)) missing.push(`${workload} × ${variant}`);
  }
}
const revisions = dimensions.revision.filter((x) => x !== 'unknown');
const md = `# Unified benchmark audit\n\nGenerated: ${new Date().toISOString()}\n\n## Outcome\n\n- Normalized records: **${records.length}**\n- Strictly comparable groups (2+ variants): **${audit.comparable.length}**\n- Single-variant / non-comparable groups: **${audit.singleton.length}**\n- Historical revisions mixed in this import: **${revisions.join(', ') || 'not recorded'}**\n- Missing cells in the core scale matrix: **${missing.length}**\n\n## Comparability contract\n\nRatios are valid only when environment (including throttle), workload, scale, metric, timing boundary, unit, and revision all match. Suite names and milliseconds alone do not establish comparability.\n\n## Assumptions challenged\n\n1. **All three suites run on Lynx for Web — false.** The IFR strategy ladder is a Node counting-PAPI cost model. Only its separate browser campaign is Lynx for Web.\n2. **Startup/FCP numbers share one scale — false.** The Vue benchmark waits for a title predicate; IFR uses browser FCP and DOM-settled boundaries. They are retained as separate metrics.\n3. **Internal e2e and black-box latency are interchangeable — false.** MT acknowledgement excludes input and frame alignment; pointerdown→predicate includes both.\n4. **The historical corpus is one controlled run — false.** It mixes revisions (${revisions.join(', ') || 'unknown'}) and results without recorded revisions. Revision is part of the comparison key; use \`--run\` for a fresh campaign.\n5. **CPU ×1 and ×4 IFR runs can be pooled — false.** Throttle is now encoded in the environment dimension.\n6. **Every mode is covered at scale — ${missing.length ? 'false' : 'true for the imported core scale matrix'}.** ${missing.length ? `Missing: ${missing.join(', ')}.` : 'The imported 1k/10k core cells are complete.'}\n7. **A single aggregate score is meaningful — rejected.** Creation, sparse update, selection, sustained storms, first frame, bytes, and bundle size measure different resources and must remain separate axes.\n\n## Coverage\n\n| Dimension | Values |\n|---|---:|\n${Object.entries(dimensions).map(([k, v]) => `| ${k} | ${v.length} |`).join('\n')}\n\n## Reproduce\n\n- Import and audit existing data: \`pnpm --filter vue-lynx-benchmark bench:unified\`\n- Fresh quick campaign, then normalize: \`pnpm --filter vue-lynx-benchmark bench:unified:quick\`\n- Fresh standard campaign: \`pnpm --filter vue-lynx-benchmark bench:unified:all\`\n`;
fs.writeFileSync(`${outputBase}-audit.md`, md);
console.log(`Wrote ${path.relative(root, outputBase)}.json (${records.length} records)`);
console.log(`Wrote ${path.relative(root, outputBase)}-audit.md (${audit.comparable.length} comparable groups)`);
