// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { scopeIdToCssId } from 'vue-lynx/internal/ops';

const PLUGIN_NAME = 'lynx:vue-scoped-cssid';

function findBlockEnd(css: string, openBrace: number): number {
  let depth = 1;
  let quote = '';
  let escaped = false;
  let comment = false;

  for (let index = openBrace + 1; index < css.length; index++) {
    const char = css[index];
    const next = css[index + 1];
    if (comment) {
      if (char === '*' && next === '/') {
        comment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '*') {
      comment = true;
      index++;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '{') {
      depth++;
    } else if (char === '}' && --depth === 0) {
      return index;
    }
  }
  return css.length - 1;
}

function findStatementEnd(
  css: string,
  start: number,
): { index: number; block: boolean } {
  let quote = '';
  let escaped = false;
  let comment = false;
  let parentheses = 0;

  for (let index = start; index < css.length; index++) {
    const char = css[index];
    const next = css[index + 1];
    if (comment) {
      if (char === '*' && next === '/') {
        comment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '*') {
      comment = true;
      index++;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(') {
      parentheses++;
    } else if (char === ')') {
      parentheses--;
    } else if (parentheses === 0 && char === '{') {
      return { index, block: true };
    } else if (parentheses === 0 && char === ';') {
      return { index, block: false };
    }
  }
  return { index: css.length, block: false };
}

function selectorNeedsCommonCSS(selector: string): boolean {
  for (const branch of selector.split(',')) {
    const scopePattern = /\[data-v-[a-zA-Z0-9]+(-s)?\]/g;
    let match: RegExpExecArray | null;
    let lastOrdinaryScopeEnd = -1;
    while ((match = scopePattern.exec(branch))) {
      if (match[1]) return true;
      lastOrdinaryScopeEnd = scopePattern.lastIndex;
    }
    if (
      lastOrdinaryScopeEnd !== -1
      && /(?:\s|[>+~])/.test(branch.slice(lastOrdinaryScopeEnd).trimEnd())
    ) {
      return true;
    }
  }
  return false;
}

interface SplitCSS {
  scoped: string;
  common: string;
}

function splitScopedBlock(css: string): SplitCSS {
  let scoped = '';
  let common = '';
  let index = 0;

  while (index < css.length) {
    const end = findStatementEnd(css, index);
    if (end.index >= css.length) {
      scoped += css.slice(index);
      break;
    }

    if (!end.block) {
      scoped += css.slice(index, end.index + 1);
      index = end.index + 1;
      continue;
    }

    const closeBrace = findBlockEnd(css, end.index);
    const header = css.slice(index, end.index);
    const body = css.slice(end.index + 1, closeBrace);
    if (header.trimStart().startsWith('@')) {
      const nested = splitScopedBlock(body);
      if (nested.scoped) scoped += `${header}{${nested.scoped}}`;
      if (nested.common) common += `${header}{${nested.common}}`;
    } else if (selectorNeedsCommonCSS(header)) {
      common += css.slice(index, closeBrace + 1);
    } else {
      scoped += css.slice(index, closeBrace + 1);
    }
    index = closeBrace + 1;
  }

  return { scoped, common };
}

/**
 * Lift Vue-compiled deep/slotted rules out of extracted @cssId blocks. Lynx's
 * debundler treats rules outside those blocks as common CSS (fragment 0),
 * which every numeric cssId fragment imports.
 */
export function routeVueScopedCSS(css: string): string {
  let output = '';
  let index = 0;

  while (index < css.length) {
    const end = findStatementEnd(css, index);
    if (end.index >= css.length) return output + css.slice(index);
    if (!end.block) {
      output += css.slice(index, end.index + 1);
      index = end.index + 1;
      continue;
    }

    const closeBrace = findBlockEnd(css, end.index);
    const header = css.slice(index, end.index);
    if (/^\s*@cssid\b/i.test(header)) {
      const body = css.slice(end.index + 1, closeBrace);
      const { scoped, common } = splitScopedBlock(body);
      output += `${header}{${scoped}}${common}`;
    } else {
      output += css.slice(index, closeBrace + 1);
    }
    index = closeBrace + 1;
  }

  return output;
}

function extractCssIdFromQuery(query: string): number | null {
  if (!query.includes('type=style') || !query.includes('scoped')) return null;
  if (query.includes('cssId=')) return null;
  const match = query.match(/[?&]id=([a-f0-9]+)/);
  if (!match) return null;
  return scopeIdToCssId(match[1]);
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

      const Compilation = compiler.webpack?.Compilation;
      const RawSource = compiler.webpack?.sources?.RawSource;
      if (!Compilation || !RawSource || !compilation.hooks.processAssets) return;

      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          // LynxTemplatePlugin encodes CSS at OPTIMIZE_HASH. Route rules one
          // stage earlier, after CSS extraction/minification has completed.
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_HASH - 1,
        },
        () => {
          for (const asset of compilation.getAssets()) {
            if (!asset.name.endsWith('.css')) continue;
            const source = asset.source.source().toString();
            const routed = routeVueScopedCSS(source);
            if (routed !== source) {
              compilation.updateAsset(asset.name, new RawSource(routed));
            }
          }
        },
      );
    });
  }
}
