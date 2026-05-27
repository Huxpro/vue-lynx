/**
 * Unit tests for the MT worklet loader's import extractor.
 *
 * The regex in `extractLocalImports` decides the entire MT dependency
 * graph. If it ever silently regresses, every `'main thread'` worklet
 * disappears from the MT bundle with no runtime error — animations
 * just stop working. These tests pin the invariants that matter:
 *   - Relative imports are always preserved
 *   - Bare specifiers are dropped by default (backwards compat)
 *   - Allowlist entries match exactly OR as a package-root prefix
 *   - Allowlist entries do NOT match unrelated packages with the same
 *     prefix (e.g. `@vue-lynx/motion-mini` must not match
 *     `@vue-lynx/motion-mini-x`)
 *   - RegExp entries match against the full specifier
 *   - `with { runtime: 'shared' }` imports are skipped
 *   - Vue template/style sub-modules are dropped, script sub-modules kept
 */

import { describe, expect, it } from 'vitest';

import {
  extractLocalImports,
  isWorkletPackage,
} from '../../../vue-lynx/plugin/src/loaders/worklet-utils.js';

describe('isWorkletPackage', () => {
  it('exact string match', () => {
    expect(isWorkletPackage('@org/motion', ['@org/motion'])).toBe(true);
  });

  it('package-root prefix match', () => {
    expect(isWorkletPackage('@org/motion/sub/path', ['@org/motion'])).toBe(true);
  });

  it('does NOT match same-prefix-different-package', () => {
    // This is the classic prefix-match bug: `@org/motion`.startsWith('@org/motion')
    // is true for `@org/motion-x` even though that's a different package.
    expect(isWorkletPackage('@org/motion-x', ['@org/motion'])).toBe(false);
    expect(isWorkletPackage('motion', ['mo'])).toBe(false);
  });

  it('RegExp pattern is tested against the full specifier', () => {
    expect(isWorkletPackage('@my-org/lynx-anim', [/^@my-org\//])).toBe(true);
    expect(isWorkletPackage('lodash', [/^@my-org\//])).toBe(false);
  });

  it('empty allowlist matches nothing', () => {
    expect(isWorkletPackage('anything', [])).toBe(false);
  });
});

describe('extractLocalImports', () => {
  it('preserves relative imports', () => {
    const out = extractLocalImports(`
      import { foo } from './rel.js';
      import bar from '../sibling.js';
    `);
    expect(out).toContain(`import './rel.js'`);
    expect(out).toContain(`import '../sibling.js'`);
  });

  it('drops bare specifiers without allowlist (backwards compat)', () => {
    const out = extractLocalImports(`
      import { foo } from './rel.js';
      import { animate } from '@org/motion';
      import lodash from 'lodash';
    `);
    expect(out).toContain(`import './rel.js'`);
    expect(out).not.toContain('@org/motion');
    expect(out).not.toContain('lodash');
  });

  it('follows allowlisted bare specifiers (exact and subpath)', () => {
    const out = extractLocalImports(
      `
      import { foo } from './rel.js';
      import { animate } from '@org/motion';
      import s from '@org/motion/sub/path';
      import unrelated from 'lodash';
    `,
      ['@org/motion'],
    );
    expect(out).toContain(`import '@org/motion'`);
    expect(out).toContain(`import '@org/motion/sub/path'`);
    expect(out).not.toContain('lodash');
  });

  it('rejects same-prefix-different-package via allowlist', () => {
    const out = extractLocalImports(
      `import { x } from '@org/motion-x';`,
      ['@org/motion'],
    );
    expect(out).not.toContain('@org/motion-x');
  });

  it('follows RegExp-allowlisted specifiers', () => {
    const out = extractLocalImports(
      `
      import { a } from '@my-org/lynx-anim';
      import { b } from '@my-org/lynx-gestures';
      import { c } from '@other-org/thing';
    `,
      [/^@my-org\//],
    );
    expect(out).toContain(`import '@my-org/lynx-anim'`);
    expect(out).toContain(`import '@my-org/lynx-gestures'`);
    expect(out).not.toContain('@other-org');
  });

  it('preserves bare side-effect imports when allowlisted', () => {
    const out = extractLocalImports(
      `import '@org/motion';`,
      ['@org/motion'],
    );
    expect(out).toContain(`import '@org/motion'`);
  });

  it("skips imports with `with { runtime: 'shared' }`", () => {
    const out = extractLocalImports(
      `import { x } from './shared.js' with { runtime: 'shared' };`,
    );
    // The shared-runtime import is handled by extractSharedImports, not us.
    expect(out).not.toContain(`import './shared.js'`);
  });

  it('keeps vue script sub-modules but drops template/style', () => {
    const out = extractLocalImports(`
      import script from './App.vue?vue&type=script&setup=true&lang.ts';
      import template from './App.vue?vue&type=template&id=abc';
      import style from './App.vue?vue&type=style&index=0&id=abc&lang.css';
    `);
    expect(out).toContain('type=script');
    expect(out).not.toContain('type=template');
    expect(out).not.toContain('type=style');
  });

  it('returns empty string when no imports match', () => {
    expect(extractLocalImports('const x = 1;')).toBe('');
    expect(extractLocalImports(`import 'lodash';`)).toBe('');
  });

  it('deduplicates repeated specifiers', () => {
    const out = extractLocalImports(`
      import a from './shared.js';
      import b from './shared.js';
    `);
    const matches = out.match(/'\.\/shared\.js'/g);
    expect(matches?.length).toBe(1);
  });
});
