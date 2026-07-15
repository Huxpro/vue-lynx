// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

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

  // Mask literals / drop comments before scanning (see tokenizeLiterals) so
  // import-like text inside them is never followed as a real edge.
  const { code, literals } = tokenizeLiterals(source);
  const unquote = (lit: string) => lit.slice(1, -1);

  // An import attribute always follows the specifier with only whitespace
  // between, so a lookahead from the end of the match catches it regardless
  // of line breaks (SWC may reformat `with { runtime: 'shared' }` onto the
  // next line). This keeps us in lockstep with extractSharedImports, which
  // is multiline-aware — without it a reformatted shared import would leak
  // through here and be followed as a plain local import.
  const attribAhead = /^\s*with\s*\{/;

  // Match the `from` clause of any import (relative OR non-relative), and any
  // re-export (`export … from`), keying on `from` + a masked specifier.
  const fromRe = /from\s+\u0000(\d+)\u0000/g;
  let match;
  while ((match = fromRe.exec(code)) !== null) {
    if (attribAhead.test(code.slice(fromRe.lastIndex))) continue;
    specifiers.add(unquote(literals[Number(match[1])]!));
  }

  // Match bare side-effect imports: import './foo' or import 'pkg'.
  const bareRe = /import\s+\u0000(\d+)\u0000/g;
  while ((match = bareRe.exec(code)) !== null) {
    if (attribAhead.test(code.slice(bareRe.lastIndex))) continue;
    specifiers.add(unquote(literals[Number(match[1])]!));
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
  // Match import statements containing `with { runtime: 'shared' }`.
  // SWC may reformat across multiple lines, so we use [\s\S]*? for the
  // attribute block.
  const re = /import\s+(.+?)\s+from\s+(['"])([^'"]+)\2\s*with\s*\{[\s\S]*?runtime:\s*['"]shared['"][\s\S]*?\}\s*;?/g;
  const imports: string[] = [];
  let match;
  source = stripComments(source);
  while ((match = re.exec(source)) !== null) {
    const specifiers = match[1]!;
    const quote = match[2]!;
    const modulePath = match[3]!;
    // Use `!!` with explicit `builtin:swc-loader` to skip all configured
    // loaders (especially worklet-loader-mt) while keeping TS compilation.
    imports.push(`import ${specifiers} from ${quote}!!builtin:swc-loader!${modulePath}${quote};`);
  }
  return imports.join('\n');
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
