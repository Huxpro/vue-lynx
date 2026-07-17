import { COMPARABILITY_KEYS } from '../benchmark.config.mjs';

export function statsToRecords(base, stats, source) {
  if (!stats || typeof stats !== 'object') return [];
  return Object.entries(stats)
    .filter(([, value]) => value && typeof value === 'object' && Number.isFinite(value.median))
    .map(([metric, value]) => ({
      ...base,
      metric,
      unit: metric === 'ops' || metric === 'flushes' ? 'count' : metric === 'bytes' ? 'bytes' : 'ms',
      n: value.n ?? null,
      median: value.median,
      mean: value.mean ?? null,
      std: value.std ?? null,
      ci95: value.ci95 ?? null,
      samples: null,
      source,
    }));
}

export function comparisonKey(record) {
  return COMPARABILITY_KEYS.map((key) => `${key}=${record[key] ?? 'unknown'}`).join('|');
}

export function auditRecords(records) {
  const groups = new Map();
  for (const record of records) {
    const key = comparisonKey(record);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  const comparable = [...groups.entries()].filter(([, rows]) => new Set(rows.map((r) => r.variant)).size > 1);
  const singleton = [...groups.entries()].filter(([, rows]) => new Set(rows.map((r) => r.variant)).size === 1);
  return { groups, comparable, singleton };
}

export function normalizeMode(mode) {
  return mode === 'vdom' ? 'vue-vdom' : mode === 'vapor' ? 'vue-vapor' : mode;
}
