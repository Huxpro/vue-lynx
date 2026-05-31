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
 * Match a bare-import specifier against a single allowlist pattern.
 *
 * Strings match exactly OR as a package-root prefix:
 *   - `@vue-lynx/motion-mini` matches `@vue-lynx/motion-mini` and
 *     `@vue-lynx/motion-mini/sub/path`, but NOT `@vue-lynx/motion-mini-x`.
 * RegExp patterns are tested against the full specifier.
 */
function specifierMatchesPattern(
  specifier: string,
  pattern: string | RegExp,
): boolean {
  if (pattern instanceof RegExp) return pattern.test(specifier);
  if (specifier === pattern) return true;
  return specifier.startsWith(pattern + '/');
}

/**
 * Whether `specifier` is covered by the `includeWorkletPackages` allowlist.
 *
 * @internal Exported for tests.
 */
export function isWorkletPackage(
  specifier: string,
  allowlist: ReadonlyArray<string | RegExp>,
): boolean {
  for (const p of allowlist) {
    if (specifierMatchesPattern(specifier, p)) return true;
  }
  return false;
}

/**
 * Remove line (`//…`) and block (`/* … *\/`) comments from JS/TS source,
 * leaving string and template literals untouched so delimiters appearing
 * inside them are not treated as comment starts.
 *
 * @internal Exported for tests.
 */
export function stripComments(source: string): string {
  return source.replace(
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (_match, literal) => (literal ? literal : ''),
  );
}

/**
 * Parse the import specifiers of a module that the MT graph may need to
 * follow.
 *
 * Returns deduplicated specifiers (relative AND non-relative) after
 * dropping:
 *   - `with { runtime: 'shared' }` imports (handled by
 *     {@link extractSharedImports}), and
 *   - vue template/style sub-modules (`?vue&type=template|style`) — only
 *     `?vue&type=script` sub-modules are kept, since template/style would
 *     pull Vue runtime / CSS processing onto the MT layer.
 *
 * Classification of non-relative specifiers (alias vs package) is left to
 * the caller, which resolves them — see {@link extractLocalImports}.
 */
export function extractImportSpecifiers(source: string): string[] {
  const specifiers = new Set<string>();

  // Strip comments first so JSDoc/example snippets like `* import App from
  // './App.vue';` are not mistaken for real import edges (re-emitting them
  // would inject unresolvable imports and fail the build). String and
  // template literals are preserved so `//` or `/*` inside them is left
  // intact.
  source = stripComments(source);

  // Match the `from` clause of any import (relative OR non-relative), but
  // skip lines carrying a `with {` attribute (shared-runtime imports).
  const fromRe = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = fromRe.exec(source)) !== null) {
    const lineStart = source.lastIndexOf('\n', match.index) + 1;
    const lineEnd = source.indexOf('\n', match.index);
    const line = source.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (/with\s*\{/.test(line)) continue;
    specifiers.add(match[1]!);
  }

  // Match bare side-effect imports: import './foo' or import 'pkg'.
  const bareRe = /import\s+['"]([^'"]+)['"]/g;
  while ((match = bareRe.exec(source)) !== null) {
    specifiers.add(match[1]!);
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
 * Which imports are followed:
 *   - Relative imports (`./foo`, `../bar`) — always (original behaviour).
 *   - Non-relative imports (path aliases, tsconfig `paths`, `@/…`, `~/…`,
 *     bare packages) — resolved via `resolveImport`. Followed when they
 *     resolve to project/aliased source OUTSIDE `node_modules`, so internal
 *     aliases are no longer silently dropped.
 *   - Imports resolving INTO `node_modules` — followed only when they match
 *     the `includeWorkletPackages` allowlist, letting a published package
 *     ship MT worklets to consumers.
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
    if (isWorkletPackage(spec, includeWorkletPackages)) kept.push(spec);
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
