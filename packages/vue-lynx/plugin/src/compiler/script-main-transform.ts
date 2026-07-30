// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * `<script main>` SFC block lowering (issue #314).
 *
 * Lowers a dedicated `<script main>` block into the existing `'main thread'`
 * worklet machinery, so users can group main-thread code in one block instead
 * of annotating every function:
 *
 * ```vue
 * <script setup>
 * const height = ref(100)
 * </script>
 *
 * <script main>
 * function handleTapMain() {
 *   console.log('runs on the main thread, sees', height.value)
 * }
 * </script>
 * ```
 *
 * The transform is a pure SFC-text rewrite that runs BEFORE vue-loader
 * (enforce: 'pre'), on the connector request and — via the inline match
 * resource loader chain that vue-loader bakes into `?vue&type=` sub-requests —
 * on every sub-module request as well. Both the Background and Main Thread
 * layers therefore compile the exact same rewritten source, keeping the SWC
 * worklet `_wkltId` content hashes in sync.
 *
 * Lowering rules for top-level statements of `<script main>`:
 *  - function declarations / `const f = () => {}` / `const f = function () {}`
 *    → a `'main thread'` directive is injected as the first body statement,
 *      handing the function to the SWC worklet transform (BG: context object,
 *      MT: LEPUS registration).
 *  - imports → merged into the `<script setup>` scope. Specifiers that are
 *    exact duplicates of a setup import (same local name, same imported name,
 *    same source) are dropped instead of erroring.
 *  - other variable declarations and TS type declarations → kept as ordinary
 *    background-scope statements (worklets capture them by closure, exactly
 *    like values declared in `<script setup>` today). Use `useMainThreadRef()`
 *    from 'vue-lynx' for element refs.
 *  - everything else (top-level side effects, exports) → compile error.
 *
 * The block's content is appended to the end of `<script setup>` (so worklets
 * can capture any setup binding); if the SFC has no setup block, the
 * `<script main>` block itself is rewritten into a `<script setup>` block.
 *
 * Like `vue-sfc-script-extractor`, block scanning is regex-based — a
 * `</script>` inside a string literal of the block is not supported.
 */

import { parse as babelParse } from '@babel/parser';
import type {
  ImportDeclaration,
  Node,
  Statement,
} from '@babel/types';

const MAIN_THREAD_DIRECTIVE = 'main thread';

const SCRIPT_OPEN_RE = /<script\b([^>]*)>/g;

interface ScriptBlock {
  /** Offset of `<` of the opening tag. */
  start: number;
  /** Offset just past the opening tag's `>`. */
  contentStart: number;
  /** Offset of `<` of the closing tag. */
  contentEnd: number;
  /** Offset just past the closing tag's `>`. */
  end: number;
  /** Raw attribute text of the opening tag. */
  rawAttrs: string;
  attrs: Map<string, string | true>;
  content: string;
}

export interface ScriptMainTransformResult {
  code: string;
  errors: string[];
}

/** Cheap pre-check so non-`<script main>` SFCs skip parsing entirely. */
export function mayHaveScriptMainBlock(source: string): boolean {
  return /<script\b[^>]*\bmain\b/.test(source);
}

/**
 * Lower `<script main>` blocks in an SFC source.
 *
 * Returns `null` when the SFC has no `<script main>` block (pass through
 * untouched). On error, returns the source with the main block stripped plus
 * the error messages — the block is never allowed through to vue-loader,
 * which would misparse it as an Options API `<script>`.
 */
export function transformScriptMain(
  source: string,
  filename: string,
): ScriptMainTransformResult | null {
  const blocks = scanScriptBlocks(source);

  const mainBlocks = blocks.filter((b) => b.attrs.has('main'));
  if (mainBlocks.length === 0) return null;

  const fail = (...errors: string[]): ScriptMainTransformResult => ({
    code: spliceAll(
      source,
      mainBlocks.map((b) => ({
        start: b.start,
        end: b.end,
        text: newlinePadding(source.slice(b.start, b.end)),
      })),
    ),
    errors: errors.map((e) => `[vue-lynx] ${filename}: ${e}`),
  });

  if (mainBlocks.length > 1) {
    return fail('only one <script main> block is allowed per component.');
  }
  const main = mainBlocks[0]!;
  if (main.attrs.has('setup')) {
    return fail(
      '<script main setup> is not supported — <script main> already compiles '
        + 'into the setup scope.',
    );
  }
  if (main.attrs.has('src')) {
    return fail('<script main src="..."> is not supported yet.');
  }

  const setup = blocks.find(
    (b) => b.attrs.has('setup') && !b.attrs.has('main'),
  );

  const mainLang = langOf(main);
  if (setup && langOf(setup) !== mainLang) {
    return fail(
      `<script main> lang ("${mainLang}") must match <script setup> lang `
        + `("${langOf(setup)}").`,
    );
  }

  let lowered: LoweredMainBlock;
  try {
    lowered = lowerMainBlock(
      main.content,
      mainLang,
      setup ? parseTopLevel(setup.content, langOf(setup)) : null,
    );
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
  if (lowered.errors.length > 0) {
    return fail(...lowered.errors);
  }

  if (setup) {
    // Remove the main block (preserving line numbers for everything after
    // it) and append the lowered code to the end of the setup block.
    return {
      code: spliceAll(source, [
        {
          start: main.start,
          end: main.end,
          text: newlinePadding(source.slice(main.start, main.end)),
        },
        {
          start: setup.contentEnd,
          end: setup.contentEnd,
          text: `\n${lowered.code}\n`,
        },
      ]),
      errors: [],
    };
  }

  // No <script setup>: the main block itself becomes the setup block.
  const attrs = rebuildAttrs(main.attrs, { drop: ['main'], add: ['setup'] });
  return {
    code: spliceAll(source, [
      {
        start: main.start,
        end: main.end,
        text: `<script ${attrs}>\n${lowered.code}\n</script>`,
      },
    ]),
    errors: [],
  };
}

// ---------------------------------------------------------------------------
// SFC block scanning
// ---------------------------------------------------------------------------

function scanScriptBlocks(source: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = [];
  const comments = scanCommentRanges(source);
  const inComment = (offset: number): { end: number } | undefined =>
    comments.find((c) => offset >= c.start && offset < c.end);
  SCRIPT_OPEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SCRIPT_OPEN_RE.exec(source)) !== null) {
    // `<script` text inside an HTML comment (e.g. a doc comment explaining
    // `<script main>`) is not a block — skip past the comment.
    const comment = inComment(match.index);
    if (comment) {
      SCRIPT_OPEN_RE.lastIndex = comment.end;
      continue;
    }
    const rawAttrs = match[1] ?? '';
    const contentStart = match.index + match[0].length;
    const close = source.indexOf('</script>', contentStart);
    if (close === -1) break;
    blocks.push({
      start: match.index,
      contentStart,
      contentEnd: close,
      end: close + '</script>'.length,
      rawAttrs,
      attrs: parseAttrs(rawAttrs),
      content: source.slice(contentStart, close),
    });
    SCRIPT_OPEN_RE.lastIndex = close + '</script>'.length;
  }
  SCRIPT_OPEN_RE.lastIndex = 0;
  return blocks;
}

/** Top-level `<!-- ... -->` ranges (an unclosed comment runs to EOF). */
function scanCommentRanges(
  source: string,
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  while (true) {
    const start = source.indexOf('<!--', cursor);
    if (start === -1) break;
    const close = source.indexOf('-->', start + '<!--'.length);
    const end = close === -1 ? source.length : close + '-->'.length;
    ranges.push({ start, end });
    cursor = end;
  }
  return ranges;
}

function parseAttrs(rawAttrs: string): Map<string, string | true> {
  const attrs = new Map<string, string | true>();
  const ATTR_RE = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(rawAttrs)) !== null) {
    attrs.set(m[1]!, m[2] ?? m[3] ?? m[4] ?? true);
  }
  return attrs;
}

function langOf(block: ScriptBlock): string {
  const lang = block.attrs.get('lang');
  return typeof lang === 'string' ? lang : 'js';
}

function rebuildAttrs(
  attrs: Map<string, string | true>,
  { drop, add }: { drop: string[]; add: string[] },
): string {
  const parts: string[] = [];
  for (const name of add) parts.push(name);
  for (const [name, value] of attrs) {
    if (drop.includes(name) || add.includes(name)) continue;
    parts.push(value === true ? name : `${name}="${value}"`);
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Main block lowering
// ---------------------------------------------------------------------------

interface SetupScope {
  /** All top-level binding names declared in <script setup>. */
  bindings: Set<string>;
  /** Import specifiers keyed by local name → `importedName\0source`. */
  imports: Map<string, string>;
}

interface LoweredMainBlock {
  code: string;
  errors: string[];
}

function parseTopLevel(content: string, lang: string): SetupScope {
  const ast = parseModule(content, lang);
  const scope: SetupScope = { bindings: new Set(), imports: new Map() };
  for (const stmt of ast.program.body) {
    if (stmt.type === 'ImportDeclaration') {
      for (const spec of stmt.specifiers) {
        scope.bindings.add(spec.local.name);
        scope.imports.set(spec.local.name, importKey(spec, stmt));
      }
    } else {
      for (const name of declaredNames(stmt)) scope.bindings.add(name);
    }
  }
  return scope;
}

function lowerMainBlock(
  content: string,
  lang: string,
  setupScope: SetupScope | null,
): LoweredMainBlock {
  const ast = parseModule(content, lang);
  const errors: string[] = [];
  const edits: Array<{ start: number; end: number; text: string }> = [];

  for (const stmt of ast.program.body) {
    switch (stmt.type) {
      case 'ImportDeclaration': {
        const rewritten = mergeImport(stmt, content, setupScope, errors);
        if (rewritten !== null) {
          edits.push({ start: stmt.start!, end: stmt.end!, text: rewritten });
        }
        break;
      }
      case 'FunctionDeclaration': {
        checkCollision(stmt.id?.name, setupScope, errors);
        injectDirective(stmt.body, edits);
        break;
      }
      case 'VariableDeclaration': {
        for (const decl of stmt.declarations) {
          for (const name of patternNames(decl.id)) {
            checkCollision(name, setupScope, errors);
          }
          const init = decl.init;
          if (!init) continue;
          if (init.type === 'FunctionExpression') {
            injectDirective(init.body, edits);
          } else if (init.type === 'ArrowFunctionExpression') {
            if (init.body.type === 'BlockStatement') {
              injectDirective(init.body, edits);
            } else {
              // Expression body: `() => expr` → `() => { 'main thread'; return (expr); }`
              const expr = content.slice(init.body.start!, init.body.end!);
              edits.push({
                start: init.body.start!,
                end: init.body.end!,
                text: `{ '${MAIN_THREAD_DIRECTIVE}'; return (${expr}); }`,
              });
            }
          }
          // Non-function initializers stay as background-scope statements
          // (captured by worklets by closure). No directive to inject.
        }
        break;
      }
      case 'TSTypeAliasDeclaration':
      case 'TSInterfaceDeclaration':
      case 'TSEnumDeclaration':
      case 'TSDeclareFunction':
        // Type-level (or ambient) declarations pass through untouched.
        break;
      case 'ExportNamedDeclaration':
      case 'ExportDefaultDeclaration':
      case 'ExportAllDeclaration':
        errors.push(
          '<script main> cannot contain exports — its declarations are '
            + 'merged into the component setup scope.',
        );
        break;
      default:
        errors.push(
          `<script main> only supports imports, function declarations and `
            + `variable declarations at the top level; found a statement of `
            + `type "${stmt.type}". Top-level side effects would run on the `
            + `BACKGROUND thread, which is probably not what you want — move `
            + `them into a marked function instead.`,
        );
    }
  }

  return { code: spliceAll(content, edits).trim(), errors };
}

function parseModule(content: string, lang: string) {
  return babelParse(content, {
    sourceType: 'module',
    plugins: /^tsx?$/.test(lang) ? ['typescript'] : [],
  });
}

/** Inject `'main thread'` as the first directive of a function body. */
function injectDirective(
  body: { start?: number | null; directives?: Array<{ value: { value: string } }> },
  edits: Array<{ start: number; end: number; text: string }>,
): void {
  const already = body.directives?.some(
    (d) => d.value.value === MAIN_THREAD_DIRECTIVE,
  );
  if (already) return;
  // body.start points at the `{` of the BlockStatement.
  const insertAt = body.start! + 1;
  edits.push({
    start: insertAt,
    end: insertAt,
    text: `\n'${MAIN_THREAD_DIRECTIVE}';`,
  });
}

/**
 * Merge a `<script main>` import into the setup scope.
 *
 * Returns the rewritten import statement text, or `null` to keep the
 * original text untouched. Exact-duplicate specifiers (same local name,
 * imported name, and source) are dropped; other local-name collisions with
 * setup bindings are errors.
 */
function mergeImport(
  stmt: ImportDeclaration,
  content: string,
  setupScope: SetupScope | null,
  errors: string[],
): string | null {
  if (!setupScope) return null;

  const kept: ImportDeclaration['specifiers'][number][] = [];
  let changed = false;
  for (const spec of stmt.specifiers) {
    const local = spec.local.name;
    const key = importKey(spec, stmt);
    if (setupScope.imports.get(local) === key) {
      changed = true; // exact duplicate of a setup import — drop it
      continue;
    }
    if (setupScope.bindings.has(local)) {
      changed = true;
      errors.push(
        `import "${local}" in <script main> collides with a <script setup> `
          + `binding of the same name.`,
      );
      continue;
    }
    kept.push(spec);
  }

  if (!changed) return null;
  if (kept.length === 0) return '';

  // Reconstruct the import from the surviving specifiers. Default/namespace
  // specifiers must stay outside the braces.
  const bare: string[] = [];
  const named: string[] = [];
  for (const spec of kept) {
    const text = content.slice(spec.start!, spec.end!);
    if (spec.type === 'ImportSpecifier') named.push(text);
    else bare.push(text);
  }
  const clauses = [...bare];
  if (named.length > 0) clauses.push(`{ ${named.join(', ')} }`);
  const typePrefix = stmt.importKind === 'type' ? 'type ' : '';
  const source = content.slice(stmt.source.start!, stmt.source.end!);
  return `import ${typePrefix}${clauses.join(', ')} from ${source};`;
}

function importKey(
  spec: ImportDeclaration['specifiers'][number],
  stmt: ImportDeclaration,
): string {
  const imported = spec.type === 'ImportSpecifier'
    ? (spec.imported.type === 'Identifier'
      ? spec.imported.name
      : spec.imported.value)
    : spec.type === 'ImportDefaultSpecifier'
    ? 'default'
    : '*';
  return `${imported}\0${stmt.source.value}`;
}

function checkCollision(
  name: string | undefined,
  setupScope: SetupScope | null,
  errors: string[],
): void {
  if (!name || !setupScope) return;
  if (setupScope.bindings.has(name)) {
    errors.push(
      `"${name}" in <script main> collides with a <script setup> binding `
        + `of the same name.`,
    );
  }
}

/** Names declared by a top-level statement (for collision checks). */
function declaredNames(stmt: Statement): string[] {
  switch (stmt.type) {
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
      return stmt.id ? [stmt.id.name] : [];
    case 'VariableDeclaration':
      return stmt.declarations.flatMap((d) => patternNames(d.id));
    default:
      return [];
  }
}

/** Binding names introduced by a declarator id (identifier or pattern). */
function patternNames(node: Node): string[] {
  switch (node.type) {
    case 'Identifier':
      return [node.name];
    case 'ObjectPattern':
      return node.properties.flatMap((p) =>
        p.type === 'RestElement'
          ? patternNames(p.argument)
          : patternNames(p.value)
      );
    case 'ArrayPattern':
      return node.elements.flatMap((el) => (el ? patternNames(el) : []));
    case 'AssignmentPattern':
      return patternNames(node.left);
    case 'RestElement':
      return patternNames(node.argument);
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Text splicing
// ---------------------------------------------------------------------------

/** Apply non-overlapping {start, end, text} edits to a string. */
function spliceAll(
  source: string,
  edits: Array<{ start: number; end: number; text: string }>,
): string {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  for (const edit of sorted) {
    out += source.slice(cursor, edit.start) + edit.text;
    cursor = edit.end;
  }
  return out + source.slice(cursor);
}

/** Newlines-only replacement that keeps later line numbers stable. */
function newlinePadding(text: string): string {
  return '\n'.repeat((text.match(/\n/g) ?? []).length);
}
