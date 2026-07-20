// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { parse } from '@babel/parser';

import { TPL_REGISTER_GLOBAL } from 'vue-lynx/internal/ops';

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
export function extractImportSpecifiers(
  source: string,
  /**
   * Keep `?vue&type=template` sub-module imports. Element templates hoist
   * their registrations into the compiled template module (non-script-setup
   * SFCs), so the dependency edge must survive on the MT layer for the
   * loader to extract them.
   */
  keepTemplateSubModules = false,
): string[] {
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
    if (s.includes('type=script')) return true;
    if (keepTemplateSubModules && s.includes('type=template')) return true;
    return false;
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
  keepTemplateSubModules = false,
): Promise<string> {
  const kept: string[] = [];

  for (const spec of extractImportSpecifiers(source, keepTemplateSubModules)) {
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
/** Quick check for the `'main thread'` worklet directive. */
export function hasMainThreadDirective(source: string): boolean {
  return source.includes('\'main thread\'')
    || source.includes('"main thread"');
}

/**
 * One grammar for `import … from '…' with { … runtime: 'shared' … }`.
 * SWC may reformat the attribute block across multiple lines, hence the
 * [\s\S]*? tolerance. Capture groups: 1 = the plain import statement
 * (through the closing quote), 2 = specifiers, 3 = quote, 4 = module path.
 * Both consumers below derive from this single source so they cannot drift.
 */
const SHARED_IMPORT_RE_SOURCE =
  /(import\s+(.+?)\s+from\s+(['"])([^'"]+)\3)\s*with\s*\{[\s\S]*?runtime:\s*['"]shared['"][\s\S]*?\}\s*;?/
    .source;

export function extractSharedImports(source: string): string {
  // Cheap prefilter: virtually no module carries the attribute, and the
  // comment-strip + backtracking regex below are full-source passes run on
  // every MT-layer module.
  if (!source.includes('runtime:')) return '';
  const re = new RegExp(SHARED_IMPORT_RE_SOURCE, 'g');
  const imports: string[] = [];
  let match;
  source = stripComments(source);
  while ((match = re.exec(source)) !== null) {
    const specifiers = match[2]!;
    const quote = match[3]!;
    const modulePath = match[4]!;
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
 * We only need the registerWorkletInternal(...) calls. Each call is sliced
 * out by AST node span (parse once with @babel/parser, which vue-lynx
 * already ships via @vue/compiler-core) rather than scanned textually:
 * worklet bodies preserve source comments, so an apostrophe,
 * backtick, or unmatched paren inside a comment corrupts any scanner —
 * either truncating a slice (build error downstream) or, worse, silently
 * dropping every remaining registration in the module. Unparseable input
 * throws, surfacing as a loader error naming the module.
 *
 * The bare call — not the enclosing `loadWorkletRuntime(ctx) && …`
 * statement — is emitted; the gate identifier doesn't exist in the MT
 * module.
 */
export function extractRegistrations(lepusCode: string): string {
  const out: string[] = [];
  forEachCall(parse(lepusCode, { sourceType: 'module' }), (node) => {
    if (
      node.callee.type === 'Identifier'
      && node.callee.name === 'registerWorkletInternal'
    ) {
      out.push(lepusCode.slice(node.start, node.end) + ';');
      return true;
    }
    return false;
  });
  return out.join('\n');
}

/**
 * Walk every node of a `@babel/parser` AST and invoke `onCall` for each
 * `CallExpression`. Returning `true` skips that call's subtree, which
 * matches the old scanners' resume-past-the-call behavior (registrations
 * never nest). Nodes are untyped babel objects; `any` beats re-declaring
 * the AST shape.
 */
function forEachCall(ast: any, onCall: (node: any) => boolean): void {
  const walk = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node.type !== 'string') return;
    if (node.type === 'CallExpression' && onCall(node)) return;
    for (const key in node) {
      if (key === 'type' || key === 'start' || key === 'end') continue;
      walk(node[key]);
    }
  };
  walk(ast);
}

/**
 * Strip `with { runtime: 'shared' }` import attributes, keeping the import.
 *
 * Used in IFR mode where the full module code is kept on the MT layer: the
 * shared-runtime escape hatch (which exists to bypass the stripping
 * loaders) is unnecessary, but the non-standard import attribute must not
 * reach the bundler's parser.
 */
export function stripSharedImportAttributes(code: string): string {
  // Cheap prefilter: virtually no module carries the attribute, and the
  // backtracking regex below is run on every MT-layer module in IFR builds.
  if (!code.includes('runtime:')) return code;
  return code.replace(new RegExp(SHARED_IMPORT_RE_SOURCE, 'g'), '$1;');
}

/**
 * Remove imports of Vue SFC style sub-modules (`?vue&type=style`).
 *
 * Used in IFR mode on the `.vue` connector for the MT layer: the connector
 * passes through mostly untouched (script + template are needed to render
 * the first frame), but CSS is already extracted from the background layer —
 * processing style sub-modules again on the MT layer would duplicate it.
 *
 * CSS-Modules styles (`<style module>`) bind a default import that the
 * connector references (`cssModules["$style"] = style0`); dropping the
 * import must therefore leave a placeholder binding. The main-thread first
 * frame renders CSS-Modules class names as undefined and hydration patches
 * the real hashed names in — a known IFR limitation until the modules
 * mapping is routed to the MT layer.
 */
export function stripStyleImports(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      if (!(/^\s*import\b/.test(line) && line.includes('type=style'))) {
        return line;
      }
      const bound = line.match(/^\s*import\s+(\w+)\s+from\b/);
      return bound ? `const ${bound[1]} = {};` : null;
    })
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Extract element-template registrations from a compiled render module.
 *
 * The element-template compiler transform hoists statements of the form
 *   const _hoisted_N = (globalThis.__vueLynxRegisterElementTemplate ||
 *     function () {})("<id>", [...], function(P){…})
 * into the compiled script/template sub-module. On the interpreter-only
 * (non-IFR) main thread the module is otherwise stripped, but these
 * registrations must survive: the ops executor resolves create() functions
 * through them. The calls are self-contained (they resolve the global at
 * evaluation time; entry-main installs it before user code runs), so they
 * are re-emitted verbatim.
 *
 * The AST walk ignores comments by construction, so documentation examples
 * of the registration shape (including the one in
 * runtime/src/element-template.ts) are never re-emitted as executable code.
 * This matters when workspace tsconfig path aliases resolve `vue-lynx` to
 * TypeScript source rather than `runtime/dist`. The `typescript` plugin
 * covers script-setup SFCs, whose compiled sub-module carries the
 * registrations alongside user TypeScript.
 */
export function extractTemplateRegistrations(source: string): string {
  const out: string[] = [];
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript'] });
  // The hoisted call is `(globalThis.<TPL_REGISTER_GLOBAL> || function () {})(args…)`,
  // i.e. a CallExpression whose callee is that `||` short-circuit.
  forEachCall(ast, (node) => {
    const callee = node.callee;
    if (
      callee.type === 'LogicalExpression'
      && callee.left?.type === 'MemberExpression'
      && callee.left.object?.type === 'Identifier'
      && callee.left.object.name === 'globalThis'
      && callee.left.property?.type === 'Identifier'
      && callee.left.property.name === TPL_REGISTER_GLOBAL
    ) {
      out.push(source.slice(node.start, node.end) + ';');
      return true;
    }
    return false;
  });
  return out.join('\n');
}
