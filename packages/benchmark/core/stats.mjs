// Unified statistics for the benchmark harness.
//
// Single source of truth for median/CI95/geomean/α-fit, replacing the
// copy-pasted stats()/aggregate() in run.mjs, cross.mjs, web-baseline.mjs and
// ifr-bench/src/harness.mjs. See plans/0717-1-unified-benchmark.md §2.

/** min/max/mean/median/std/ci95 over a numeric array (nulls/NaN dropped). */
export function stats(values) {
  const clean = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = n % 2
    ? sorted[(n - 1) / 2]
    : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const std = Math.sqrt(
    sorted.map((v) => (v - mean) ** 2).reduce((a, b) => a + b, 0) / n,
  );
  return {
    n,
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median,
    std,
    ci95: 1.96 * (std / Math.sqrt(n)),
  };
}

/** p-th percentile (0..100) via linear interpolation. */
export function percentile(values, p) {
  const clean = values
    .filter((v) => typeof v === 'number' && !Number.isNaN(v))
    .sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const idx = (p / 100) * (clean.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return clean[lo];
  return clean[lo] + (clean[hi] - clean[lo]) * (idx - lo);
}

/**
 * Aggregate loads → per-op stats. Each load has `samples: [{op, ms, dnf?}]`.
 * DNF samples are counted separately (a framework whose per-op cost degrades
 * superlinearly never finishes a storm within the timeout).
 */
export function aggregate(loads) {
  const byOp = {};
  const dnfByOp = {};
  for (const load of loads) {
    for (const s of load.samples) {
      if (s.dnf) dnfByOp[s.op] = (dnfByOp[s.op] ?? 0) + 1;
      else (byOp[s.op] ??= []).push(s.ms);
    }
  }
  const out = Object.fromEntries(
    Object.entries(byOp).map(([op, arr]) => [op, stats(arr)]),
  );
  for (const [op, n] of Object.entries(dnfByOp)) {
    out[op] = { ...(out[op] ?? {}), dnf: n };
  }
  return out;
}

/**
 * Within-load drift: median(last 3) / median(first 3), averaged across loads.
 * ~1.0 = stable per-op cost; >1 = the framework slows as ops accumulate.
 */
export function drift(loads, op) {
  const ratios = [];
  for (const load of loads) {
    const arr = load.samples.filter((s) => s.op === op).map((s) => s.ms);
    if (arr.length < 6) continue;
    const first = stats(arr.slice(0, 3)).median;
    const last = stats(arr.slice(-3)).median;
    if (first > 0) ratios.push(last / first);
  }
  return ratios.length ? stats(ratios).mean : null;
}

/** Geometric mean of positive ratios (krausest signature metric). */
export function geomean(ratios) {
  const clean = ratios.filter((v) => typeof v === 'number' && v > 0);
  if (clean.length === 0) return null;
  const sumLn = clean.reduce((a, b) => a + Math.log(b), 0);
  return Math.exp(sumLn / clean.length);
}

/**
 * Least-squares slope α of log10(metric) vs log10(N) — the scaling exponent
 * (cost ∝ Nᵅ). `points` is [{N, value}]. Requires ≥3 valid points.
 * IMPORTANT: N must be in a consistent unit across all series being compared
 * — the unified harness always passes N in ELEMENTS (see core/scale.mjs), which
 * fixes the rows-vs-cards x-axis mismatch documented in the design doc §4.
 */
export function slopeFit(points) {
  const valid = points.filter(
    (p) =>
      typeof p.N === 'number' && p.N > 0
      && typeof p.value === 'number' && p.value > 0,
  );
  if (valid.length < 3) return null;
  const xs = valid.map((p) => Math.log10(p.N));
  const ys = valid.map((p) => Math.log10(p.value));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}

export const fmt = (x, digits = 1) => (x == null ? 'n/a' : x.toFixed(digits));
