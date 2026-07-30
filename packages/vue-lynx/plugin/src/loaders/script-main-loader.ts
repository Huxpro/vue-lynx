// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Webpack loader (enforce: 'pre' on `.vue` files) that lowers `<script main>`
 * blocks into `'main thread'` worklet directives BEFORE vue-loader parses the
 * SFC — see `../compiler/script-main-transform.ts` for the semantics.
 *
 * Running as a pre-loader makes the rewrite reach every consumer of the SFC:
 * vue-loader's `experimentalInlineMatchResource` bakes the remaining loader
 * chain (this loader included) into each `?vue&type=` sub-request, so the
 * connector, the script sub-module, and the template sub-module all parse the
 * same rewritten source on both the Background and Main Thread layers. The
 * rewrite is idempotent — once lowered, the SFC has no `<script main>` block
 * left and the loader passes it through unchanged.
 */

import type { Rspack } from '@rsbuild/core';

import {
  mayHaveScriptMainBlock,
  transformScriptMain,
} from '../compiler/script-main-transform.js';

export default function scriptMainLoader(
  this: Rspack.LoaderContext,
  source: string,
): string {
  this.cacheable(true);

  if (!this.resourcePath.endsWith('.vue')) return source;
  if (!mayHaveScriptMainBlock(source)) return source;

  const result = transformScriptMain(source, this.resourcePath);
  if (result === null) return source;

  for (const message of result.errors) {
    this.emitError(new Error(message));
  }
  // On error, `code` has the <script main> block stripped — never let the
  // block through to vue-loader, which would misparse it as an Options API
  // <script> element.
  return result.code;
}
