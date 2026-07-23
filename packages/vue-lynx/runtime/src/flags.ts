// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Background-Thread graph-eng flag reads — the ONE decision point per axis.
 *
 * Every runtime branch that depends on a matrix axis reads it from here,
 * never from the defines directly. Why this shape:
 *
 *  - **Removability**: retiring an axis is one edit in this file (pin the
 *    accessor to its default); every dependent branch becomes dead code the
 *    minifier strips, and grepping the accessor name is the exact deletion
 *    list for the follow-up source removal.
 *  - **DCE**: in product builds DefinePlugin replaces the define with a
 *    literal, the `typeof` arm folds to a constant, the accessor inlines,
 *    and flag-off branches disappear from the bundle.
 *  - **Test/harness flippability**: realms without the define (vitest, ad
 *    hoc harnesses) fall through to a same-named global read, evaluated
 *    per call — tests flip `globalThis.__VUE_LYNX_…__` between runs.
 *
 * Axis semantics live in `vue-lynx/internal/matrix`; define names are
 * single-sourced there and in `vue-lynx/internal/ops`.
 */

/**
 * Naming axis kill-switch (#298/#301): `false` forces dense per-node naming
 * even when `__vlxAddressing` metadata is present. Default: block naming
 * allowed.
 */
export function sparseNamingEnabled(): boolean {
  if (
    typeof __VUE_LYNX_SPARSE_NAMING__ !== 'undefined'
  ) {
    return __VUE_LYNX_SPARSE_NAMING__ !== false;
  }
  return (
    (globalThis as Record<string, unknown>)['__VUE_LYNX_SPARSE_NAMING__']
      !== false
  );
}

/**
 * Staging axis at the `code` rung (`+b:c`, #337): instantiate templates
 * through the bundle-baked create() when the fingerprint verifies.
 */
export function codeStagingRequested(): boolean {
  const v = typeof __VUE_LYNX_TEMPLATE_STAGING__ !== 'undefined'
    ? __VUE_LYNX_TEMPLATE_STAGING__
    : (globalThis as Record<string, unknown>)['__VUE_LYNX_TEMPLATE_STAGING__'];
  return v === 'code';
}

/**
 * Delivery axis at the `bundle` value (`+b!`, #338): skip shipping the
 * structure over the wire when the MT bundle carries it (hash-verified).
 */
export function bundleDeliveryRequested(): boolean {
  const v = typeof __VUE_LYNX_TEMPLATE_DELIVERY__ !== 'undefined'
    ? __VUE_LYNX_TEMPLATE_DELIVERY__
    : (globalThis as Record<string, unknown>)['__VUE_LYNX_TEMPLATE_DELIVERY__'];
  return v === 'bundle';
}
