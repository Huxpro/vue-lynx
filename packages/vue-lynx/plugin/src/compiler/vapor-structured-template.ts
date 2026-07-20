// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Build-time rewrite: vapor `template("<view…>", flags)` →
 * `template(<structured TemplateNode>, flags)`.
 *
 * Skips the runtime HTML parse on both threads (cold IFR + BG). The
 * structured form is the same IR `REGISTER_TREE` / bake already consume.
 *
 * Pure string transform over compiler-vapor output — no compiler fork.
 * Only rewrites the common `_template("…")` / `template("…")` call shape
 * emitted by `@vue/compiler-vapor` (static string literal first arg).
 */

import { htmlToTemplateNode } from 'vue-lynx/internal/html-to-template-node';

const TEMPLATE_CALL_RE =
  /\b(_template|template)\(\s*(["'])((?:\\.|(?!\2).)*)\2/g;

/**
 * Rewrite every static-string `template("…html…")` call in `code` so the
 * first argument is a TemplateNode literal. Returns the rewritten source
 * and the number of replacements (0 = untouched).
 */
export function rewriteVaporTemplateCalls(code: string): {
  code: string;
  replacements: number;
} {
  let replacements = 0;
  const out = code.replace(
    TEMPLATE_CALL_RE,
    (match, callee: string, _quote: string, rawHtml: string) => {
      // Skip non-element templates (plain text roots start without '<').
      if (!rawHtml.startsWith('<')) return match;
      let html: string;
      try {
        // The literal body is already the compiler's HTML dialect; undo
        // only standard JS string escapes that might appear.
        html = rawHtml
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\');
      } catch {
        return match;
      }
      try {
        const { structure } = htmlToTemplateNode(html);
        replacements++;
        return `${callee}(${stringifyTemplateNode(structure)}`;
      } catch {
        return match;
      }
    },
  );
  return { code: out, replacements };
}

/** Compact JSON sufficient for a TemplateNode literal in generated JS. */
function stringifyTemplateNode(node: unknown): string {
  return JSON.stringify(node);
}
