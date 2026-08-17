// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from 'node:path';

import { splitVueScopedCSS } from '../plugins/vue-scoped-cssid-plugin.js';

interface LoaderContext {
  context: string;
  resourcePath: string;
  resourceQuery: string;
}

/**
 * Split a Vue scoped style after Vue has compiled its selectors. The original
 * request retains the component rules and cssId; a sibling `common=true`
 * request emits only selectors compiled from `:global()`.
 */
export default function vueScopedCSSSplitLoader(
  this: LoaderContext,
  source: string,
): string {
  const params = new URLSearchParams(
    this.resourceQuery.startsWith('?')
      ? this.resourceQuery.slice(1)
      : this.resourceQuery,
  );
  if (!params.has('scoped') || params.get('type') !== 'style') return source;

  const scopeId = params.get('id');
  if (!scopeId) return source;

  const fragments = splitVueScopedCSS(source, scopeId);
  if (params.get('common') === 'true') return fragments.common;
  if (!fragments.common.trim()) return fragments.component;

  params.set('common', 'true');
  const query = params.toString().replace(/^vue=&/, 'vue&');
  const relativeResource = path.relative(this.context, this.resourcePath)
    .split(path.sep)
    .join('/');
  const request = `${relativeResource.startsWith('.') ? '' : './'}${relativeResource}?${query}`;
  return `@import ${JSON.stringify(request)};\n${fragments.component}`;
}
