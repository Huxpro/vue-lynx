// Neutralize @lynx-js/web-core's always-on lynx.profile shim, for native
// parity. Frameworks may call Lynx's profiling API (lynx.performance
// profileStart/profileEnd) freely because on native Lynx those are no-ops
// unless a tracing session is active. web-core's shim instead treats
// "performance exists" as recording (isProfileRecording = () => $() !==
// undefined) and maps every call onto performance.mark()/measure()/
// clearMarks() — and the measure entries are NEVER cleared, so the
// performance timeline grows without bound and every subsequent call scans
// it. For frameworks that profile per rendered snapshot (ReactLynx does),
// this compounds into superlinear per-operation degradation that DOES NOT
// EXIST on native runtimes — verified: 50 update ticks on 10k rows go from
// >300 s (DNF) to ~15 s with the shim neutralized, worker otherwise idle. The
// patch no-ops only `lynx.profile:`-prefixed entries and is applied
// identically to every framework (Vue never calls the profiling API).
//
// Single source of truth — previously duplicated in benchmark/harness/cross.mjs
// and website/src/components/bench-playground/BenchPlayground.tsx.
export const NEUTRALIZE_LYNX_PROFILE = `(() => {
  const P = globalThis.Performance && globalThis.Performance.prototype;
  if (!P || P.__lynxProfileNeutralized) return;
  P.__lynxProfileNeutralized = true;
  const isProf = (n) => typeof n === 'string' && n.startsWith('lynx.profile:');
  for (const k of ['mark', 'clearMarks']) {
    const orig = P[k];
    P[k] = function (name, ...rest) {
      if (isProf(name)) return undefined;
      return orig.call(this, name, ...rest);
    };
  }
  const origMeasure = P.measure;
  P.measure = function (name, ...rest) {
    if (isProf(name) || (typeof rest[0] === 'string' && isProf(rest[0]))
      || (rest[0] && typeof rest[0] === 'object' && isProf(rest[0].start))) {
      return undefined;
    }
    return origMeasure.call(this, name, ...rest);
  };
})()`;

/** Apply the neutralization to a Playwright page and its (future) workers. */
export async function applyNeutralize(page) {
  await page.addInitScript(NEUTRALIZE_LYNX_PROFILE);
  page.on('worker', (w) => w.evaluate(NEUTRALIZE_LYNX_PROFILE).catch(() => {}));
}
