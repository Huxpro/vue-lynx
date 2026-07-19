/**
 * Loader utility tests (IFR main-thread connector handling).
 */

import { describe, it, expect } from 'vitest';
import {
  extractRegistrations,
  extractTemplateRegistrations,
  stripStyleImports,
} from '../../../vue-lynx/plugin/src/loaders/worklet-utils.js';

describe('extractRegistrations', () => {
  it('extracts calls whose bodies contain comments with quotes and unmatched parens', () => {
    // LEPUS output preserves source comments inside worklet bodies; an
    // apostrophe or unmatched paren in one must not corrupt extraction.
    const reg =
      `registerWorkletInternal("main-thread", "a1b2", function () {\n`
      + `  // don't do this twice (see notes\n`
      + `  elRef.current?.setStyleProperty('opacity', '0.5');\n`
      + `})`;
    const src = `loadWorkletRuntime(ctx) && ${reg};\n`;
    expect(extractRegistrations(src)).toBe(`${reg};`);
  });

  it('keeps extracting registrations after a comment-corrupted body', () => {
    // The silent failure mode: a scanner that loses balance mid-module
    // drops every remaining registration while the build stays green.
    const regs = [
      `registerWorkletInternal("main-thread", "h1", function () {\n  /* it's fine :) */ f(1);\n})`,
      `registerWorkletInternal("main-thread", "h2", function () {\n  g(\`tick\`);\n})`,
      `registerWorkletInternal("main-thread", "h3", function () {\n  h(3);\n})`,
    ];
    const src = regs.map((r) => `loadWorkletRuntime(ctx) && ${r};`).join('\n');
    expect(extractRegistrations(src)).toBe(regs.map((r) => `${r};`).join('\n'));
  });

  it('parses shared-runtime import attributes in LEPUS output', () => {
    const src = [
      `import { shared } from './shared.js' with { runtime: 'shared' };`,
      `loadWorkletRuntime(ctx) && registerWorkletInternal("main-thread", "h4", function () { shared(); });`,
    ].join('\n');
    expect(extractRegistrations(src)).toBe(
      `registerWorkletInternal("main-thread", "h4", function () { shared(); });`,
    );
  });
});

describe('extractTemplateRegistrations', () => {
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

describe('stripStyleImports', () => {
  it('drops side-effect style imports and keeps everything else', () => {
    const src = [
      `import script from "./App.vue?vue&type=script&lang.ts";`,
      `import "./App.vue?vue&type=style&index=0&lang.css";`,
      `import { render } from "./App.vue?vue&type=template&lang.ts";`,
    ].join('\n');
    const out = stripStyleImports(src);
    expect(out).not.toContain('type=style');
    expect(out).toContain('type=script');
    expect(out).toContain('type=template');
  });

  it('replaces CSS-Modules default imports with a placeholder binding', () => {
    // `<style module>` connectors reference the binding afterwards
    // (cssModules["$style"] = style0) — dropping the import outright would
    // leave a dangling identifier and crash the main-thread bundle.
    const src = [
      `import style0 from "./A.vue?vue&type=style&index=0&module=true&lang.css";`,
      `const cssModules = {};`,
      `cssModules["$style"] = style0;`,
    ].join('\n');
    const out = stripStyleImports(src);
    expect(out).toContain('const style0 = {};');
    expect(out).not.toContain('type=style');
    expect(out).toContain('cssModules["$style"] = style0;');
  });
});
