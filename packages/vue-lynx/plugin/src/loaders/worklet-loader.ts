// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Webpack loader that runs the SWC worklet transform on Background layer files.
 *
 * For each file in the Background layer:
 *  1. Quick-check for 'main thread' directive — skip files without it
 *  2. SWC with target='JS' → replaces worklet functions with context objects
 *  3. Return the JS output to webpack
 *
 * LEPUS registration extraction is handled separately by worklet-loader-mt
 * on the Main Thread layer, which provides natural per-entry isolation
 * via webpack's dependency graph.
 */

import type { Rspack } from '@rsbuild/core';

import { transformReactLynxSync } from '@lynx-js/react/transform';

import { hasMainThreadDirective } from './worklet-utils.js';

export interface WorkletLoaderOptions {
  /** Use the pure Vapor runtime entry for generated worklet imports. */
  vapor?: boolean;
}

export default function workletLoader(
  this: Rspack.LoaderContext<WorkletLoaderOptions>,
  source: string,
): string {
  this.cacheable(true);

  // Skip comments and ordinary string values that only mention the phrase.
  if (!hasMainThreadDirective(source)) {
    return source;
  }

  const { vapor = false } = this.getOptions?.() ?? {};
  const resourcePath = this.resourcePath;
  const filename = resourcePath;

  // JS target — replaces worklet functions with context objects
  const jsResult = transformReactLynxSync(source, {
    pluginName: 'vue:worklet',
    filename,
    sourcemap: false,
    cssScope: false,
    shake: false,
    compat: false,
    refresh: false,
    defineDCE: false,
    directiveDCE: false,
    worklet: {
      target: 'JS',
      filename,
      runtimePkg: vapor ? 'vue-lynx/vapor' : 'vue-lynx',
    },
  });

  if (jsResult.errors.length > 0) {
    for (const err of jsResult.errors) {
      this.emitError(new Error(`[worklet-loader] JS transform: ${err.text}`));
    }
    return source;
  }

  return jsResult.code;
}
