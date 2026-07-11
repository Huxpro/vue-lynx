// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

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
  /**
   * Keep `?vue&type=template` sub-module imports. Element templates hoist
   * their registrations into the compiled template module (non-script-setup
   * SFCs), so the dependency edge must survive on the MT layer for the
   * loader to extract them. Off by default — identical to historical
   * behavior when element templates are disabled.
   */
  keepTemplateSubModules = false,
): string {
  const specifiers = new Set<string>();

  // Match 'from' clause with relative specifier: from './foo' or from "../bar"
  // but skip lines that contain `with {` (shared runtime imports).
  const fromRe = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = fromRe.exec(source)) !== null) {
    // Check if this import has `with {` attribute (shared runtime import)
    const lineStart = source.lastIndexOf('\n', match.index) + 1;
    const lineEnd = source.indexOf('\n', match.index);
    const line = source.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (/with\s*\{/.test(line)) continue;
    specifiers.add(match[1]!);
  }

  // Match bare side-effect imports: import './foo' or import "../bar"
  const bareRe = /import\s+['"](\.[^'"]+)['"]/g;
  while ((match = bareRe.exec(source)) !== null) {
    specifiers.add(match[1]!);
  }

  if (specifiers.size === 0) return '';

  return [...specifiers]
    // Filter out vue template/style sub-module imports — they pull in
    // Vue runtime / CSS processing which is unnecessary on the MT layer.
    // Only keep script sub-modules (and non-vue imports).
    .filter(s => {
      if (!s.includes('?vue')) return true;
      if (s.includes('type=script')) return true;
      if (keepTemplateSubModules && s.includes('type=template')) return true;
      return false;
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
 * Strip `with { runtime: 'shared' }` import attributes, keeping the import.
 *
 * Used in IFR mode where the full module code is kept on the MT layer: the
 * shared-runtime escape hatch (which exists to bypass the stripping
 * loaders) is unnecessary, but the non-standard import attribute must not
 * reach the bundler's parser.
 */
export function stripSharedImportAttributes(code: string): string {
  return code.replace(
    /(import\s+.+?\s+from\s+(['"])[^'"]+\2)\s*with\s*\{[\s\S]*?runtime:\s*['"]shared['"][\s\S]*?\}\s*;?/g,
    '$1;',
  );
}

/**
 * Remove imports of Vue SFC style sub-modules (`?vue&type=style`).
 *
 * Used in IFR mode on the `.vue` connector for the MT layer: the connector
 * passes through mostly untouched (script + template are needed to render
 * the first frame), but CSS is already extracted from the background layer —
 * processing style sub-modules again on the MT layer would duplicate it.
 */
export function stripStyleImports(code: string): string {
  return code
    .split('\n')
    .filter(
      (line) => !(/^\s*import\b/.test(line) && line.includes('type=style')),
    )
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
 */
export function extractTemplateRegistrations(source: string): string {
  const marker = 'globalThis.__vueLynxRegisterElementTemplate';
  const out: string[] = [];
  let searchFrom = 0;
  while (true) {
    const idx = source.indexOf(marker, searchFrom);
    if (idx === -1) break;
    // The marker sits inside `(globalThis.… || function () {})(args…)`.
    const wrapperStart = source.lastIndexOf('(', idx);
    if (wrapperStart === -1) {
      searchFrom = idx + marker.length;
      continue;
    }
    const wrapperEnd = findBalancedEnd(source, wrapperStart);
    if (wrapperEnd === -1 || source[wrapperEnd + 1] !== '(') {
      searchFrom = idx + marker.length;
      continue;
    }
    const argsEnd = findBalancedEnd(source, wrapperEnd + 1);
    if (argsEnd === -1) {
      searchFrom = idx + marker.length;
      continue;
    }
    out.push(`${source.slice(wrapperStart, argsEnd + 1)};`);
    searchFrom = argsEnd + 1;
  }
  return out.join('\n');
}

/** Given the index of a '(' in `code`, return the index of its matching ')'. */
function findBalancedEnd(code: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < code.length; i++) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
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
