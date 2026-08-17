// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Vapor IFR×ET sparse first-frame paint switch.
 *
 * Injected by `pluginVueLynx` as `__VUE_LYNX_VAPOR_IFR_ET__` when `vapor: true`
 * (follows `enableElementTemplates ?? enableIFR`). Tests may override via
 * `globalThis.__VUE_LYNX_VAPOR_IFR_ET_OVERRIDE__`.
 */

declare const __VUE_LYNX_VAPOR_IFR_ET__: boolean | undefined;

const OVERRIDE_KEY = '__VUE_LYNX_VAPOR_IFR_ET_OVERRIDE__';

export function isVaporIfrElementTemplates(): boolean {
  const g = globalThis as Record<string, unknown>;
  if (typeof g[OVERRIDE_KEY] === 'boolean') {
    return g[OVERRIDE_KEY] as boolean;
  }
  // `typeof` on an unbound DefinePlugin macro is safe in JS.
  if (typeof __VUE_LYNX_VAPOR_IFR_ET__ === 'boolean') {
    return __VUE_LYNX_VAPOR_IFR_ET__;
  }
  // Non-bundled / vitest source without the define — default on so suites
  // exercise the shipped sparse path.
  return true;
}
