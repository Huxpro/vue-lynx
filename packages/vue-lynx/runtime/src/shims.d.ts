// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Type declarations for Lynx Background Thread globals used by the Vue runtime.
 *
 * Global `lynx` variable and NodesRef/SelectorQuery types are provided by
 * @lynx-js/types (devDependency). Files that need `lynx.getNativeApp()` (not
 * part of the public @lynx-js/types surface) declare a local `var lynx` to
 * shadow the global — see flush.ts for the pattern.
 */

declare global {
  /** Build-time macros replaced by DefinePlugin */
  const __DEV__: boolean;
  const __VUE_OPTIONS_API__: boolean;
  const __VUE_PROD_DEVTOOLS__: boolean;
  const __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean;
  const __VUE_LYNX_AUTO_PIXEL_UNIT__: boolean;
  /**
   * Sparse A2 naming for Vapor CLONE_TREE (#298). When false, force dense A1
   * even if `__vlxAddressing` is stamped (graph-eng matrix kill-switch).
   */
  const __VUE_LYNX_SPARSE_NAMING__: boolean;
  /**
   * Axis-A staging request ('opstream'|'data'|'code'|'engine'), from
   * `templateStaging` (#321). Guard reads with typeof — older bundles and
   * test realms may not define it.
   */
  const __VUE_LYNX_TEMPLATE_STAGING__: string;
  /**
   * Delivery request ('runtime'|'bundle') from `templateDelivery` (#338).
   * Guard reads with typeof — older bundles and test realms may not define
   * it.
   */
  const __VUE_LYNX_TEMPLATE_DELIVERY__: string;
  /** Axis-D IFR paint mode ('plain'|'disposable-et'|'engine-et'). */
  const __VUE_LYNX_IFR_PAINT__: string;

  /** Injected by entry-background.ts; called by Lynx Native on event fire */
  function publishEvent(sign: string, data: unknown): void;
}

export {};
