// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Post-loader: rewrite vapor `template("<html>")` calls to structured
 * TemplateNode literals. Runs on compiled SFC script/template modules and
 * ordinary JS so both inlined script-setup and separate template compilation
 * skip the runtime HTML parse.
 */

import { rewriteVaporTemplateCalls } from '../compiler/vapor-structured-template.js';

interface LoaderThis {
  async(): (err: Error | null, source?: string, map?: unknown) => void;
  getOptions?: () => Record<string, unknown>;
  resourcePath: string;
  callback(err: Error | null, source?: string, map?: unknown): void;
}

export default function vaporStructuredTemplateLoader(
  this: LoaderThis,
  source: string,
  map?: unknown,
): void {
  // Fast path: most modules never call template().
  if (!source.includes('template(') && !source.includes('_template(')) {
    this.callback(null, source, map);
    return;
  }
  try {
    const { code, replacements } = rewriteVaporTemplateCalls(source);
    this.callback(null, replacements > 0 ? code : source, map);
  } catch (err) {
    this.callback(err instanceof Error ? err : new Error(String(err)));
  }
}
