// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

const PLUGIN_NAME = 'lynx:vue-scoped-cssid';

function extractCssIdFromQuery(query: string): number | null {
  if (!query.includes('type=style') || !query.includes('scoped')) return null;
  if (query.includes('cssId=')) return null;
  const match = query.match(/[?&]id=([a-f0-9]+)/);
  if (!match) return null;
  // Mask to int32 positive range — Lynx engine uses int32 for cssId
  return Number.parseInt(match[1], 16) & 0x7fffffff;
}

export class VueScopedCSSIdPlugin {
  // biome-ignore lint/suspicious/noExplicitAny: rspack/webpack compiler type mismatch
  apply(compiler: any): void {
    // biome-ignore lint/suspicious/noExplicitAny: rspack/webpack compilation type not importable
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation: any) => {
      const NormalModule = compiler.webpack?.NormalModule;
      if (!NormalModule?.getCompilationHooks) return;

      NormalModule.getCompilationHooks(compilation).loader.tap(
        PLUGIN_NAME,
        // biome-ignore lint/suspicious/noExplicitAny: rspack/webpack loaderContext type not importable
        (loaderContext: any) => {
          const query: string = loaderContext.resourceQuery ?? '';
          const cssId = extractCssIdFromQuery(query);
          if (cssId === null) return;

          const newQuery = query + `&cssId=${cssId}`;
          try {
            Object.defineProperty(loaderContext, 'resourceQuery', {
              value: newQuery,
              writable: true,
              configurable: true,
            });
          } catch {
            loaderContext.resourceQuery = newQuery;
          }
        },
      );
    });
  }
}
