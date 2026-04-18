// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Wrapper around @lynx-js/css-extract-webpack-plugin's loader that injects
 * `?cssId=<N>` into `this.resourceQuery` for Vue scoped style modules.
 *
 * The original CssExtract loader reads cssId from `this.resourceQuery` in
 * its pitch function. This wrapper runs its own pitch FIRST (since it's
 * placed before CssExtract in the chain), detects Vue scoped styles via
 * the `id` + `scoped` query params, computes the numeric cssId, and
 * patches `this.resourceQuery` before the original loader runs.
 *
 * Since webpack/rspack loaders share the same `this` (loaderContext),
 * modifying `this.resourceQuery` here is visible to subsequent loaders.
 */

// biome-ignore lint/suspicious/noExplicitAny: loader context type not importable
type LoaderContext = any;

/**
 * Normal-phase function: pass-through (all work happens in pitch).
 */
export default function cssExtractWrapperLoader(
  this: LoaderContext,
  source: string,
): string {
  return source;
}

/**
 * Pitch function: inject cssId into resourceQuery for Vue scoped styles,
 * then let the build continue to the next loader (CssExtract).
 */
export function pitch(this: LoaderContext): void {
  const query: string = this.resourceQuery ?? '';
  if (
    query.includes('type=style')
    && query.includes('scoped')
    && !query.includes('cssId=')
  ) {
    const match = query.match(/[?&]id=([a-f0-9]+)/);
    if (match) {
      // Mask to int32 positive range — Lynx engine uses int32 for cssId
      const cssId = parseInt(match[1], 16) & 0x7fffffff;
      // Patch resourceQuery so the CssExtract loader's pitch sees it.
      // We use Object.defineProperty in case rspack defines a getter.
      const newQuery = query + `&cssId=${cssId}`;
      try {
        Object.defineProperty(this, 'resourceQuery', {
          value: newQuery,
          writable: true,
          configurable: true,
        });
      } catch {
        // Fallback: direct assignment
        this.resourceQuery = newQuery;
      }
    }
  }
  // Return undefined to continue to the next pitch (CssExtract)
}
