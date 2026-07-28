import { describe, expect, it } from 'vitest';

import {
  extractImportSpecifiers,
  extractTemplateRegistrations,
  hasMainThreadDirective,
  stripSharedImportAttributes,
  stripStyleImports,
} from '../../../vue-lynx/plugin/src/loaders/worklet-utils.js';

describe('IFR worklet loader utilities', () => {
  it('strips only the shared-runtime import attribute', () => {
    const source = `
      import { state } from './state.ts'
        with { runtime: 'shared' };
      import data from './data.json' with { type: 'json' };
    `;
    const out = stripSharedImportAttributes(source);

    expect(out).toContain("import { state } from './state.ts';");
    expect(out).not.toContain("runtime: 'shared'");
    expect(out).toContain("with { type: 'json' }");
  });

  it('does not rewrite import-shaped text inside literals or comments', () => {
    const source = `
      export const quoted = "import x from 'pkg' with { runtime: 'shared' };";
      export const templated = \`import y from 'pkg' with { runtime: 'shared' };\`;
      // import z from 'pkg' with { runtime: 'shared' };
    `;

    expect(stripSharedImportAttributes(source)).toBe(source);
  });

  it('accepts whitespace and comments around the shared-runtime attribute', () => {
    const source = `
      import { spaced } from './spaced.ts' with { runtime : 'shared' };
      import { commented } from './commented.ts'
        with /* parser trivia */ { runtime /* bundler hint */ : 'shared' };
    `;
    const out = stripSharedImportAttributes(source);

    expect(out).toContain("import { spaced } from './spaced.ts';");
    expect(out).toContain("import { commented } from './commented.ts';");
    expect(out).not.toContain('runtime');
  });

  it('drops ordinary style effects but retains a bound CSS-module import', () => {
    const source = `
      import './App.vue?vue&type=style&index=0&lang.css';
      import styles from './App.vue?vue&type=style&index=1&module=true&lang.css';
      const cssModules = { $style: styles };
    `;
    const out = stripStyleImports(source);

    expect(out).not.toContain('type=style&index=0');
    expect(out).toContain('type=style&index=1');
    expect(out).toContain('const cssModules = { $style: styles }');
  });

  it.each([
    `const label = 'main thread';`,
    `// 'main thread'\nexport const value = 1;`,
    `/* "main thread" */ export const value = 1;`,
    'const text = `main thread`;',
    `const object = { 'main thread': true };`,
    `call('main thread');`,
  ])('rejects a non-directive lookalike: %s', (source) => {
    expect(hasMainThreadDirective(source)).toBe(false);
  });

  it.each([
    `const f = () => { 'main thread'; return 1 }`,
    `function f() {\n  // worklet\n  "main thread"\n  return 1\n}`,
    `const re = /[/*]/; export const f = () => { 'main thread'; return re }`,
    String.raw`export const f = () => { 'main\x20thread'; return 1 }`,
  ])('accepts a real directive statement: %s', (source) => {
    expect(hasMainThreadDirective(source)).toBe(true);
  });

  it('keeps Vue template submodules only when element templates are enabled', () => {
    const source = `
      import script from './App.vue?vue&type=script&lang.ts';
      import { render } from './App.vue?vue&type=template&lang.ts';
      import './App.vue?vue&type=style&index=0&lang.css';
    `;

    expect(extractImportSpecifiers(source)).toEqual([
      './App.vue?vue&type=script&lang.ts',
    ]);
    expect(extractImportSpecifiers(source, true)).toEqual([
      './App.vue?vue&type=script&lang.ts',
      './App.vue?vue&type=template&lang.ts',
    ]);
  });

  it('extracts compiler-hoisted element-template registrations', () => {
    const source = `
      const _hoisted_1 = (globalThis.__vueLynxRegisterElementTemplate || function () {})(
        "tpl-a",
        ["#text", "class"],
        function(P) {
          const e0 = __CreateView(P);
          __SetAttribute(e0, 'text', "call us (maybe)");
          return [e0];
        }
      );
      export function render() {}
    `;

    const out = extractTemplateRegistrations(source);
    expect(out).toContain('globalThis.__vueLynxRegisterElementTemplate');
    expect(out).toContain('"tpl-a"');
    expect(out).toContain('"call us (maybe)"');
    expect(out.trim()).toMatch(/\);$/);
  });

  it('re-emits real registrations and ignores JSDoc examples', () => {
    const real =
      '(globalThis.__vueLynxRegisterElementTemplate || function () {})("ab12", ["#text"], function (P) { return [e0]; })';
    const src = [
      '/**',
      ' *   const _hoisted_1 = (globalThis.__vueLynxRegisterElementTemplate ||',
      ' *     function () {})("<id>", ["class", "#text"],',
      ' *     function (P) { return [e0]; })',
      ' */',
      `const _hoisted_1 = ${real};`,
    ].join('\n');
    expect(extractTemplateRegistrations(src)).toBe(`${real};`);
  });
});
