// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main-Thread graph-eng flag reads — the ONE decision point per axis.
 *
 * Same contract as runtime/src/flags.ts: every MT branch that depends on a
 * matrix axis reads it here. Product builds constant-fold through the
 * defines (DCE strips flag-off branches); test realms fall through to
 * same-named globals so harnesses can flip axes per run. Retiring an axis
 * is one edit here + one strategy entry in ops-apply's STAGING_STRATEGIES;
 * the accessor name is the deletion list.
 *
 * `__VUE_LYNX_IFR_MT__` is a genuine runtime flag (set by enableIFR at
 * renderPage time), never a define — it is intentionally not foldable.
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
 * Engine-Template routing (#321/#323 + #324): `templateStaging: 'engine'`
 * for the durable tree, or `ifrPaint: 'engine-et'` for the ephemeral first
 * frame. Stub on Lynx for Web (no `__CreateElementTemplate` family).
 */
export function engineStagingRequested(): boolean {
  if (stagingDefine() === 'engine') return true;
  return paintDefine() === 'engine-et' && ifrMtActive();
}

/**
 * Code-Template ephemeral paint (`+ifr:c`, #340; legacy define value
 * `disposable-et` — accept both spellings). Active only inside the IFR MT
 * window, so the persistent Data-Template tree and every non-ephemeral path
 * stay on the interpreter.
 */
export function codePaintRequested(): boolean {
  const paint = paintDefine();
  return (paint === 'code-paint' || paint === 'disposable-et') && ifrMtActive();
}
