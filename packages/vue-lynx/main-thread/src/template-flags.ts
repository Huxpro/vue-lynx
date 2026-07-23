// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Graph-eng staging/paint flag reads — one place for every axis define.
 *
 * WHY THIS FILE EXISTS: the graph-eng experiment (#321–#340) stacks several
 * build-time axes (`__VUE_LYNX_TEMPLATE_STAGING__`, `__VUE_LYNX_IFR_PAINT__`).
 * Keeping every read here means adding or *retiring* an axis touches exactly
 * one flag reader + one strategy entry (see ops-apply's STAGING_STRATEGIES) +
 * the build define — not a scatter of inline `typeof __X__ …` checks.
 *
 * DCE contract: each define is read as `typeof __X__ !== 'undefined' ? __X__ :
 * globalThis['__X__']`. In a real build the plugin injects the define, so the
 * bundler folds the ternary to the literal and drops the `globalThis` fallback
 * entirely (verified: the flag-name string does not appear in built bundles).
 * The fallback exists only for test realms (vitest) that do not inject the
 * define but set the global directly. `__VUE_LYNX_IFR_MT__` is a genuine
 * runtime flag (set by enableIFR at renderPage time), so it is never folded.
 */

/** Axis-A staging (`opstream|data|code|engine`), or undefined in bare realms. */
function stagingDefine(): string | undefined {
  return (typeof __VUE_LYNX_TEMPLATE_STAGING__ !== 'undefined'
    ? __VUE_LYNX_TEMPLATE_STAGING__
    : (globalThis as Record<string, unknown>)['__VUE_LYNX_TEMPLATE_STAGING__']) as
    | string
    | undefined;
}

/** Axis-D IFR paint (`plain|disposable-et|engine-et`), or undefined. */
function paintDefine(): string | undefined {
  return (typeof __VUE_LYNX_IFR_PAINT__ !== 'undefined'
    ? __VUE_LYNX_IFR_PAINT__
    : (globalThis as Record<string, unknown>)['__VUE_LYNX_IFR_PAINT__']) as
    | string
    | undefined;
}

/** True while the IFR main thread is painting the throwaway first frame. */
function ifrMtActive(): boolean {
  return (globalThis as Record<string, unknown>)['__VUE_LYNX_IFR_MT__'] === true;
}

/**
 * Engine-Template routing (#321/#323 + #324): `templateStaging: 'engine'` for
 * the durable tree, or `ifrPaint: 'engine-et'` for the ephemeral first frame.
 */
export function engineStagingRequested(): boolean {
  if (stagingDefine() === 'engine') return true;
  return paintDefine() === 'engine-et' && ifrMtActive();
}

/**
 * Code-Template ephemeral paint (#340; legacy value `disposable-et` — the
 * build define keeps the legacy spelling, so accept both). Active only inside
 * the IFR MT window, so the persistent Data-Template tree and every
 * non-ephemeral path stay on the interpreter.
 */
export function codePaintRequested(): boolean {
  const paint = paintDefine();
  return (paint === 'code-paint' || paint === 'disposable-et') && ifrMtActive();
}
