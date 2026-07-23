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
 * is one edit here; the accessor name is the deletion list.
 */

/**
 * Staging axis at the `engine` rung (#323): route REGISTER_TREE/CLONE_TREE
 * through the native Engine-Template family when the engine provides it.
 * The IFR ephemeral paint may independently request engine routing for the
 * first frame only (`ifrPaint: 'engine-et'`, #324) — also honored here.
 */
export function engineStagingRequested(): boolean {
  const staging = typeof __VUE_LYNX_TEMPLATE_STAGING__ !== 'undefined'
    ? __VUE_LYNX_TEMPLATE_STAGING__
    : (globalThis as Record<string, unknown>)['__VUE_LYNX_TEMPLATE_STAGING__'];
  if (staging === 'engine') return true;
  const paint = typeof __VUE_LYNX_IFR_PAINT__ !== 'undefined'
    ? __VUE_LYNX_IFR_PAINT__
    : (globalThis as Record<string, unknown>)['__VUE_LYNX_IFR_PAINT__'];
  return paint === 'engine-et'
    && (globalThis as Record<string, unknown>)['__VUE_LYNX_IFR_MT__'] === true;
}
