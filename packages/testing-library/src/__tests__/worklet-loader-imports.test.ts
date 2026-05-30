/**
 * Tests for the MT worklet loader's import follower.
 *
 * `extractLocalImports` decides the entire MT dependency graph. If it ever
 * silently regresses, every `'main thread'` worklet reached through that
 * import disappears from the MT bundle with no build error — animations
 * just stop working and the runtime throws a confusing
 * `cannot read property 'bind' of undefined` deep inside worklet-runtime.
 *
 * The loader resolves each non-relative specifier and follows it when it
 * points at project/aliased source (outside `node_modules`); imports
 * resolving into `node_modules` are followed only when allowlisted via
 * `includeWorkletPackages`. These tests pin those invariants:
 *   - Relative imports are always followed (no regression)
 *   - Aliased / tsconfig-path imports resolving to project source ARE followed
 *   - Bare package imports are dropped by default, followed when allowlisted
 *   - Unresolvable specifiers are skipped, not fatal
 *   - The original specifier is re-emitted verbatim (downstream re-resolves)
 *   - `with { runtime: 'shared' }` and vue template/style sub-modules are skipped
 *   - End-to-end: an aliased worklet module's `registerWorkletInternal`
 *     reaches the MT output, and the importer re-emits the aliased edge
 */

import { describe, expect, it } from 'vitest';

import workletLoaderMT from '../../../vue-lynx/plugin/src/loaders/worklet-loader-mt.js';
import type { ResolveImport } from '../../../vue-lynx/plugin/src/loaders/worklet-utils.js';
import {
  extractImportSpecifiers,
  extractLocalImports,
  isUnderNodeModules,
  isWorkletPackage,
} from '../../../vue-lynx/plugin/src/loaders/worklet-utils.js';

/** Resolve specifiers from a fixed map; anything unlisted is unresolvable. */
function resolverFrom(map: Record<string, string>): ResolveImport {
  return async (specifier) => map[specifier] ?? null;
}

describe('isUnderNodeModules', () => {
  it('detects node_modules paths (posix + win32)', () => {
    expect(isUnderNodeModules('/proj/node_modules/lodash/index.js')).toBe(true);
    expect(isUnderNodeModules('C:\\proj\\node_modules\\pkg\\i.js')).toBe(true);
  });

  it('returns false for project source', () => {
    expect(isUnderNodeModules('/proj/src/gesture.ts')).toBe(false);
    // a file literally named node_modules.ts is not a node_modules tree
    expect(isUnderNodeModules('/proj/src/node_modules.ts')).toBe(false);
  });
});

describe('isWorkletPackage', () => {
  it('exact and package-root prefix match', () => {
    expect(isWorkletPackage('@org/motion', ['@org/motion'])).toBe(true);
    expect(isWorkletPackage('@org/motion/sub', ['@org/motion'])).toBe(true);
  });

  it('does NOT match same-prefix-different-package', () => {
    expect(isWorkletPackage('@org/motion-x', ['@org/motion'])).toBe(false);
    expect(isWorkletPackage('motion', ['mo'])).toBe(false);
  });

  it('RegExp is tested against the full specifier', () => {
    expect(isWorkletPackage('@my-org/lynx-anim', [/^@my-org\//])).toBe(true);
    expect(isWorkletPackage('lodash', [/^@my-org\//])).toBe(false);
  });

  it('empty allowlist matches nothing', () => {
    expect(isWorkletPackage('anything', [])).toBe(false);
  });
});

describe('extractImportSpecifiers', () => {
  it('keeps relative and non-relative, drops shared + vue template/style', () => {
    const specs = extractImportSpecifiers(`
      import { a } from './rel.js';
      import { b } from '@/alias';
      import { c } from 'pkg';
      import { d } from './shared.js' with { runtime: 'shared' };
      import s from './App.vue?vue&type=script&setup=true&lang.ts';
      import t from './App.vue?vue&type=template&id=abc';
      import y from './App.vue?vue&type=style&index=0&id=abc&lang.css';
    `);
    expect(specs).toContain('./rel.js');
    expect(specs).toContain('@/alias');
    expect(specs).toContain('pkg');
    expect(specs).not.toContain('./shared.js');
    expect(specs.some(s => s.includes('type=script'))).toBe(true);
    expect(specs.some(s => s.includes('type=template'))).toBe(false);
    expect(specs.some(s => s.includes('type=style'))).toBe(false);
  });
});

describe('extractLocalImports', () => {
  const noResolve = resolverFrom({});

  it('always follows relative imports (no resolution needed)', async () => {
    const out = await extractLocalImports(
      `
      import { foo } from './rel.js';
      import bar from '../sibling.js';
    `,
      noResolve,
    );
    expect(out).toContain(`import './rel.js'`);
    expect(out).toContain(`import '../sibling.js'`);
  });

  it('follows aliased / tsconfig-path imports resolving to project source', async () => {
    const resolve = resolverFrom({
      '@/gesture': '/project/src/gesture.ts',
      '#components/box': '/project/src/components/box.ts',
      '~/utils': '/project/src/utils/index.ts',
    });
    const out = await extractLocalImports(
      `
      import { useGesture } from '@/gesture';
      import Box from '#components/box';
      import { x } from '~/utils';
    `,
      resolve,
    );
    // re-emitted verbatim — downstream re-resolves with its own alias config
    expect(out).toContain(`import '@/gesture';`);
    expect(out).toContain(`import '#components/box';`);
    expect(out).toContain(`import '~/utils';`);
  });

  it('drops bare package imports resolving into node_modules by default', async () => {
    const resolve = resolverFrom({
      '@org/motion': '/project/node_modules/@org/motion/dist/index.js',
      lodash: '/project/node_modules/lodash/index.js',
    });
    const out = await extractLocalImports(
      `
      import { foo } from './rel.js';
      import { animate } from '@org/motion';
      import lodash from 'lodash';
    `,
      resolve,
    );
    expect(out).toContain(`import './rel.js'`);
    expect(out).not.toContain('@org/motion');
    expect(out).not.toContain('lodash');
  });

  it('follows node_modules imports that are allowlisted', async () => {
    const resolve = resolverFrom({
      '@org/motion': '/project/node_modules/@org/motion/dist/index.js',
      '@org/motion/sub': '/project/node_modules/@org/motion/dist/sub.js',
      lodash: '/project/node_modules/lodash/index.js',
    });
    const out = await extractLocalImports(
      `
      import { animate } from '@org/motion';
      import s from '@org/motion/sub';
      import unrelated from 'lodash';
    `,
      resolve,
      ['@org/motion'],
    );
    expect(out).toContain(`import '@org/motion';`);
    expect(out).toContain(`import '@org/motion/sub';`);
    expect(out).not.toContain('lodash');
  });

  it('skips unresolvable specifiers without throwing', async () => {
    const out = await extractLocalImports(
      `
      import { foo } from './rel.js';
      import { nope } from 'totally-missing-pkg';
    `,
      noResolve,
    );
    expect(out).toContain(`import './rel.js'`);
    expect(out).not.toContain('totally-missing-pkg');
  });

  it("skips imports with `with { runtime: 'shared' }`", async () => {
    const out = await extractLocalImports(
      `import { x } from './shared.js' with { runtime: 'shared' };`,
      noResolve,
    );
    expect(out).not.toContain(`import './shared.js'`);
  });

  it('keeps vue script sub-modules, drops template/style', async () => {
    const out = await extractLocalImports(
      `
      import script from './App.vue?vue&type=script&setup=true&lang.ts';
      import template from './App.vue?vue&type=template&id=abc';
      import style from './App.vue?vue&type=style&index=0&id=abc&lang.css';
    `,
      noResolve,
    );
    expect(out).toContain('type=script');
    expect(out).not.toContain('type=template');
    expect(out).not.toContain('type=style');
  });

  it('deduplicates repeated specifiers', async () => {
    const out = await extractLocalImports(
      `
      import a from './shared.js';
      import b from './shared.js';
    `,
      noResolve,
    );
    expect(out.match(/'\.\/shared\.js'/g)?.length).toBe(1);
  });

  it('returns empty string when nothing is followed', async () => {
    expect(await extractLocalImports('const x = 1;', noResolve)).toBe('');
    const resolve = resolverFrom({ lodash: '/p/node_modules/lodash/i.js' });
    expect(await extractLocalImports(`import 'lodash';`, resolve)).toBe('');
  });
});

// --- End-to-end through the actual loader (default export) -----------------

interface RunOptions {
  resourcePath?: string;
  resourceQuery?: string;
  resolve?: Record<string, string>;
  includeWorkletPackages?: ReadonlyArray<string | RegExp>;
}

/** Drive the async loader with a minimal mock LoaderContext. */
function runLoaderMT(source: string, opts: RunOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const ctx = {
      cacheable() {},
      async() {
        return (err: Error | null, result?: string) =>
          err ? reject(err) : resolve(result ?? '');
      },
      getOptions() {
        return { includeWorkletPackages: opts.includeWorkletPackages };
      },
      getResolve() {
        return (_context: string, request: string) => {
          const resolved = opts.resolve?.[request];
          return resolved == null
            ? Promise.reject(new Error(`cannot resolve ${request}`))
            : Promise.resolve(resolved);
        };
      },
      context: '/project/src',
      rootContext: '/project',
      resourcePath: opts.resourcePath ?? '/project/src/mod.ts',
      resourceQuery: opts.resourceQuery ?? '',
      emitError() {},
    };
    const loader = workletLoaderMT as unknown as (
      this: typeof ctx,
      source: string,
    ) => void;
    loader.call(ctx, source);
  });
}

describe('worklet-loader-mt (end-to-end)', () => {
  // A module that DEFINES a 'main thread' worklet (the aliased dependency).
  const gestureModule = `
    export const onScroll = (event: { detail?: { scrollTop?: number } }) => {
      'main thread'
      const y = event.detail?.scrollTop ?? 0
      return y
    }
  `;

  // An importer that reaches the worklet module through a path alias.
  const importerModule = `
    import { onScroll } from '@/gesture';
    export const handler = onScroll;
  `;

  it("extracts the worklet's registerWorkletInternal into MT output", async () => {
    const out = await runLoaderMT(gestureModule, {
      resourcePath: '/project/src/gesture.ts',
    });
    expect(out).toContain('registerWorkletInternal');
  });

  it('re-emits an aliased import edge so MT reaches the worklet module', async () => {
    const out = await runLoaderMT(importerModule, {
      resourcePath: '/project/src/App.ts',
      resolve: { '@/gesture': '/project/src/gesture.ts' },
    });
    expect(out).toContain(`import '@/gesture';`);
  });

  it('does NOT follow a bare npm import unless allowlisted', async () => {
    const src = `import { animate } from '@org/motion';\nexport const x = animate;`;
    const resolve = { '@org/motion': '/project/node_modules/@org/motion/index.js' };

    const dropped = await runLoaderMT(src, {
      resourcePath: '/project/src/App.ts',
      resolve,
    });
    expect(dropped).not.toContain('@org/motion');

    const followed = await runLoaderMT(src, {
      resourcePath: '/project/src/App.ts',
      resolve,
      includeWorkletPackages: ['@org/motion'],
    });
    expect(followed).toContain(`import '@org/motion';`);
  });
});
