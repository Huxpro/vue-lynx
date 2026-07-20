/**
 * Differential + fuzz coverage for MT worklet registration extraction.
 *
 * `extractRegistrations` runs on real LEPUS transform output, which
 * preserves arbitrary user code — comments, strings, regex literals,
 * template nesting — inside `registerWorkletInternal(...)` bodies. The
 * 0.4.x and 0.5.x scanners each died on a token class they didn't lex
 * (parens inside strings, then parens inside comments), and the usual
 * failure was SILENT: a green build whose MT bundle is missing
 * registrations, crashing on first interaction with
 * `cannot read property 'bind' of undefined`.
 *
 * These tests run the real `transformReactLynxSync` and pin extraction
 * against ground truth the generator knows:
 *  - every generated worklet yields exactly one extracted registration
 *  - every extracted slice reparses standalone as a
 *    `registerWorkletInternal(...)` call with a string hash argument
 *  - the extracted hash set equals the `_wkltId` set in the JS
 *    (background) transform of the same source — the device-level
 *    invariant whose violation is the runtime bind-of-undefined crash
 */

import { parse } from '@babel/parser';
import { describe, expect, it } from 'vitest';

import { transformReactLynxSync } from '@lynx-js/react/transform';

import { extractRegistrations } from '../../../vue-lynx/plugin/src/loaders/worklet-utils.js';

function transform(src: string, target: 'LEPUS' | 'JS'): string {
  const result = transformReactLynxSync(src, {
    pluginName: 'vue:worklet-mt',
    filename: '/fuzz/mod.ts',
    sourcemap: false,
    cssScope: false,
    shake: false,
    compat: false,
    refresh: false,
    defineDCE: false,
    directiveDCE: false,
    worklet: { target, filename: '/fuzz/mod.ts', runtimePkg: 'vue-lynx' },
  });
  expect(result.errors).toHaveLength(0);
  return result.code;
}

interface AstNode {
  type: string;
  start: number;
  end: number;
  [key: string]: unknown;
}

/** Generic AST walk collecting nodes matched by `visit`. */
function walkAst(code: string, visit: (node: AstNode) => void): void {
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (!value || typeof (value as AstNode).type !== 'string') return;
    const node = value as AstNode;
    visit(node);
    for (const key in node) {
      if (key === 'type' || key === 'start' || key === 'end') continue;
      const child = node[key];
      if (child && typeof child === 'object') walk(child);
    }
  };
  walk(parse(code, { sourceType: 'module' }));
}

/**
 * Parse `code` and return the hash argument of every
 * `registerWorkletInternal(type, hash, fn)` call. Throwing on unparseable
 * input is part of the check: extracted output must be valid standalone JS.
 */
function registeredHashes(code: string): string[] {
  const hashes: string[] = [];
  walkAst(code, (node) => {
    if (node.type !== 'CallExpression') return;
    const callee = node.callee as AstNode & { name?: string };
    if (callee.type !== 'Identifier') return;
    if (callee.name !== 'registerWorkletInternal') return;
    const args = node.arguments as AstNode[];
    expect(args).toHaveLength(3);
    const hash = args[1] as AstNode & { value?: unknown };
    expect(hash.type).toBe('StringLiteral');
    hashes.push(hash.value as string);
  });
  return hashes;
}

/** `_wkltId` values from the JS (background) transform of a module. */
function backgroundWorkletIds(code: string): string[] {
  const ids: string[] = [];
  walkAst(code, (node) => {
    if (node.type !== 'ObjectProperty') return;
    const key = node.key as AstNode & { name?: string };
    if (key.type !== 'Identifier' || key.name !== '_wkltId') return;
    const value = node.value as AstNode & { value?: unknown };
    if (value.type === 'StringLiteral') ids.push(value.value as string);
  });
  return ids;
}

/**
 * Full-pipeline check: LEPUS transform → extraction, asserting count
 * against the generator's ground truth and hash parity with the JS
 * (background) transform of the same source.
 */
function expectExtraction(src: string, workletCount: number): void {
  const extracted = extractRegistrations(transform(src, 'LEPUS'));
  const hashes = registeredHashes(extracted);
  expect(hashes).toHaveLength(workletCount);
  expect(new Set(hashes).size).toBe(workletCount);
  expect(new Set(hashes)).toEqual(
    new Set(backgroundWorkletIds(transform(src, 'JS'))),
  );
}

/**
 * Body fragments that killed a shipped scanner (or plausibly kill the
 * next hand-rolled one). Each is valid inside a worklet function body.
 */
const HOSTILE_FRAGMENTS: ReadonlyArray<[name: string, fragment: string]> = [
  ['apostrophe in line comment', `// don't do this twice (see notes`],
  ['unmatched open paren in line comment', `// see fig (1`],
  ['unmatched close paren in line comment', `// closes) everything))`],
  ['apostrophe and paren in block comment', `/* it's fine :) */`],
  ['backtick and paren in block comment', '/* `tick` and ( more */'],
  ['regex with quote and paren', `const m = 'a,b'.split(/[',(]/);`],
  ['regex after division', `const d = 4 / 2 / 1; const ok = /don't\\)/.test('x');`],
  ['nested template interpolation', 'const t = `a${d ? `in${d}ner` : "e"}b`;'],
  ['extraction marker inside a string', `const f = "registerWorkletInternal(fake";`],
  ['extraction marker inside a comment', `// registerWorkletInternal( not a real call`],
  ['unmatched parens inside a string', `const u = ")((";`],
  ['escaped quote in string', `const e = 'it\\'s';`],
  ['template with unmatched paren', 'const b = `open ( only`;'],
];

/** Deterministic PRNG so fuzz failures reproduce byte-for-byte. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('extraction pipeline: hostile worklet bodies (real LEPUS output)', () => {
  for (const [name, fragment] of HOSTILE_FRAGMENTS) {
    it(`survives ${name}`, () => {
      // Two worklets with the fragment in the FIRST body: a scanner that
      // loses balance mid-module drops the second one silently.
      const src = [
        `export function first(el) {`,
        `  'main thread';`,
        `  ${fragment}`,
        `  el.setStyleProperty('opacity', '0.5');`,
        `}`,
        `export function second(el) {`,
        `  'main thread';`,
        `  el.setStyleProperty('x', '1');`,
        `}`,
      ].join('\n');
      expectExtraction(src, 2);
    });
  }
});

describe('extraction pipeline: seeded fuzz', () => {
  it('extracts every worklet across 120 generated adversarial modules', () => {
    const rand = mulberry32(0xc0ffee);
    const pick = <T>(arr: readonly T[]): T =>
      arr[Math.floor(rand() * arr.length)]!;

    for (let m = 0; m < 120; m++) {
      const workletCount = 1 + Math.floor(rand() * 3);
      const plainCount = Math.floor(rand() * 3);
      const fns: string[] = [];

      for (let w = 0; w < workletCount; w++) {
        const body: string[] = [`  'main thread';`];
        const fragments = 1 + Math.floor(rand() * 4);
        // Block-wrap each fragment (braces on their own lines — a line
        // comment fragment would swallow a same-line closing brace): the
        // same fragment picked twice would otherwise redeclare its consts
        // in one function scope.
        for (let f = 0; f < fragments; f++) {
          body.push(`  {\n  ${pick(HOSTILE_FRAGMENTS)[1]}\n  }`);
        }
        // Unique tail line -> unique worklet hash per function.
        body.push(`  el.setStyleProperty('k${m}_${w}', 'v');`);
        fns.push(`export function w${w}(el, d) {\n${body.join('\n')}\n}`);
      }
      // Plain functions carry hostile content too: it lands in the LEPUS
      // module OUTSIDE registrations and must not corrupt the whole-module
      // parse either.
      for (let p = 0; p < plainCount; p++) {
        fns.push(
          `export function p${p}(q) {\n  {\n  ${pick(HOSTILE_FRAGMENTS)[1]}\n  }\n  return q + ${p};\n}`,
        );
      }

      expectExtraction(fns.join('\n'), workletCount);
    }
  });
});

describe('extraction parser envelope (forward syntax)', () => {
  // Direct LEPUS-shaped input: pins what the parser accepts independently
  // of what today's transform emits, so a future @lynx-js/react emitting
  // newer syntax doesn't surprise us.
  const FUTURE_BODIES: ReadonlyArray<[name: string, body: string]> = [
    ['bigint and numeric separators', 'const n = 1_000_000n;'],
    ['optional chaining and nullish', 'const v = a?.b ?? c;'],
    ['exponentiation', 'const p = a ** 2;'],
    ['regex v flag', 'const r = /[\\p{L}]/v.test(s);'],
    ['named capture groups', 'const g = /(?<y>\\d{4})/.exec(s);'],
    [
      'class with private field and static block',
      'class K { #x = 1; static { globalThis.__k = 2; } m() { return this.#x; } }',
    ],
    ['async generator', 'async function* g() { yield await p; }'],
    ['using declaration', 'using h = getHandle();'],
  ];

  for (const [name, body] of FUTURE_BODIES) {
    it(`parses ${name}`, () => {
      const call = `registerWorkletInternal("main-thread", "h1", function() {\n  ${body}\n})`;
      const out = extractRegistrations(
        `var loadWorkletRuntime = x;\nloadWorkletRuntime(ctx) && ${call};\n`,
      );
      expect(out).toBe(`${call};`);
    });
  }

  it('parses top-level await alongside registrations', () => {
    const call = 'registerWorkletInternal("main-thread", "h2", function() { f(); })';
    const src = `const cfg = await loadCfg();\nok && ${call};\n`;
    expect(extractRegistrations(src)).toBe(`${call};`);
  });

  it('throws loudly on unparseable input instead of silently truncating', () => {
    // Decorators need a parser plugin; the point pinned here is the
    // failure MODE — a thrown error fails the module build with a message
    // naming it, rather than emitting a partial MT bundle.
    expect(() => extractRegistrations('@dec class X {}\nregisterWorkletInternal("main-thread", "h3", function() {});'))
      .toThrow();
  });
});
