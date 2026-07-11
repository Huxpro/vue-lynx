/**
 * Loader utility tests (IFR main-thread connector handling).
 */

import { describe, it, expect } from 'vitest';
import { stripStyleImports } from '../../../vue-lynx/plugin/src/loaders/worklet-utils.js';

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
