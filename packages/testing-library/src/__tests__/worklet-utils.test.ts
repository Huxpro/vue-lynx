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
  it('survives quotes, apostrophes, and parens inside worklet-body comments', () => {
    // The LEPUS transform preserves user comments inside worklet bodies.
    // An apostrophe (or stray quote/paren) in a comment must not derail the
    // balanced-paren scan — it used to silently drop every registration
    // after the offending one.
    const src = [
      'registerWorkletInternal("main-thread", "aa:bb:1", function() {',
      "  // the finger's position (x) — note the \"unpaired paren :)",
      '  /* block comment with an apostrophe: it\'s fine ( */',
      '  return f(1, 2);',
      '});',
      'registerWorkletInternal("main-thread", "aa:bb:2", function() {',
      '  return 2;',
      '});',
    ].join('\n');
    const out = extractRegistrations(src);
    expect(out).toContain('"aa:bb:1"');
    expect(out).toContain('"aa:bb:2"');
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
