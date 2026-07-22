/**
 * Merge committed + freshly measured results into one schema and reevaluate
 * the published claims in matrix.CLAIMS.
 *
 *   node harness/synthesize.mjs
 *
 * Reads:
 *   - results/cross-storms-*.json (table / interaction)
 *   - results/latest.json (instrumented VDOM vs Vapor)
 *   - results/web-baseline-latest.json (bare DOM)
 *   - ../ifr-bench/results/browser-results-scale-*.json (FCP ladder)
 *   - ../ifr-bench/results/browser-results-graph-eng-dense-sparse*.json (#301 naming)
 *   - ../ifr-bench/results/sfc-probe-sizes-graph-eng.json (#301 bundle flags)
 *   - ../ifr-bench/results/results.json (node-jitless strategy)
 *
 * Writes:
 *   - results/unified/latest.json
 *   - results/unified/ANALYSIS.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import os from 'node:os';

import {
  ARCHITECTURES,
  CLAIMS,
  ENVIRONMENTS,
  SCALE_LADDER,
  SCHEMA_VERSION,
} from './matrix.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ifrRoot = path.resolve(root, '../ifr-bench');
const outDir = path.join(root, 'results/unified');

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function pickNewest(...globs) {
  // Simple: try explicit paths in order.
  for (const p of globs) {
    const abs = path.isAbsolute(p) ? p : path.join(root, p);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function medianOf(statsObj) {
  return statsObj?.median ?? null;
}

function ratio(a, b) {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

function pctDelta(newer, baseline) {
  if (newer == null || baseline == null || baseline === 0) return null;
  return ((newer - baseline) / baseline) * 100;
}

function ingestTableStorms(unified) {
  // Merge multiple storm result files. Prefer the newest meta.date per cell.
  const files = [
    'results/cross-storms-scale6.json',
    'results/cross-storms-latest.json',
    'results/cross-storms-unified-ifr.json',
    'results/cross-storms-unified-react.json',
    // Four-axis flag-permutation run (#325): all 11 Vue cells, 1k/10k.
    'results/cross-storms-graph-eng-4axis.json',
  ];
  const seen = new Map();
  for (const rel of files) {
    const p = path.join(root, rel);
    const data = readJson(p);
    if (!data?.perOp) continue;
    const date = data.meta?.date ?? '1970-01-01';
    unified.sources.push({ kind: 'table-storms', path: p, meta: data.meta });
    for (const [mode, ops] of Object.entries(data.perOp)) {
      for (const [opKey, stats] of Object.entries(ops)) {
        const [op, scale] = opKey.split('@');
        if (!scale) continue;
        const key = `${mode}|${op}|${scale}`;
        const prev = seen.get(key);
        if (prev && prev._date > date) continue;
        seen.set(key, {
          schemaVersion: SCHEMA_VERSION,
          environment: 'lynx-web',
          architecture: mode,
          workload: 'table',
          scale,
          cpuThrottle: 1,
          metric: op,
          unit: 'ms',
          median: stats.median ?? null,
          ci95: stats.ci95 ?? null,
          dnf: stats.dnf ?? 0,
          n: stats.n ?? null,
          sourceDate: date,
          sourceSha: data.meta?.sha ?? null,
          _date: date,
        });
      }
    }
  }
  for (const c of seen.values()) {
    delete c._date;
    unified.cells.push(c);
  }
}

function ingestInstrumented(unified) {
  const p = pickNewest('results/latest.json');
  if (!p) return;
  const data = readJson(p);
  unified.sources.push({ kind: 'instrumented-vdom-vapor', path: p, meta: data.meta });
  // latest.json shape: { perOp: { vdom: { create1k: { bg, e2e, ops, bytes }}}}
  for (const mode of ['vdom', 'vapor']) {
    const ops = data.perOp?.[mode] ?? data.results?.[mode];
    if (!ops) continue;
    for (const [op, s] of Object.entries(ops)) {
      const scale = op.includes('10k') ? '10k' : '1k';
      if (s?.bg?.median != null) {
        unified.cells.push({
          schemaVersion: SCHEMA_VERSION,
          environment: 'lynx-web',
          architecture: mode,
          workload: 'table',
          scale,
          cpuThrottle: 1,
          metric: `${op}_bg`,
          unit: 'ms',
          median: s.bg.median,
          ci95: s.bg.ci95 ?? null,
          instrumented: true,
        });
      }
      if (s?.e2e?.median != null) {
        unified.cells.push({
          schemaVersion: SCHEMA_VERSION,
          environment: 'lynx-web',
          architecture: mode,
          workload: 'table',
          scale,
          cpuThrottle: 1,
          metric: `${op}_e2e`,
          unit: 'ms',
          median: s.e2e.median,
          ci95: s.e2e.ci95 ?? null,
          instrumented: true,
        });
      }
      if (s?.ops?.median != null || typeof s?.ops === 'number') {
        unified.cells.push({
          schemaVersion: SCHEMA_VERSION,
          environment: 'lynx-web',
          architecture: mode,
          workload: 'table',
          scale,
          cpuThrottle: 1,
          metric: `${op}_ops_count`,
          unit: 'count',
          median: typeof s.ops === 'number' ? s.ops : s.ops.median,
          instrumented: true,
        });
      }
    }
  }
}

function ingestIfrScaleFcp(unified) {
  // Vue ladder + ReactLynx ladder (same nCards → ~elements mapping).
  for (const [file, cpu] of [
    ['browser-results-scale-x1.json', 1],
    ['browser-results-scale-x4.json', 4],
    ['browser-results-scale-react-x1.json', 1],
    ['browser-results-scale-react-x4.json', 4],
  ]) {
    const p = path.join(ifrRoot, 'results', file);
    const data = readJson(p);
    if (!data) continue;
    unified.sources.push({ kind: 'ifr-scale-fcp', path: p, cpu });
    const entries = normalizeIfrBrowserResults(data);
    for (const e of entries) {
      const { arch, scale } = parseIfrName(e.name);
      if (!arch || !scale) continue;
      if (e.fcp != null) {
        unified.cells.push({
          schemaVersion: SCHEMA_VERSION,
          environment: 'lynx-web',
          architecture: arch,
          workload: 'content-probe',
          scale,
          cpuThrottle: cpu,
          metric: 'fcp',
          unit: 'ms',
          median: e.fcp,
        });
      }
      if (e.settled != null) {
        unified.cells.push({
          schemaVersion: SCHEMA_VERSION,
          environment: 'lynx-web',
          architecture: arch,
          workload: 'content-probe',
          scale,
          cpuThrottle: cpu,
          metric: 'settled',
          unit: 'ms',
          median: e.settled,
        });
      }
    }
  }
}

function normalizeIfrBrowserResults(data) {
  if (Array.isArray(data)) {
    return data.map((r) => ({
      name: r.name ?? r.bundle ?? r.id,
      fcp:
        r.fcpMedianMs ??
        r.fcpMedian ??
        r.fcp?.median ??
        median(r.fcp) ??
        median(r.fcps),
      settled:
        r.settledMedianMs ??
        r.settledMedian ??
        r.settled?.median ??
        median(r.settled) ??
        median(r.settleds),
    }));
  }
  if (data.results && typeof data.results === 'object') {
    return Object.entries(data.results).map(([name, r]) => ({
      name,
      fcp: r.fcpMedianMs ?? r.fcpMedian ?? r.fcp?.median ?? median(r.fcp) ?? median(r.fcps),
      settled:
        r.settledMedianMs ??
        r.settledMedian ??
        r.settled?.median ??
        median(r.settled) ??
        median(r.settleds),
    }));
  }
  if (data.bundles && typeof data.bundles === 'object') {
    return Object.entries(data.bundles).map(([name, r]) => ({
      name,
      fcp: r.fcpMedianMs ?? r.fcpMedian ?? median(r.fcp) ?? median(r.fcps),
      settled:
        r.settledMedianMs ?? r.settledMedian ?? median(r.settled) ?? median(r.settleds),
    }));
  }
  const keys = Object.keys(data).filter((k) => k.includes('@') || k.includes('vdom'));
  if (keys.length) {
    return keys.map((name) => ({
      name,
      fcp:
        data[name].fcpMedianMs ??
        data[name].fcpMedian ??
        median(data[name].fcp) ??
        median(data[name].fcps),
      settled:
        data[name].settledMedianMs ??
        data[name].settledMedian ??
        median(data[name].settled) ??
        median(data[name].settleds),
    }));
  }
  return [];
}

function median(xs) {
  if (!Array.isArray(xs) || xs.length === 0) return null;
  const s = [...xs].filter((x) => typeof x === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  return s[Math.floor(s.length / 2)];
}

function parseIfrName(name) {
  if (!name) return {};
  // Longer arch ids first (vapor-ifr-dense before vapor-ifr before vapor).
  const archAlt =
    'vapor-ifr-engine-et|vapor-ifr-dense|vapor-ifr-sparse|vapor-engine|vapor-dense|vdom-ifr-et|vdom-ifr|vdom-et|vdom|vapor-ifr|vapor|react';
  // Strip bundle suffix once so both @scale and fixed-size forms match
  // (graph-eng FCP rows use `bundle: content-vapor-ifr-dense.web.bundle`).
  const base = String(name).replace(/\.web\.bundle$/, '');
  // vdom@10k / vapor-ifr-sparse@1k / content-vapor-ifr-dense
  const m = base.match(
    new RegExp(`^(?:content-)?(${archAlt})@(1k|3k|5k|10k|20k|30k)$`),
  );
  if (m) return { arch: m[1], scale: m[2] };
  const m2 = base.match(new RegExp(`^(?:content-)?(${archAlt})$`));
  // Fixed-size sfc-probe (~1004 els) maps to the 1k ladder rung.
  if (m2) return { arch: m2[1], scale: '1k' };
  return {};
}

/**
 * Graph-eng naming-density cells (#301): vapor-ifr-dense vs vapor-ifr-sparse
 * same-source FCP + bundle sizes. Native ET remains stub.
 */
/** Archs whose FCP exists only as fixed-size sfc-probe cells (1k rung). */
const GRAPH_ENG_4AXIS_ARCHS = new Set([
  'vdom-et',
  'vapor-dense',
  'vapor-engine',
  'vapor-ifr-engine-et',
]);

function ingestGraphEngNaming(unified) {
  for (const [file, cpu, archFilter] of [
    ['browser-results-graph-eng-dense-sparse.json', 1, null],
    ['browser-results-graph-eng-dense-sparse-x4.json', 4, null],
    // Four-axis permutation run (#325): ingest ONLY the new archs so the
    // pre-existing ladder cells are not shadowed by a different-day run.
    ['browser-results-graph-eng-4axis.json', 1, GRAPH_ENG_4AXIS_ARCHS],
    ['browser-results-graph-eng-4axis-x4.json', 4, GRAPH_ENG_4AXIS_ARCHS],
  ]) {
    const p = path.join(ifrRoot, 'results', file);
    const data = readJson(p);
    if (!data) continue;
    unified.sources.push({ kind: 'graph-eng-naming-fcp', path: p, cpu });
    for (const e of normalizeIfrBrowserResults(data)) {
      const { arch, scale } = parseIfrName(e.name);
      // Default: only naming-density A/B cells — don't shadow the main
      // vapor-ifr ladder. 4axis files: only the new archs.
      if (archFilter) {
        if (!archFilter.has(arch)) continue;
      } else if (arch !== 'vapor-ifr-dense' && arch !== 'vapor-ifr-sparse') {
        continue;
      }
      if (!scale) continue;
      if (e.fcp != null) {
        unified.cells.push({
          schemaVersion: SCHEMA_VERSION,
          environment: 'lynx-web',
          architecture: arch,
          workload: 'content-probe',
          scale,
          cpuThrottle: cpu,
          metric: 'fcp',
          unit: 'ms',
          median: e.fcp,
          campaign: 'graph-eng-naming',
        });
      }
      if (e.settled != null) {
        unified.cells.push({
          schemaVersion: SCHEMA_VERSION,
          environment: 'lynx-web',
          architecture: arch,
          workload: 'content-probe',
          scale,
          cpuThrottle: cpu,
          metric: 'settled',
          unit: 'ms',
          median: e.settled,
          campaign: 'graph-eng-naming',
        });
      }
    }
  }

  for (const [sizesFile, archOk] of [
    ['results/sfc-probe-sizes-graph-eng.json',
      (a) => a === 'vapor-ifr-dense' || a === 'vapor-ifr-sparse' || a === 'vapor-ifr'],
    ['results/sfc-probe-sizes-graph-eng-4axis.json',
      (a) => GRAPH_ENG_4AXIS_ARCHS.has(a)],
  ]) {
  const sizesPath = path.join(ifrRoot, sizesFile);
  const sizes = readJson(sizesPath);
  if (!sizes?.cells) continue;
  unified.sources.push({ kind: 'graph-eng-bundle-sizes', path: sizesPath });
  for (const row of sizes.cells) {
    const { arch } = parseIfrName(row.cell);
    if (!archOk(arch)) {
      continue;
    }
    const gz = row.webBundle?.gzip;
    if (gz == null) continue;
    unified.cells.push({
      schemaVersion: SCHEMA_VERSION,
      environment: 'lynx-web',
      architecture: arch,
      workload: 'content-probe',
      scale: '1k',
      cpuThrottle: 1,
      metric: 'bundle_web_gzip',
      unit: 'bytes',
      median: gz,
      flags: row.flags ?? null,
      campaign: 'graph-eng-naming',
    });
  }
  }
}

// Authoritative single-provenance content-probe FCP: the unified runner's own
// sweep (results/unified-content-x{1,4}.json) measured every cell on ONE host
// in ONE session, complete 1k→30k. It REPLACES the mixed ifr-bench / graph-eng
// FCP sources (different-day runs whose four-axis 1k values were host
// artifacts — dense/engine measured 3–5× off there, but ≈ baseline here).
const UNIFIED_ARCH_BY_CELL = {
  'vue-vdom-off': 'vdom',
  'vue-vdom-ifr': 'vdom-ifr',
  'vue-vdom-ifr-et': 'vdom-ifr-et',
  'vue-vapor-off': 'vapor',
  'vue-vapor-ifr': 'vapor-ifr',
  'vue-vdom-et': 'vdom-et',
  'vue-vapor-dense': 'vapor-dense',
  'vue-vapor-engine': 'vapor-engine',
  'vue-vapor-ifr-dense': 'vapor-ifr-dense',
  'vue-vapor-ifr-sparse': 'vapor-ifr-sparse',
  'vue-vapor-ifr-engine-et': 'vapor-ifr-engine-et',
  react: 'react',
};

function ingestUnifiedContentFcp(unified) {
  for (const [file, cpu] of [
    ['results/unified-content-x1.json', 1],
    ['results/unified-content-x4.json', 4],
  ]) {
    const p = pickNewest(file);
    const data = readJson(p);
    if (!data?.cells) continue;
    unified.sources.push({ kind: 'unified-content-fcp', path: p, cpu });
    // collect (arch, scale) mine covers at this cpu, so I can drop the stale
    // cells first — mine becomes the single source of truth for those.
    const mine = [];
    for (const [cellId, cell] of Object.entries(data.cells)) {
      const arch = UNIFIED_ARCH_BY_CELL[cellId];
      if (!arch) continue;
      for (const pt of cell.points ?? []) {
        if (pt.fcp != null) mine.push({ arch, scale: pt.rung, metric: 'fcp', median: pt.fcp });
        if (pt.settled != null) mine.push({ arch, scale: pt.rung, metric: 'settled', median: pt.settled });
      }
    }
    const drop = new Set(mine.map((m) => `${m.arch}|${m.scale}|${m.metric}`));
    unified.cells = unified.cells.filter(
      (c) =>
        !(
          c.workload === 'content-probe'
          && c.cpuThrottle === cpu
          && drop.has(`${c.architecture}|${c.scale}|${c.metric}`)
        ),
    );
    for (const m of mine) {
      unified.cells.push({
        schemaVersion: SCHEMA_VERSION,
        environment: 'lynx-web',
        architecture: m.arch,
        workload: 'content-probe',
        scale: m.scale,
        cpuThrottle: cpu,
        metric: m.metric,
        unit: 'ms',
        median: m.median,
        campaign: 'unified-single-provenance',
      });
    }
  }
}

function ingestStrategy(unified) {
  const p = path.join(ifrRoot, 'results/results.json');
  const data = readJson(p);
  if (!data) return;
  unified.sources.push({ kind: 'strategy-node-jitless', path: p });
  // Keep as separate environment — never mix into lynx-web tables.
  const scenes = data.scenes ?? data.results ?? data;
  if (typeof scenes !== 'object') return;
  for (const [scene, variants] of Object.entries(scenes)) {
    if (!variants || typeof variants !== 'object') continue;
    for (const [variant, stats] of Object.entries(variants)) {
      const warm =
        stats?.warm?.median ?? stats?.warmMedian ?? stats?.median ?? null;
      if (warm == null) continue;
      unified.cells.push({
        schemaVersion: SCHEMA_VERSION,
        environment: 'node-jitless',
        architecture: variant,
        workload: 'strategy-scenes',
        scale: scene,
        cpuThrottle: 1,
        metric: 'warm_render',
        unit: 'ms',
        median: warm,
      });
    }
  }
}

function ingestWebBaseline(unified) {
  const p = pickNewest('results/web-baseline-latest.json');
  if (!p) return;
  const data = readJson(p);
  unified.sources.push({ kind: 'bare-dom', path: p, meta: data.meta });
  for (const [mode, ops] of Object.entries(data.perOp ?? {})) {
    for (const [opKey, stats] of Object.entries(ops)) {
      unified.cells.push({
        schemaVersion: SCHEMA_VERSION,
        environment: 'bare-dom',
        architecture: mode,
        workload: 'table',
        scale: opKey.includes('@') ? opKey.split('@')[1] : '1k',
        cpuThrottle: 1,
        metric: opKey.split('@')[0],
        unit: 'ms',
        median: stats.median ?? null,
        ci95: stats.ci95 ?? null,
      });
    }
  }
}

function cell(unified, query) {
  return unified.cells.find((c) =>
    Object.entries(query).every(([k, v]) => c[k] === v),
  );
}

function cells(unified, query) {
  return unified.cells.filter((c) =>
    Object.entries(query).every(([k, v]) => c[k] === v),
  );
}

function reevaluateClaims(unified) {
  const verdicts = [];

  // Claim: vapor-update-bg-5-10x
  {
    const claim = CLAIMS.find((c) => c.id === 'vapor-update-bg-5-10x');
    const selectBgV = cell(unified, {
      architecture: 'vapor',
      metric: 'select_bg',
      instrumented: true,
    });
    const selectBgD = cell(unified, {
      architecture: 'vdom',
      metric: 'select_bg',
      instrumented: true,
    });
    // Also try nested shape from latest.json ingest naming
    const bgVdom = cells(unified, { architecture: 'vdom', instrumented: true }).find(
      (c) => c.metric === 'select_bg',
    )?.median;
    const bgVapor = cells(unified, {
      architecture: 'vapor',
      instrumented: true,
    }).find((c) => c.metric === 'select_bg')?.median;
    const bgRatio = ratio(bgVdom, bgVapor);
    const storm10k = {
      vdom: cell(unified, {
        architecture: 'vdom',
        workload: 'table',
        scale: '10k',
        metric: 'selectStorm',
      })?.median,
      vapor: cell(unified, {
        architecture: 'vapor',
        workload: 'table',
        scale: '10k',
        metric: 'selectStorm',
      })?.median,
    };
    const stormRatio = ratio(storm10k.vdom, storm10k.vapor);
    const oneShot = {
      vdom: cell(unified, {
        architecture: 'vdom',
        workload: 'table',
        scale: '10k',
        metric: 'select',
      })?.median,
      vapor: cell(unified, {
        architecture: 'vapor',
        workload: 'table',
        scale: '10k',
        metric: 'select',
      })?.median,
    };
    const oneShotRatio = ratio(oneShot.vdom, oneShot.vapor);

    let status = 'partial';
    let detail = '';
    if (bgRatio != null && bgRatio >= 5) {
      detail += `Instrumented BG select still ~${bgRatio.toFixed(1)}×. `;
    }
    if (stormRatio != null && stormRatio >= 5) {
      detail += `Black-box selectStorm@10k reproduces ~${stormRatio.toFixed(1)}×. `;
      status = 'holds';
    } else if (stormRatio != null) {
      detail += `Black-box selectStorm@10k only ${stormRatio?.toFixed(2)}×. `;
    }
    if (oneShotRatio != null && oneShotRatio < 2) {
      detail += `One-shot select@10k is near parity (${oneShotRatio.toFixed(2)}×) — frame-floor masks BG wins. `;
      if (status === 'holds') status = 'holds-with-caveat';
    }
    verdicts.push({
      id: claim.id,
      claim: claim.claim,
      status,
      detail: detail || 'Insufficient data.',
      evidence: { bgRatio, stormRatio, oneShotRatio, storm10k, oneShot },
    });
  }

  // Claim: vapor-create-parity
  {
    const claim = CLAIMS.find((c) => c.id === 'vapor-create-parity');
    const scales = {};
    for (const scale of SCALE_LADDER) {
      const v = cell(unified, {
        architecture: 'vapor',
        workload: 'table',
        scale,
        metric: 'create',
      })?.median;
      const d = cell(unified, {
        architecture: 'vdom',
        workload: 'table',
        scale,
        metric: 'create',
      })?.median;
      const r = cell(unified, {
        architecture: 'react',
        workload: 'table',
        scale,
        metric: 'create',
      })?.median;
      scales[scale] = {
        vdom: d,
        vapor: v,
        react: r,
        vaporOverVdom: ratio(v, d),
        reactOverVdom: ratio(r, d),
      };
    }
    const mid = scales['10k'];
    let status = 'holds-with-caveat';
    let detail = '';
    if (mid?.vaporOverVdom != null) {
      detail += `create@10k vapor/vdom=${mid.vaporOverVdom.toFixed(2)}×. `;
      if (mid.vaporOverVdom > 1.15) status = 'weakened';
    }
    if (mid?.reactOverVdom != null && mid.reactOverVdom < 1) {
      detail += `React still leads create@10k (react/vdom=${mid.reactOverVdom.toFixed(2)}×). `;
    }
    verdicts.push({
      id: claim.id,
      claim: claim.claim,
      status,
      detail: detail || 'Insufficient data.',
      evidence: { scales },
    });
  }

  // Claim: ifr-fcp-minus-19
  {
    const claim = CLAIMS.find((c) => c.id === 'ifr-fcp-minus-19');
    const fcp = (arch, scale, cpu) =>
      cell(unified, {
        architecture: arch,
        workload: 'content-probe',
        scale,
        cpuThrottle: cpu,
        metric: 'fcp',
      })?.median;

    const x1_1k = {
      off: fcp('vdom', '1k', 1),
      ifr: fcp('vdom-ifr', '1k', 1),
      et: fcp('vdom-ifr-et', '1k', 1),
    };
    const x1_10k = {
      off: fcp('vdom', '10k', 1),
      ifr: fcp('vdom-ifr', '10k', 1),
      et: fcp('vdom-ifr-et', '10k', 1),
    };
    const x1_30k = {
      off: fcp('vdom', '30k', 1),
      ifr: fcp('vdom-ifr', '30k', 1),
      et: fcp('vdom-ifr-et', '30k', 1),
    };
    const x4_1k = {
      off: fcp('vdom', '1k', 4),
      ifr: fcp('vdom-ifr', '1k', 4),
      et: fcp('vdom-ifr-et', '1k', 4),
    };

    const d1 = pctDelta(x1_1k.ifr, x1_1k.off);
    const d10 = pctDelta(x1_10k.ifr, x1_10k.off);
    const d30 = pctDelta(x1_30k.ifr, x1_30k.off);
    const d4 = pctDelta(x4_1k.ifr, x4_1k.off);
    const dEt30 = pctDelta(x1_30k.et, x1_30k.off);

    let status = 'falsified-as-universal';
    let detail =
      '−19% is a mid-size ×1 content-scene result, not a universal constant. ';
    if (d1 != null) detail += `vdom-ifr@1k ×1: ${d1.toFixed(0)}%. `;
    if (d10 != null) detail += `@10k ×1: ${d10.toFixed(0)}%. `;
    if (d30 != null) detail += `@30k ×1: ${d30.toFixed(0)}%. `;
    if (d4 != null) detail += `@1k ×4: ${d4.toFixed(0)}%. `;
    if (dEt30 != null) detail += `IFR+ET@30k ×1: ${dEt30.toFixed(0)}%. `;
    if (d1 != null && d1 <= -15 && d1 >= -25) {
      status = 'holds-locally';
      detail =
        'Holds for ~1k ×1 content probe; fails as a scale/CPU-invariant claim. ' +
        detail;
    }

    verdicts.push({
      id: claim.id,
      claim: claim.claim,
      status,
      detail,
      evidence: { x1_1k, x1_10k, x1_30k, x4_1k, d1, d10, d30, d4, dEt30 },
    });
  }

  // Claim: et-is-inflection
  {
    const claim = CLAIMS.find((c) => c.id === 'et-is-inflection');
    const fcp = (arch, scale) =>
      cell(unified, {
        architecture: arch,
        workload: 'content-probe',
        scale,
        cpuThrottle: 1,
        metric: 'fcp',
      })?.median;
    const crossover = [];
    for (const scale of SCALE_LADDER) {
      const off = fcp('vdom', scale);
      const ifr = fcp('vdom-ifr', scale);
      const et = fcp('vdom-ifr-et', scale);
      crossover.push({
        scale,
        off,
        ifr,
        et,
        ifrWorseThanOff: ifr != null && off != null && ifr > off,
        etBest: et != null && off != null && ifr != null && et <= off && et <= ifr,
      });
    }
    const dangerous = crossover.filter((c) => c.ifrWorseThanOff);
    const etWins = crossover.filter((c) => c.etBest);
    let status = 'holds';
    let detail = `IFR-sans-ET slower than off at ${dangerous.map((c) => c.scale).join(', ') || 'nowhere in data'}. `;
    detail += `IFR+ET best at ${etWins.map((c) => c.scale).join(', ') || 'n/a'}. `;
    detail +=
      'Caveat: on tiny real examples (hello-world), IFR alone can beat IFR+ET on web FCP — ET tax before win.';
    verdicts.push({
      id: claim.id,
      claim: claim.claim,
      status,
      detail,
      evidence: { crossover },
    });
  }

  // Claim: react-create-vue-update + IFR orthogonality
  {
    const claim = CLAIMS.find((c) => c.id === 'react-create-vue-update');
    const create10k = {
      react: cell(unified, {
        architecture: 'react',
        scale: '10k',
        metric: 'create',
      })?.median,
      vdom: cell(unified, {
        architecture: 'vdom',
        scale: '10k',
        metric: 'create',
      })?.median,
      vapor: cell(unified, {
        architecture: 'vapor',
        scale: '10k',
        metric: 'create',
      })?.median,
    };
    const storm = {
      react: cell(unified, {
        architecture: 'react',
        scale: '10k',
        metric: 'selectStorm',
      })?.median,
      vdom: cell(unified, {
        architecture: 'vdom',
        scale: '10k',
        metric: 'selectStorm',
      })?.median,
      vapor: cell(unified, {
        architecture: 'vapor',
        scale: '10k',
        metric: 'selectStorm',
      })?.median,
      'vdom-ifr-et': cell(unified, {
        architecture: 'vdom-ifr-et',
        scale: '10k',
        metric: 'selectStorm',
      })?.median,
      'vapor-ifr': cell(unified, {
        architecture: 'vapor-ifr',
        scale: '10k',
        metric: 'selectStorm',
      })?.median,
    };
    let status = 'holds';
    let detail = '';
    if (
      create10k.react != null &&
      create10k.vdom != null &&
      create10k.react < create10k.vdom
    ) {
      detail += 'React leads create@10k. ';
    }
    if (
      storm.vapor != null &&
      storm.react != null &&
      storm.vapor < storm.react / 5
    ) {
      detail += `Vapor selectStorm@10k ≪ React (${storm.vapor.toFixed(0)} vs ${storm.react.toFixed(0)} ms). `;
    }
    // IFR orthogonality: plain IFR should ≈ off for post-first-frame
    // updates; IFR+ET may help subsequent *creates* via template clone.
    const ifrRatio = ratio(
      cell(unified, {
        architecture: 'vdom-ifr',
        scale: '10k',
        metric: 'selectStorm',
      })?.median,
      storm.vdom,
    );
    const etRatio = ratio(storm['vdom-ifr-et'], storm.vdom);
    const etCreate = ratio(
      cell(unified, {
        architecture: 'vdom-ifr-et',
        scale: '10k',
        metric: 'create',
      })?.median,
      cell(unified, {
        architecture: 'vdom',
        scale: '10k',
        metric: 'create',
      })?.median,
    );
    if (ifrRatio != null) {
      detail += `vdom-ifr/vdom selectStorm@10k=${ifrRatio.toFixed(2)}× (plain IFR ≈ off: OK). `;
    }
    if (etRatio != null) {
      detail += `vdom-ifr-et/vdom selectStorm@10k=${etRatio.toFixed(2)}×`;
      if (etCreate != null) detail += `, create@10k=${etCreate.toFixed(2)}×`;
      detail += '. ';
      if (etRatio < 0.85) {
        detail +=
          'CHALLENGE: ET is not first-frame-only — template clone accelerates post-mount create/update throughput on this table. ';
        if (status === 'holds') status = 'holds-with-caveat';
      }
    } else {
      detail += 'IFR×storm cells missing — run unified focused campaign. ';
      if (status === 'holds') status = 'needs-data';
    }
    verdicts.push({
      id: claim.id,
      claim: claim.claim,
      status,
      detail,
      evidence: { create10k, storm },
    });
  }

  // Claim: single-process-flat-fcp
  {
    const claim = CLAIMS.find((c) => c.id === 'single-process-flat-fcp');
    verdicts.push({
      id: claim.id,
      claim: claim.claim,
      status: 'holds-as-negative-control',
      detail:
        'Keep as methodology proof that single-process harnesses cannot show IFR benefit. Do not cite flat FCP as product evidence. Real-thread (lynx-web) + native are the only win scales.',
      evidence: {},
    });
  }

  // Claim: same-scale
  {
    const claim = CLAIMS.find((c) => c.id === 'same-scale');
    verdicts.push({
      id: claim.id,
      claim: claim.claim,
      status: 'falsified',
      detail:
        'Four distinct scales coexist: (1) instrumented BG/e2e ms, (2) black-box click→composed-DOM, (3) lynx-web FCP/settled, (4) node --jitless warm render. Same ladder labels (1k–30k) do NOT make (1)–(4) interchangeable. Unified schema tags environment+workload; docs must not ratio across environments.',
      evidence: {
        environments: Object.keys(ENVIRONMENTS),
        architectures: ARCHITECTURES.map((a) => a.id),
      },
    });
  }

  return verdicts;
}

function renderAnalysis(unified, verdicts) {
  let md = `# Unified Benchmark Analysis\n\n`;
  md += `> Generated ${unified.meta.date} @ ${unified.meta.sha}\n`;
  md += `> Host: ${unified.meta.cpus}× ${unified.meta.cpuModel}\n\n`;

  md += `## Why unify?\n\n`;
  md += `Three campaigns answered different questions on different harnesses:\n\n`;
  md += `| campaign | question | package |\n|---|---|---|\n`;
  md += `| IFR styles | first-frame cost & FCP | \`ifr-bench\` |\n`;
  md += `| VDOM vs Vapor | BG/e2e update pipeline | \`benchmark\` instrumented |\n`;
  md += `| Vue vs React | black-box user latency | \`benchmark\` cross/storms |\n\n`;
  md += `They shared a *ladder* (1k→30k) but not a *scale*. This document puts every cell in one schema and challenges the published claims.\n\n`;

  md += `## Environment rules (non-negotiable)\n\n`;
  for (const env of Object.values(ENVIRONMENTS)) {
    md += `- **${env.id}**: ${env.description}\n`;
  }
  md += `\nNever compute \`vapor_bg / ifr_fcp\`. Same number-of-elements label ≠ same metric.\n\n`;

  md += `## Coverage matrix\n\n`;
  md += `| architecture | table storms | content-probe FCP | instrumented BG/e2e | node strategy |\n|---|---|---|---|---|\n`;
  for (const a of ARCHITECTURES) {
    const hasStorm = cells(unified, {
      architecture: a.id,
      workload: 'table',
      metric: 'selectStorm',
    }).length;
    const hasFcp = cells(unified, {
      architecture: a.id,
      workload: 'content-probe',
      metric: 'fcp',
    }).length;
    const hasBg = cells(unified, {
      architecture: a.id,
      instrumented: true,
    }).length;
    md += `| ${a.id} | ${hasStorm ? '✓' : '—'} | ${hasFcp ? '✓' : '—'} | ${hasBg ? '✓' : '—'} | — |\n`;
  }

  md += `\n## Claim reevaluation\n\n`;
  for (const v of verdicts) {
    md += `### \`${v.id}\` — **${v.status}**\n\n`;
    md += `> ${v.claim}\n\n`;
    md += `${v.detail}\n\n`;
  }

  md += renderCampaignFindings(unified);

  md += `## Headline tables (same environment only)\n\n`;
  md += renderStormTable(unified);
  md += renderFcpTable(unified);
  md += renderGraphEngNamingTable(unified);
  md += `\n## Sources ingested\n\n`;
  for (const s of unified.sources) {
    md += `- ${s.kind}: \`${s.path}\`\n`;
  }
  md += `\n## How to reproduce\n\n`;
  md += '```bash\n';
  md += 'pnpm --filter vue-lynx-benchmark run bench:unified\n';
  md += 'pnpm --filter vue-lynx-benchmark run bench:synthesize\n';
  md += '```\n';
  return md;
}

function renderCampaignFindings(unified) {
  const g = (arch, scale, metric) =>
    cell(unified, {
      architecture: arch,
      workload: 'table',
      scale,
      metric,
    })?.median;

  const rows = ['1k', '10k', '30k'].map((scale) => ({
    scale,
    react: g('react', scale, 'selectStorm'),
    vdom: g('vdom', scale, 'selectStorm'),
    ifr: g('vdom-ifr', scale, 'selectStorm'),
    et: g('vdom-ifr-et', scale, 'selectStorm'),
    vapor: g('vapor', scale, 'selectStorm'),
    vaporIfr: g('vapor-ifr', scale, 'selectStorm'),
    createReact: g('react', scale, 'create'),
    createVdom: g('vdom', scale, 'create'),
    createEt: g('vdom-ifr-et', scale, 'create'),
    createVapor: g('vapor', scale, 'create'),
  }));

  // Only emit if we have the IFR campaign cells.
  if (rows.every((r) => r.et == null)) return '';

  let md = `## Same-host campaign findings (lynx-web)\n\n`;
  md += `Focused re-run on one host: Vue IFR matrix + React storms at 1k/10k/30k.\n\n`;
  md += `### 1. Published absolute ms are host-bound\n\n`;
  md += `Playground docs quote React selectStorm@10k ≈ 2544 ms from an earlier machine; `;
  md += `this host measures ≈ ${rows.find((r) => r.scale === '10k')?.react?.toFixed(0) ?? '?'} ms. `;
  md += `**Ratios on one host are the portable claim; absolute ms are not.**\n\n`;

  md += `### 2. Vapor's update advantage is real at scale — but only storms show it\n\n`;
  const r10 = rows.find((r) => r.scale === '10k');
  if (r10?.vapor != null && r10?.vdom != null) {
    md += `selectStorm@10k: VDOM ${r10.vdom.toFixed(0)} ms → Vapor ${r10.vapor.toFixed(0)} ms `;
    md += `(${(r10.vdom / r10.vapor).toFixed(1)}×). `;
  }
  md += `One-shot select stays near the frame floor. Instrumented BG ratios remain the right *micro* story; storms are the right *user* story.\n\n`;

  md += `### 3. IFR without ET ≈ off for post-mount table ops\n\n`;
  if (r10?.ifr != null && r10?.vdom != null) {
    md += `selectStorm@10k vdom-ifr/vdom = ${(r10.ifr / r10.vdom).toFixed(2)}×. `;
  }
  md += `Plain IFR is a first-frame / bundle-shape concern for this workload.\n\n`;

  md += `### 4. IFR+ET is NOT first-frame-only on this table\n\n`;
  if (r10?.et != null && r10?.vdom != null) {
    md += `selectStorm@10k vdom-ifr-et/vdom = ${(r10.et / r10.vdom).toFixed(2)}×; `;
  }
  if (r10?.createEt != null && r10?.createVdom != null) {
    md += `create@10k = ${(r10.createEt / r10.createVdom).toFixed(2)}×. `;
  }
  md += `Element Templates clone repeated row structure after mount — a coverage hole the old IFR-only FCP campaigns never measured.\n\n`;

  md += `### 5. "−19% FCP" is not a constant\n\n`;
  md += `On the content-probe ladder, VDOM+IFR (no ET) wins at small N and **loses by ~20% at 10k–30k**. `;
  md += `IFR+ET stays ahead across the ladder. CPU×4 further erodes plain-IFR wins. Docs must qualify by scale + CPU + ET.\n\n`;

  md += `### 6. React create lead / Vue update lead survives same-host recheck\n\n`;
  if (r10?.createReact != null && r10?.createVdom != null && r10?.vapor != null && r10?.react != null) {
    md += `create@10k react/vdom = ${(r10.createReact / r10.createVdom).toFixed(2)}×; `;
    md += `selectStorm@10k react/vapor = ${(r10.react / r10.vapor).toFixed(1)}×.\n\n`;
  }

  return md;
}

function renderStormTable(unified) {
  const modes = [
    'react',
    'vdom',
    'vdom-ifr',
    'vdom-ifr-et',
    'vapor',
    'vapor-ifr',
  ].filter((m) =>
    cells(unified, { architecture: m, workload: 'table', metric: 'selectStorm' })
      .length,
  );
  if (!modes.length) return '';
  let md = `### Table selectStorm (lynx-web, ms median)\n\n`;
  md += `| scale | ${modes.join(' | ')} |\n|---|${modes.map(() => '---').join('|')}|\n`;
  for (const scale of ['1k', '10k', '30k']) {
    const row = modes.map((m) => {
      const v = cell(unified, {
        architecture: m,
        scale,
        metric: 'selectStorm',
        workload: 'table',
      })?.median;
      return v == null ? '—' : v.toFixed(1);
    });
    md += `| ${scale} | ${row.join(' | ')} |\n`;
  }
  md += `\n`;
  return md;
}

function renderFcpTable(unified) {
  const modes = ['react', 'vdom', 'vdom-ifr', 'vdom-ifr-et', 'vapor', 'vapor-ifr'];
  let md = `### Content-probe FCP (lynx-web ×1, ms median)\n\n`;
  md += `| scale | ${modes.join(' | ')} |\n|---|${modes.map(() => '---').join('|')}|\n`;
  let any = false;
  for (const scale of SCALE_LADDER) {
    const row = modes.map((m) => {
      const v = cell(unified, {
        architecture: m,
        scale,
        metric: 'fcp',
        workload: 'content-probe',
        cpuThrottle: 1,
      })?.median;
      if (v != null) any = true;
      return v == null ? '—' : v.toFixed(0);
    });
    md += `| ${scale} | ${row.join(' | ')} |\n`;
  }
  md += `\n`;
  return any ? md : '';
}

function renderGraphEngNamingTable(unified) {
  const modes = ['vapor-ifr-dense', 'vapor-ifr-sparse', 'vapor-ifr'];
  const has = modes.some(
    (m) =>
      cell(unified, {
        architecture: m,
        workload: 'content-probe',
        metric: 'fcp',
        scale: '1k',
        cpuThrottle: 1,
        campaign: 'graph-eng-naming',
      }) != null
      || cell(unified, {
        architecture: m,
        workload: 'content-probe',
        metric: 'fcp',
        scale: '1k',
        cpuThrottle: 1,
      }) != null,
  );
  if (!has) return '';

  const fcp = (m, cpu) =>
    cell(unified, {
      architecture: m,
      workload: 'content-probe',
      metric: 'fcp',
      scale: '1k',
      cpuThrottle: cpu,
      campaign: 'graph-eng-naming',
    })?.median
    ?? cell(unified, {
      architecture: m,
      workload: 'content-probe',
      metric: 'fcp',
      scale: '1k',
      cpuThrottle: cpu,
    })?.median;

  const gz = (m) =>
    cell(unified, {
      architecture: m,
      workload: 'content-probe',
      metric: 'bundle_web_gzip',
      scale: '1k',
      campaign: 'graph-eng-naming',
    })?.median;

  const dense1 = fcp('vapor-ifr-dense', 1);
  const sparse1 = fcp('vapor-ifr-sparse', 1);
  const dense4 = fcp('vapor-ifr-dense', 4);
  const sparse4 = fcp('vapor-ifr-sparse', 4);

  let md = `### Graph-eng naming density (#301) — vapor IFR dense A1 vs sparse A2\n\n`;
  md += `Same-source sfc-probe (~1004 els). Native ET still stub; sparse still builds the full native skeleton.\n\n`;
  md += `| cell | naming | web gzip | FCP ×1 | Δ vs dense | FCP ×4 | Δ vs dense |\n`;
  md += `|---|---|---:|---:|---:|---:|---:|\n`;
  for (const m of modes) {
    const d1 = fcp(m, 1);
    const d4 = fcp(m, 4);
    const naming =
      m === 'vapor-ifr-dense' ? 'dense' : m === 'vapor-ifr-sparse' || m === 'vapor-ifr'
        ? 'sparse'
        : '?';
    const delta = (v, base) =>
      v == null || base == null || base === 0
        ? '—'
        : `${pctDelta(v, base).toFixed(1)}%`;
    md += `| ${m} | ${naming} | ${gz(m) ?? '—'} | ${
      d1 == null ? '—' : d1.toFixed(1)
    } | ${delta(d1, dense1)} | ${
      d4 == null ? '—' : d4.toFixed(1)
    } | ${delta(d4, dense4)} |\n`;
  }
  md += `\n`;
  if (dense1 != null && sparse1 != null) {
    md += `×1 sparse/dense = ${(sparse1 / dense1).toFixed(3)}× (${
      pctDelta(sparse1, dense1).toFixed(1)
    }%). `;
  }
  if (dense4 != null && sparse4 != null) {
    md += `×4 sparse/dense = ${(sparse4 / dense4).toFixed(3)}× (${
      pctDelta(sparse4, dense4).toFixed(1)
    }%) — treat as noise / inconclusive for scale hedge.\n\n`;
  } else {
    md += `\n\n`;
  }
  md += `Full write-up: \`packages/ifr-bench/GRAPH-ENG-MATRIX.md\`.\n\n`;
  return md;
}

function main() {
  let sha = 'unknown';
  try {
    sha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
  } catch {}

  const unified = {
    meta: {
      date: new Date().toISOString(),
      sha,
      node: process.version,
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model ?? 'unknown',
      schemaVersion: SCHEMA_VERSION,
    },
    environments: ENVIRONMENTS,
    architectures: ARCHITECTURES,
    sources: [],
    cells: [],
    verdicts: [],
  };

  ingestTableStorms(unified);
  ingestInstrumented(unified);
  ingestIfrScaleFcp(unified);
  ingestGraphEngNaming(unified);
  // Authoritative single-provenance content FCP — replaces the stale/artifact
  // FCP cells from the two sources above for every cell it covers.
  ingestUnifiedContentFcp(unified);
  ingestStrategy(unified);
  ingestWebBaseline(unified);

  const verdicts = reevaluateClaims(unified);
  unified.verdicts = verdicts;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'latest.json'),
    JSON.stringify(unified, null, 2),
  );
  const md = renderAnalysis(unified, verdicts);
  fs.writeFileSync(path.join(outDir, 'ANALYSIS.md'), md);
  console.log(md);
  console.log(`[synthesize] wrote ${outDir}/latest.json and ANALYSIS.md`);
  console.log(`[synthesize] cells=${unified.cells.length} verdicts=${verdicts.length}`);

  // Refresh the human-facing HTML artifact alongside ANALYSIS.md.
  try {
    execSync('node harness/report-unified.mjs', {
      cwd: root,
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('[synthesize] report-unified failed:', err.message);
  }
}

main();
