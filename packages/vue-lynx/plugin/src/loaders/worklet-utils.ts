// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { parse, type ParserPlugin } from '@babel/parser';

interface AstNode {
  end?: number | null;
  start?: number | null;
  type: string;
  [key: string]: unknown;
}

// Loaders see sources without a reliable dialect signal, and TypeScript's
// angle-bracket type assertion (`<T>expr`, legal in .ts) is unparseable with
// the jsx plugin enabled while JSX is unparseable without it. Try the plain
// TS grammar first and fall back to the JSX grammar: real JSX always fails
// the first pass (an element's closing tag is a syntax error after a type
// assertion), so the cascade accepts both dialects.
const PARSER_PLUGIN_SETS: ParserPlugin[][] = [
  [
    'typescript',
    ['importAttributes', { deprecatedAssertSyntax: true }],
    'decorators-legacy',
  ],
  [
    'typescript',
    'jsx',
    ['importAttributes', { deprecatedAssertSyntax: true }],
    'decorators-legacy',
  ],
];

function asAstNode(value: unknown): AstNode | null {
  if (
    value === null
    || typeof value !== 'object'
    || typeof (value as { type?: unknown }).type !== 'string'
  ) return null;
  return value as AstNode;
}

function parseProgram(source: string): AstNode | null {
  for (const plugins of PARSER_PLUGIN_SETS) {
    try {
      return parse(source, {
        sourceType: 'unambiguous',
        plugins: [...plugins],
      }).program as unknown as AstNode;
    } catch {
      // Try the next grammar.
    }
  }
  return null;
}

function programBody(program: AstNode | null): AstNode[] {
  const body = program?.['body'];
  return Array.isArray(body)
    ? body.map(asAstNode).filter((node): node is AstNode => node !== null)
    : [];
}

function stringValue(value: unknown): string | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record['value'] === 'string') return record['value'];
  if (typeof record['name'] === 'string') return record['name'];
  return undefined;
}

function directiveValue(value: unknown): string | undefined {
  if (value !== null && typeof value === 'object') {
    const extra = (value as Record<string, unknown>)['extra'];
    if (extra !== null && typeof extra === 'object') {
      const expressionValue = (extra as Record<string, unknown>)[
        'expressionValue'
      ];
      if (typeof expressionValue === 'string') return expressionValue;
    }
  }
  return stringValue(value);
}

function importAttributes(node: AstNode): AstNode[] {
  const value = node['attributes'] ?? node['assertions'];
  return Array.isArray(value)
    ? value.map(asAstNode).filter((entry): entry is AstNode => entry !== null)
    : [];
}

function hasSharedRuntimeAttribute(node: AstNode): boolean {
  return importAttributes(node).some(attribute =>
    stringValue(attribute['key']) === 'runtime'
    && stringValue(attribute['value']) === 'shared'
  );
}

function replaceRanges(
  source: string,
  ranges: ReadonlyArray<{ end: number; replacement?: string; start: number }>,
): string {
  let output = source;
  for (const range of [...ranges].sort((a, b) => b.start - a.start)) {
    output = output.slice(0, range.start)
      + (range.replacement ?? '')
      + output.slice(range.end);
  }
  return output;
}

/**
 * Resolve a specifier to an absolute path. Returns `null` when the
 * specifier cannot be resolved (the import is then skipped rather than
 * failing the build).
 */
export type ResolveImport = (specifier: string) => Promise<string | null>;

/** Whether a resolved absolute path lives inside a `node_modules` tree. */
export function isUnderNodeModules(resolvedPath: string): boolean {
  return /[/\\]node_modules[/\\]/.test(resolvedPath);
}

/**
 * Reduce an import specifier to its package root: `@scope/name` or `name`,
 * dropping any subpath. Returns `null` for input with no usable package
 * segment (empty, or a bare `@scope` with no name).
 *
 *   - `@my-org/foo/dist/x` → `@my-org/foo`
 *   - `lodash/fp`          → `lodash`
 *
 * This is the canonical "package root" both worklet checkpoints reduce to
 * before matching the allowlist, so a specifier and a resolved path always
 * compare as the same input (see {@link isWorkletPackage}).
 */
export function packageRootFromSpecifier(specifier: string): string | null {
  const segments = specifier.split('/');
  const first = segments[0];
  if (!first) return null;
  if (first.startsWith('@')) {
    const second = segments[1];
    return second ? `${first}/${second}` : null;
  }
  return first;
}

/**
 * Extract the package root from a resolved path under `node_modules`, or `null`
 * when the path is not under `node_modules`.
 *
 * Uses the LAST `node_modules` segment so nested deps and pnpm's
 * `…/.pnpm/<pkg>@<v>/node_modules/<pkg>/…` layout both resolve correctly, then
 * reduces the remainder via {@link packageRootFromSpecifier}.
 */
export function packageNameFromNodeModulesPath(
  resolvedPath: string,
): string | null {
  const norm = resolvedPath.replace(/\\/g, '/');
  const marker = '/node_modules/';
  const idx = norm.lastIndexOf(marker);
  if (idx === -1) return null;
  return packageRootFromSpecifier(norm.slice(idx + marker.length));
}

/**
 * Match a package root against a single allowlist pattern. Inputs are already
 * reduced to a package root (see {@link packageRootFromSpecifier}), so:
 *   - strings match exactly (`@org/motion` ≠ `@org/motion-x`), and
 *   - RegExp patterns are tested against the root (`/^@org\//` matches
 *     `@org/motion`).
 */
function matchesPattern(
  packageRoot: string,
  pattern: string | RegExp,
): boolean {
  return pattern instanceof RegExp
    ? new RegExp(pattern.source, pattern.flags).test(packageRoot)
    : packageRoot === pattern;
}

/**
 * Whether a package root is covered by the `includeWorkletPackages` allowlist.
 *
 * The single matcher used at both checkpoints — following import specifiers
 * ({@link extractLocalImports}) and the plugin's `node_modules` loader carve-out
 * — both of which reduce their input to a package root first, so a specifier
 * and a resolved path always compare as the same thing.
 *
 * @internal Exported for tests.
 */
export function isWorkletPackage(
  packageRoot: string,
  allowlist: ReadonlyArray<string | RegExp>,
): boolean {
  for (const p of allowlist) {
    if (matchesPattern(packageRoot, p)) return true;
  }
  return false;
}

/**
 * Matches a string/template literal (capture group 1) OR a line/block comment
 * (no capture group). Used only with {@link String.prototype.replace}, which
 * resets a global regex's `lastIndex` after each call, so this single shared
 * instance is safe to reuse across {@link stripComments} and
 * {@link tokenizeLiterals}.
 */
const LITERAL_OR_COMMENT_RE =
  /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

/**
 * Remove line (`//…`) and block (`/* … *\/`) comments from JS/TS source,
 * leaving string and template literals untouched so delimiters appearing
 * inside them are not treated as comment starts.
 *
 * @internal Exported for tests.
 */
export function stripComments(source: string): string {
  return source.replace(
    LITERAL_OR_COMMENT_RE,
    (_match, literal) => (literal ? literal : ''),
  );
}

/**
 * Replace every string/template literal with an indexed placeholder
 * (`\u0000N\u0000`) and drop comments, returning the rewritten code plus the
 * captured literals.
 *
 * Unlike {@link stripComments} (which preserves literal *contents*), this
 * masks them, so import-like text *inside* a string or template literal — a
 * worklet that builds a code string containing `from 'x'`, a GraphQL/SQL
 * template, etc. — is never mistaken for a real import edge. Nested literals
 * collapse into the outermost placeholder, so `from 'x'` inside a template
 * is hidden along with it.
 *
 * Known limitation: regex literals are not tokenized, so a regex whose raw
 * text contains `//` can still confuse comment handling. This is rare in
 * worklet entry modules and intentionally left to a real tokenizer.
 *
 * @internal Exported for tests.
 */
export function tokenizeLiterals(source: string): {
  code: string;
  literals: string[];
} {
  const literals: string[] = [];
  const code = source.replace(
    LITERAL_OR_COMMENT_RE,
    (_match, literal) => {
      if (literal === undefined) return ''; // comment → drop
      literals.push(literal);
      return `\u0000${literals.length - 1}\u0000`;
    },
  );
  return { code, literals };
}

/**
 * Whether `source` contains a real `'main thread'` directive statement.
 *
 * Babel's directive value is decoded, so compiler-valid escaped forms such as
 * `'main\\x20thread'` are recognized while documentation comments and ordinary
 * string values remain excluded.
 */
export function hasMainThreadDirective(source: string): boolean {
  const program = parseProgram(source);
  if (!program) {
    // A candidate in syntax Babel does not understand is safer to transform:
    // the worklet compiler remains the authority and false negatives would
    // silently omit registrations from both thread bundles.
    return true;
  }

  const stack: AstNode[] = [program];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (
      node.type === 'Directive'
      && directiveValue(node['value']) === 'main thread'
    ) return true;

    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'extra' || key === 'comments') continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          const child = asAstNode(item);
          if (child) stack.push(child);
        }
      } else {
        const child = asAstNode(value);
        if (child) stack.push(child);
      }
    }
  }
  return false;
}

/**
 * Parse the import specifiers of a module that the MT graph may need to
 * follow.
 *
 * Returns deduplicated specifiers (relative AND non-relative) after
 * dropping:
 *   - attribute imports (`… with { … }`, e.g. `runtime: 'shared'`) — shared
 *     imports are handled by {@link extractSharedImports}; other attributes
 *     (`type: 'json'`, …) carry no worklet registrations, so neither is
 *     followed, and
 *   - vue template/style sub-modules (`?vue&type=template|style`) — only
 *     `?vue&type=script` sub-modules are kept, since template/style would
 *     pull Vue runtime / CSS processing onto the MT layer.
 *
 * Classification of non-relative specifiers (alias vs package) is left to
 * the caller, which resolves them — see {@link extractLocalImports}.
 */
export function extractImportSpecifiers(source: string): string[] {
  const specifiers = new Set<string>();

  for (const node of programBody(parseProgram(source))) {
    const isImport = node.type === 'ImportDeclaration';
    const isReexport = (
      node.type === 'ExportNamedDeclaration'
      || node.type === 'ExportAllDeclaration'
    ) && node['source'] !== null;
    if ((!isImport && !isReexport) || importAttributes(node).length > 0) {
      continue;
    }
    const specifier = stringValue(node['source']);
    if (specifier !== undefined) specifiers.add(specifier);
  }

  return [...specifiers].filter(s => {
    if (!s.includes('?vue')) return true;
    return s.includes('type=script');
  });
}

/**
 * Build the side-effect import block that preserves webpack's MT dependency
 * graph for a processed module.
 *
 * Converts each followed import to a side-effect-only import
 * (`import './foo'`) so webpack reaches sub-modules that contain worklet
 * registrations without executing user code or pulling in unrelated
 * packages. This is critical for the MT layer: entry files like `index.ts`
 * may not contain `'main thread'` directives themselves, but they import
 * `.vue`/`.ts` files that do.
 *
 * The follow policy (relative always, non-relative by resolved location,
 * `node_modules` only when allowlisted) is applied inline below.
 *
 * Unresolvable specifiers are skipped (never fail the build). The original
 * specifier string is re-emitted verbatim so the downstream bundler resolves
 * it again with its own alias/paths config.
 */
export async function extractLocalImports(
  source: string,
  resolveImport: ResolveImport,
  includeWorkletPackages: ReadonlyArray<string | RegExp> = [],
): Promise<string> {
  const kept: string[] = [];

  for (const spec of extractImportSpecifiers(source)) {
    // Relative imports are always followed — no resolution needed.
    if (spec.startsWith('.')) {
      kept.push(spec);
      continue;
    }

    // Non-relative: resolve to decide whether it's project/aliased source
    // (follow) or an external package (follow only when allowlisted).
    const resolved = await resolveImport(spec);
    if (resolved === null) continue; // unresolvable → skip, don't fail build
    if (!isUnderNodeModules(resolved)) {
      kept.push(spec);
      continue;
    }
    // Match the allowlist against the package ROOT (same input the plugin's
    // loader carve-out derives from the resolved path), so a specifier and a
    // path always compare as the same thing.
    const root = packageRootFromSpecifier(spec);
    if (root && isWorkletPackage(root, includeWorkletPackages)) kept.push(spec);
  }

  if (kept.length === 0) return '';
  return kept.map(s => `import '${s}';`).join('\n');
}

/**
 * Extract import statements with `with { runtime: 'shared' }` attributes.
 *
 * These imports reference modules whose code must be available on both
 * threads. The `with { runtime: 'shared' }` attribute is stripped and
 * the specifier is prefixed with `!!` (webpack inline loader syntax) to
 * skip all configured loaders — most importantly worklet-loader-mt,
 * which would otherwise strip the module's exports. rspack's native
 * TypeScript compilation still applies, so the shared module's code
 * is available as regular JS on the MT layer.
 */
export function extractSharedImports(source: string): string {
  const imports: string[] = [];
  for (const node of programBody(parseProgram(source))) {
    if (node.type !== 'ImportDeclaration' || !hasSharedRuntimeAttribute(node)) {
      continue;
    }
    const sourceNode = asAstNode(node['source']);
    const modulePath = stringValue(node['source']);
    if (
      sourceNode?.start == null
      || node.start == null
      || modulePath === undefined
    ) continue;
    const rawSource = source.slice(sourceNode.start, sourceNode.end ?? undefined);
    const quote = rawSource[0] === '"' ? '"' : "'";
    const importHead = source.slice(node.start, sourceNode.start);
    // Use `!!` with explicit `builtin:swc-loader` to skip all configured
    // loaders (especially worklet-loader-mt) while keeping TS compilation.
    imports.push(
      `${importHead}${quote}!!builtin:swc-loader!${modulePath}${quote};`,
    );
  }
  return imports.join('\n');
}

/**
 * Strip `with { runtime: 'shared' }` from imports while preserving the import.
 *
 * IFR keeps complete modules on the main thread, so the loader-bypass import
 * attribute is unnecessary there and must not reach the normal module parser.
 */
export function stripSharedImportAttributes(code: string): string {
  const ranges: Array<{ end: number; start: number }> = [];
  for (const node of programBody(parseProgram(code))) {
    if (node.type !== 'ImportDeclaration' || !hasSharedRuntimeAttribute(node)) {
      continue;
    }
    const sourceNode = asAstNode(node['source']);
    if (sourceNode?.end == null || node.end == null) continue;
    const attributes = importAttributes(node);
    const lastAttribute = attributes[attributes.length - 1];
    if (lastAttribute?.end == null) continue;

    // Babel exposes ranges for each attribute but not for the surrounding
    // `with { ... }`. Starting after the last attribute value, skip trivia to
    // the real closing brace. This deliberately ignores braces inside comments
    // and accepts comments between `with` and `{`.
    let cursor = lastAttribute.end;
    while (cursor < node.end) {
      const char = code[cursor];
      if (char === '}') break;
      if (char === '/' && code[cursor + 1] === '*') {
        const commentEnd = code.indexOf('*/', cursor + 2);
        cursor = commentEnd < 0 ? node.end : commentEnd + 2;
        continue;
      }
      if (char === '/' && code[cursor + 1] === '/') {
        const lineEnd = code.indexOf('\n', cursor + 2);
        cursor = lineEnd < 0 ? node.end : lineEnd + 1;
        continue;
      }
      cursor++;
    }
    if (code[cursor] !== '}') continue;
    ranges.push({
      start: sourceNode.end,
      end: cursor + 1,
    });
  }
  return replaceRanges(code, ranges);
}

/**
 * Drop ordinary Vue SFC style side-effect imports from an IFR connector.
 *
 * CSS is extracted from the Background layer, so importing ordinary styles
 * again from the Main Thread duplicates that work. A CSS-module style import,
 * however, has a binding used by the connector's `__cssModules` mapping. Keep
 * bound style imports so the MT `exportOnlyLocals` CSS rule supplies the same
 * hashed class names used by the first frame.
 */
export function stripStyleImports(code: string): string {
  const ranges: Array<{ end: number; start: number }> = [];
  for (const node of programBody(parseProgram(code))) {
    if (
      node.type !== 'ImportDeclaration'
      || !stringValue(node['source'])?.includes('type=style')
    ) continue;
    const specifiers = node['specifiers'];
    if (Array.isArray(specifiers) && specifiers.length > 0) continue;
    if (node.start != null && node.end != null) {
      ranges.push({ start: node.start, end: node.end });
    }
  }
  return replaceRanges(code, ranges);
}

/**
 * Extract registerWorkletInternal(...) calls from LEPUS output.
 *
 * The LEPUS output contains:
 *   - import { loadWorkletRuntime } from "..."
 *   - var loadWorkletRuntime = __loadWorkletRuntime;
 *   - worklet object declarations
 *   - loadWorkletRuntime(...) && registerWorkletInternal(type, hash, fn);
 *
 * We only need the registerWorkletInternal(...) calls. Uses bracket-depth
 * counting to handle nested braces in function bodies.
 */
export function extractRegistrations(lepusCode: string): string {
  const registrations: string[] = [];
  const marker = 'registerWorkletInternal(';
  let searchFrom = 0;

  while (true) {
    const idx = lepusCode.indexOf(marker, searchFrom);
    if (idx === -1) break;

    // Find the end of the registerWorkletInternal(...) call using bracket counting
    let depth = 0;
    let i = idx + marker.length - 1; // position of the opening '('
    for (; i < lepusCode.length; i++) {
      if (lepusCode[i] === '(') depth++;
      else if (lepusCode[i] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }

    // Extract the full call including trailing semicolon
    let end = i + 1;
    if (end < lepusCode.length && lepusCode[end] === ';') end++;

    registrations.push(lepusCode.slice(idx, end));
    searchFrom = end;
  }

  return registrations.join('\n');
}
