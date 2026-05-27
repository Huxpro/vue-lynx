// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

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
 * Extract import statements that reference relative (local) paths.
 *
 * Converts named/default/namespace imports to side-effect-only imports
 * (`import './foo'`) to preserve webpack's dependency graph without
 * executing user code or pulling in external packages.
 *
 * This is critical for the MT layer: entry files like `index.ts` may not
 * contain `'main thread'` directives themselves, but they import `.vue`
 * or `.ts` files that do. Without preserving these edges, webpack never
 * reaches the files with worklet registrations.
 *
 * Bare-specifier imports are followed only if they match a
 * `workletPackages` entry — see {@link isWorkletPackage}. This lets
 * library authors ship reusable worklets (e.g. animation primitives) as
 * normal npm/workspace packages, while keeping unrelated dependencies
 * out of the MT bundle.
 *
 * Vue sub-module imports (`?vue&type=template`, `?vue&type=style`) are
 * filtered out — only `?vue&type=script` imports are preserved. Template
 * and style sub-modules would pull in Vue runtime/CSS processing on the
 * MT layer, which is unnecessary and harmful.
 *
 * Imports with `with { runtime: 'shared' }` are also skipped — these are
 * handled separately by `extractSharedImports()`.
 */
export function extractLocalImports(
  source: string,
  workletPackages: ReadonlyArray<string | RegExp> = [],
): string {
  const specifiers = new Set<string>();

  // Match 'from' clause with any specifier (relative OR bare).
  // We filter bare specifiers against `workletPackages` below.
  const fromRe = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = fromRe.exec(source)) !== null) {
    // Check if this import has `with {` attribute (shared runtime import)
    const lineStart = source.lastIndexOf('\n', match.index) + 1;
    const lineEnd = source.indexOf('\n', match.index);
    const line = source.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (/with\s*\{/.test(line)) continue;
    const spec = match[1]!;
    if (spec.startsWith('.')) {
      specifiers.add(spec);
    } else if (isWorkletPackage(spec, workletPackages)) {
      specifiers.add(spec);
    }
  }

  // Match bare side-effect imports: import './foo' or import 'pkg'
  const bareRe = /import\s+['"]([^'"]+)['"]/g;
  while ((match = bareRe.exec(source)) !== null) {
    const spec = match[1]!;
    if (spec.startsWith('.')) {
      specifiers.add(spec);
    } else if (isWorkletPackage(spec, workletPackages)) {
      specifiers.add(spec);
    }
  }

  if (specifiers.size === 0) return '';

  return [...specifiers]
    // Filter out vue template/style sub-module imports — they pull in
    // Vue runtime / CSS processing which is unnecessary on the MT layer.
    // Only keep script sub-modules (and non-vue imports).
    .filter(s => {
      if (!s.includes('?vue')) return true;
      return s.includes('type=script');
    })
    .map(s => `import '${s}';`)
    .join('\n');
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
