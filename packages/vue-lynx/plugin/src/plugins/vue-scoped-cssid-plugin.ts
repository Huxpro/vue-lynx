// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { scopeIdToCssId } from 'vue-lynx/internal/ops';

const PLUGIN_NAME = 'lynx:vue-scoped-cssid';

export interface VueScopedCSSFragments {
  component: string;
  common: string;
}

const RULE_LIST_AT_RULES = new Set([
  'container',
  'document',
  'layer',
  'media',
  'scope',
  'starting-style',
  'supports',
]);

interface Terminator {
  index: number;
  kind: '{' | ';';
}

function findTerminator(css: string, start: number): Terminator | null {
  let quote = '';
  let parentheses = 0;
  let brackets = 0;

  for (let i = start; i < css.length; i++) {
    const char = css[i];
    const next = css[i + 1];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '(') parentheses++;
    else if (char === ')') parentheses--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;
    else if (parentheses === 0 && brackets === 0) {
      if (char === '{' || char === ';') return { index: i, kind: char };
    }
  }
  return null;
}

function findClosingBrace(css: string, open: number): number {
  let depth = 1;
  let quote = '';
  for (let i = open + 1; i < css.length; i++) {
    const char = css[i];
    const next = css[i + 1];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 1;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return i;
  }
  return css.length - 1;
}

function splitSelectors(selectorList: string): string[] {
  const selectors: string[] = [];
  let start = 0;
  let quote = '';
  let parentheses = 0;
  let brackets = 0;
  for (let i = 0; i < selectorList.length; i++) {
    const char = selectorList[i];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '(') parentheses++;
    else if (char === ')') parentheses--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;
    else if (char === ',' && parentheses === 0 && brackets === 0) {
      selectors.push(selectorList.slice(start, i).trim());
      start = i + 1;
    }
  }
  selectors.push(selectorList.slice(start).trim());
  return selectors.filter(Boolean);
}

function hasComponentScope(selector: string, scopeId: string): boolean {
  return selector.includes(`[${scopeId}]`)
    || selector.includes(`[${scopeId}-s]`);
}

function splitRuleList(css: string, scopeId: string): VueScopedCSSFragments {
  let component = '';
  let common = '';
  let cursor = 0;

  while (cursor < css.length) {
    const triviaStart = cursor;
    while (cursor < css.length) {
      if (/\s/.test(css[cursor])) {
        cursor++;
        continue;
      }
      if (css[cursor] === '/' && css[cursor + 1] === '*') {
        const end = css.indexOf('*/', cursor + 2);
        cursor = end === -1 ? css.length : end + 2;
        continue;
      }
      break;
    }
    const trivia = css.slice(triviaStart, cursor);
    if (cursor >= css.length) {
      component += trivia;
      break;
    }

    const terminator = findTerminator(css, cursor);
    if (!terminator) {
      component += trivia + css.slice(cursor);
      break;
    }
    if (terminator.kind === ';') {
      component += trivia + css.slice(cursor, terminator.index + 1);
      cursor = terminator.index + 1;
      continue;
    }

    const header = css.slice(cursor, terminator.index);
    const close = findClosingBrace(css, terminator.index);
    const body = css.slice(terminator.index + 1, close);
    const end = Math.min(close + 1, css.length);
    const trimmedHeader = header.trim();

    if (trimmedHeader.startsWith('@')) {
      const name = /^@([\w-]+)/.exec(trimmedHeader)?.[1]?.toLowerCase();
      if (name && RULE_LIST_AT_RULES.has(name)) {
        const nested = splitRuleList(body, scopeId);
        if (nested.component.trim()) {
          component += `${trivia}${header}{${nested.component}}`;
        }
        if (nested.common.trim()) {
          common += `${nested.component.trim() ? '' : trivia}${header}{${nested.common}}`;
        }
      } else {
        component += trivia + css.slice(cursor, end);
      }
      cursor = end;
      continue;
    }

    const selectors = splitSelectors(header);
    const componentSelectors = selectors.filter(selector =>
      hasComponentScope(selector, scopeId)
    );
    const commonSelectors = selectors.filter(selector =>
      !hasComponentScope(selector, scopeId)
    );
    if (componentSelectors.length > 0) {
      component += `${trivia}${componentSelectors.join(', ')} {${body}}`;
    }
    if (commonSelectors.length > 0) {
      common += `${componentSelectors.length > 0 ? '' : trivia}${commonSelectors.join(', ')} {${body}}`;
    }
    cursor = end;
  }

  return { component, common };
}

/**
 * Partition Vue-compiled scoped CSS into native component and common
 * fragments. Vue removes the scope attribute from `:global()` selectors,
 * which gives us an unambiguous post-compile routing marker.
 */
export function splitVueScopedCSS(
  css: string,
  rawScopeId: string,
): VueScopedCSSFragments {
  const scopeId = rawScopeId.startsWith('data-v-')
    ? rawScopeId
    : `data-v-${rawScopeId}`;
  return splitRuleList(css, scopeId);
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
    });
  }
}
