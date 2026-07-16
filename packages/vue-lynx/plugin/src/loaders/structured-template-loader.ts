// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Build-time structured-template transform (issue #234, Part A).
 *
 * Runs (enforce: 'post', Background layer) over the JS that
 * `@vue/compiler-vapor` emits for a `<script setup vapor>` SFC. It finds the
 * compiler's `template("<html>", flags, ns)` helper calls and rewrites the
 * HTML-string argument to the structured {@link VaporTemplateIR} form
 * `template([...], flags, ns)`, parsing the HTML dialect once, at build time.
 *
 * The runtime `template()` (runtime/src/vapor/index.ts) accepts both forms;
 * the string form remains the fallback for precompiled third-party Vapor code.
 *
 * Only the FIRST argument of the helper — a plain HTML string literal starting
 * with `<` — is touched. Pure-text templates (`template("hi")`) and any
 * non-string argument are left untouched so the upstream `createTextNode`
 * fast-path and dynamic callers keep working.
 */

import { parseTemplateToIR } from '../vapor/parse-template.js';

/** Modules a Vapor `template` helper is legitimately imported from. */
const TEMPLATE_IMPORT_SOURCES = new Set([
  'vue',
  'vue-lynx/vapor',
  'vue-lynx',
  '@vue/runtime-vapor',
]);

const IMPORT_RE =
  /import\s*(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;

/** Collect the local identifiers bound to a vapor `template` import. */
function findTemplateLocals(src: string): Set<string> {
  const locals = new Set<string>();
  for (const match of src.matchAll(IMPORT_RE)) {
    const source = match[2]!;
    if (!TEMPLATE_IMPORT_SOURCES.has(source)) continue;
    for (const raw of match[1]!.split(',')) {
      const spec = raw.trim();
      if (!spec) continue;
      const [imported, local] = spec.split(/\s+as\s+/);
      if (imported!.trim() === 'template') {
        locals.add((local ?? imported)!.trim());
      }
    }
  }
  return locals;
}

/**
 * Parse a JS string literal beginning at `src[idx]` (a quote). Returns the
 * decoded value and the index just past the closing quote, or null if `idx` is
 * not a `'`/`"` string literal.
 */
function readStringLiteral(
  src: string,
  idx: number,
): { value: string; end: number } | null {
  const quote = src[idx];
  if (quote !== '"' && quote !== "'") return null;
  let out = '';
  let i = idx + 1;
  const len = src.length;
  while (i < len) {
    const ch = src[i]!;
    if (ch === '\\') {
      const next = src[i + 1];
      switch (next) {
        case 'n': out += '\n'; i += 2; break;
        case 't': out += '\t'; i += 2; break;
        case 'r': out += '\r'; i += 2; break;
        case 'b': out += '\b'; i += 2; break;
        case 'f': out += '\f'; i += 2; break;
        case 'v': out += '\v'; i += 2; break;
        case '0': out += '\0'; i += 2; break;
        case '\n': i += 2; break; // line continuation
        case 'x': {
          const code = Number.parseInt(src.slice(i + 2, i + 4), 16);
          if (Number.isNaN(code)) { out += next!; i += 2; }
          else { out += String.fromCharCode(code); i += 4; }
          break;
        }
        case 'u': {
          if (src[i + 2] === '{') {
            const close = src.indexOf('}', i + 3);
            const code = Number.parseInt(src.slice(i + 3, close), 16);
            out += Number.isNaN(code) ? 'u' : String.fromCodePoint(code);
            i = close + 1;
          } else {
            const code = Number.parseInt(src.slice(i + 2, i + 6), 16);
            if (Number.isNaN(code)) { out += next!; i += 2; }
            else { out += String.fromCharCode(code); i += 6; }
          }
          break;
        }
        default:
          out += next ?? '';
          i += 2;
      }
      continue;
    }
    if (ch === quote) return { value: out, end: i + 1 };
    out += ch;
    i++;
  }
  return null; // unterminated
}

function escapeForRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rewrite `local("<html>", …)` calls, replacing the leading HTML string
 * literal with its structured IR literal. Returns the (possibly unchanged)
 * source.
 */
function rewriteTemplateCalls(src: string, locals: Set<string>): string {
  const names = [...locals].map(escapeForRegExp).join('|');
  // Not preceded by an identifier char or `.` (avoid member access / longer
  // identifiers); followed by `(`.
  const callRe = new RegExp(`(?<![\\w$.])(?:${names})\\s*\\(\\s*`, 'g');

  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = callRe.exec(src)) !== null) {
    const argStart = match.index + match[0].length;
    const lit = readStringLiteral(src, argStart);
    if (!lit) continue;
    // Only HTML-dialect templates; upstream sends bare text through
    // createTextNode, so leave non-`<` strings as strings.
    if (lit.value.charCodeAt(0) !== 0x3c /* '<' */) continue;

    const ir = parseTemplateToIR(lit.value);
    out += src.slice(last, argStart) + JSON.stringify(ir);
    last = lit.end;
    // Resume scanning after the consumed literal.
    callRe.lastIndex = lit.end;
  }
  if (last === 0) return src;
  out += src.slice(last);
  return out;
}

interface LoaderContext {
  resourcePath: string;
  async(): (err: Error | null, content?: string, map?: unknown) => void;
}

export default function structuredTemplateLoader(
  this: LoaderContext,
  source: string | Buffer,
  map?: unknown,
): void {
  const callback = this.async();
  const src = typeof source === 'string' ? source : source.toString('utf-8');

  // Cheap bail-outs before any scanning.
  if (!src.includes('template') || !src.includes('<')) {
    return callback(null, src, map);
  }
  const locals = findTemplateLocals(src);
  if (locals.size === 0) return callback(null, src, map);

  let out: string;
  try {
    out = rewriteTemplateCalls(src, locals);
  } catch {
    // Never break the build over a transform edge case — fall back to the
    // string form (runtime parser handles it).
    return callback(null, src, map);
  }
  if (out === src) return callback(null, src, map);
  // Source positions shifted; drop the incoming map for changed modules.
  return callback(null, out);
}
