/**
 * `<script main>` SFC block lowering tests (issue #314).
 *
 * The transform is a pure SFC-text rewrite; the first suites assert the
 * rewrite itself, and the last suite proves the lowered output flows through
 * the real downstream pipeline: @vue/compiler-sfc script compilation and the
 * SWC worklet transforms (BG JS pass + MT LEPUS pass) with matching _wkltId
 * content hashes.
 */

import { describe, it, expect } from 'vitest';
import { parse, compileScript } from 'vue/compiler-sfc';
import { transformReactLynxSync } from '@lynx-js/react/transform';

import {
  mayHaveScriptMainBlock,
  transformScriptMain,
} from '../../../vue-lynx/plugin/src/compiler/script-main-transform.js';

const FILE = '/test/App.vue';

function lower(source: string) {
  const result = transformScriptMain(source, FILE);
  if (result === null) throw new Error('expected a <script main> block');
  expect(result.errors).toEqual([]);
  return result.code;
}

function lowerErrors(source: string): string[] {
  const result = transformScriptMain(source, FILE);
  if (result === null) throw new Error('expected a <script main> block');
  expect(result.errors.length).toBeGreaterThan(0);
  return result.errors;
}

describe('transformScriptMain', () => {
  it('passes through SFCs without a <script main> block', () => {
    const source = [
      '<script setup>',
      'const n = 1',
      '</script>',
      '<template><view /></template>',
    ].join('\n');
    expect(mayHaveScriptMainBlock(source)).toBe(false);
    expect(transformScriptMain(source, FILE)).toBeNull();
  });

  it('merges the main block into <script setup> with directives injected', () => {
    const source = [
      '<script setup>',
      "import { ref } from 'vue'",
      'const height = ref(100)',
      '</script>',
      '',
      '<script main>',
      'function handleTapMain() {',
      '  console.log(height.value)',
      '}',
      'const helper = (x) => {',
      '  return x * 2',
      '}',
      '</script>',
      '',
      '<template><view /></template>',
    ].join('\n');

    const code = lower(source);

    // The main block is gone; a single setup block remains.
    expect(code).not.toContain('<script main>');
    expect(code.match(/<script\b/g)).toHaveLength(1);

    // Both functions got the directive as their first body statement.
    expect(code).toContain("function handleTapMain() {\n'main thread';");
    expect(code).toContain("const helper = (x) => {\n'main thread';");

    // Lowered code lives inside the setup block (before its </script>).
    const setupEnd = code.indexOf('</script>');
    expect(code.indexOf('handleTapMain')).toBeLessThan(setupEnd);

    // The whole thing still parses as a valid SFC with one script block.
    const { descriptor, errors } = parse(code, { filename: FILE });
    expect(errors).toEqual([]);
    expect(descriptor.scriptSetup).toBeTruthy();
    expect(descriptor.script).toBeNull();
  });

  it('turns <script main> into <script setup> when no setup block exists', () => {
    const source = [
      '<script main lang="ts">',
      'function onTap(): void {',
      '  console.log("mt")',
      '}',
      '</script>',
      '<template><view /></template>',
    ].join('\n');

    const code = lower(source);
    expect(code).toContain('<script setup lang="ts">');
    expect(code).not.toContain('<script main');
    expect(code).toContain("function onTap(): void {\n'main thread';");
  });

  it('wraps expression-body arrows in a block with the directive', () => {
    const source = [
      '<script setup>',
      'const base = 10',
      '</script>',
      '<script main>',
      'const double = (x) => x * 2 + base',
      '</script>',
    ].join('\n');

    const code = lower(source);
    expect(code).toContain(
      "const double = (x) => { 'main thread'; return (x * 2 + base); }",
    );
  });

  it('does not double-inject an existing directive', () => {
    const source = [
      '<script setup>',
      'const n = 1',
      '</script>',
      '<script main>',
      'function onTap() {',
      "  'main thread'",
      '  console.log(n)',
      '}',
      '</script>',
    ].join('\n');

    const code = lower(source);
    expect(code.match(/'main thread'/g)).toHaveLength(1);
  });

  it('keeps non-function declarations as background-scope statements', () => {
    const source = [
      '<script setup>',
      'const n = 1',
      '</script>',
      '<script main>',
      "import { useMainThreadRef } from 'vue-lynx'",
      'const mtRef = useMainThreadRef(null)',
      'function onTap() {',
      '  mtRef.current?.setStyleProperty("height", "10px")',
      '}',
      '</script>',
    ].join('\n');

    const code = lower(source);
    expect(code).toContain('const mtRef = useMainThreadRef(null)');
    // Only the function got a directive, not the const.
    expect(code.match(/'main thread'/g)).toHaveLength(1);
    expect(code).toContain("import { useMainThreadRef } from 'vue-lynx'");
  });

  it('drops import specifiers that duplicate setup imports', () => {
    const source = [
      '<script setup>',
      "import { ref, watch } from 'vue'",
      'const n = ref(1)',
      '</script>',
      '<script main>',
      "import { ref, computed } from 'vue'",
      'const c = () => { console.log(ref, computed) }',
      '</script>',
    ].join('\n');

    const code = lower(source);
    // `ref` was already imported in setup — only `computed` survives.
    expect(code).toContain("import { computed } from 'vue';");
    const { errors } = parse(code, { filename: FILE });
    expect(errors).toEqual([]);
    // Compilable: no duplicate `ref` binding in the merged scope.
    const { descriptor } = parse(code, { filename: FILE });
    expect(() => compileScript(descriptor, { id: 'test' })).not.toThrow();
  });

  it('errors on binding collisions with <script setup>', () => {
    const source = [
      '<script setup>',
      'function onTap() {}',
      '</script>',
      '<script main>',
      'function onTap() { console.log(1) }',
      '</script>',
    ].join('\n');

    const errors = lowerErrors(source);
    expect(errors[0]).toContain('"onTap"');
    expect(errors[0]).toContain('collides');
  });

  it('errors on exports and top-level side effects', () => {
    expect(
      lowerErrors(
        '<script main>\nexport function f() {}\n</script>',
      )[0],
    ).toContain('cannot contain exports');

    expect(
      lowerErrors('<script main>\nconsole.log("boot")\n</script>')[0],
    ).toContain('BACKGROUND thread');
  });

  it('errors on multiple main blocks, main+setup, and lang mismatch', () => {
    expect(
      lowerErrors(
        '<script main>\nconst a = 1\n</script>\n'
          + '<script main>\nconst b = 2\n</script>',
      )[0],
    ).toContain('only one <script main>');

    expect(
      lowerErrors('<script main setup>\nconst a = 1\n</script>')[0],
    ).toContain('<script main setup>');

    expect(
      lowerErrors(
        '<script setup lang="ts">\nconst a = 1\n</script>\n'
          + '<script main>\nconst b = () => {}\n</script>',
      )[0],
    ).toContain('must match');
  });

  it('strips the main block from the output even on error', () => {
    const result = transformScriptMain(
      '<script setup>\nconst a = 1\n</script>\n'
        + '<script main>\nexport const b = 2\n</script>',
      FILE,
    )!;
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.code).not.toContain('<script main>');
    expect(result.code).toContain('<script setup>');
  });

  it('ignores `<script main>` text inside HTML comments', () => {
    const source = [
      '<!-- This demo shows the `<script main>` block. -->',
      '<script setup>',
      'const n = 1',
      '</script>',
      '<!-- main-thread code lives in `<script main>` below -->',
      '<script main>',
      'function onTap() { console.log(n) }',
      '</script>',
    ].join('\n');

    const code = lower(source);
    expect(code).toContain("function onTap() {\n'main thread';");
    // Comments survive untouched.
    expect(code).toContain('<!-- This demo shows the `<script main>` block. -->');

    // Comment-only mention with no real block → pass through.
    expect(
      transformScriptMain(
        '<!-- about `<script main>` -->\n<script setup>\nconst a = 1\n</script>',
        FILE,
      ),
    ).toBeNull();
  });

  it('is idempotent — the lowered output has no main block left', () => {
    const source = [
      '<script setup>',
      'const n = 1',
      '</script>',
      '<script main>',
      'function onTap() { console.log(n) }',
      '</script>',
    ].join('\n');

    const code = lower(source);
    expect(transformScriptMain(code, FILE)).toBeNull();
  });
});

describe('<script main> end-to-end (compiler-sfc + SWC worklet transforms)', () => {
  const source = [
    '<script setup>',
    "import { ref } from 'vue'",
    'const height = ref(100)',
    '</script>',
    '',
    '<script main>',
    'function handleTapMain() {',
    '  console.log(height.value)',
    '}',
    '</script>',
    '',
    '<template><view :main-thread-bindtap="handleTapMain" /></template>',
  ].join('\n');

  function compiledScript(): string {
    const code = lower(source);
    const { descriptor, errors } = parse(code, { filename: FILE });
    expect(errors).toEqual([]);
    return compileScript(descriptor, { id: 'test' }).content;
  }

  function runWorkletTransform(code: string, target: 'JS' | 'LEPUS') {
    return transformReactLynxSync(code, {
      pluginName: `test:${target}`,
      filename: FILE,
      sourcemap: false,
      cssScope: false,
      shake: false,
      compat: false,
      refresh: false,
      defineDCE: false,
      directiveDCE: false,
      worklet: { target, filename: FILE, runtimePkg: 'vue-lynx' },
    });
  }

  it('survives compiler-sfc script compilation', () => {
    const content = compiledScript();
    expect(content).toContain("'main thread'");
    expect(content).toContain('handleTapMain');
    // Exposed as a setup binding, so the template can reference it.
    expect(content).toContain('setup(');
  });

  it('produces a BG worklet context and a matching MT registration', () => {
    const content = compiledScript();

    const bg = runWorkletTransform(content, 'JS');
    expect(bg.errors).toEqual([]);
    // BG pass replaces the worklet function with a context object.
    expect(bg.code).toContain('_wkltId');

    const mt = runWorkletTransform(content, 'LEPUS');
    expect(mt.errors).toEqual([]);
    expect(mt.code).toContain('registerWorkletInternal');

    // The BG context hash and the MT registration hash must agree —
    // this is the invariant the whole dual-layer pipeline relies on.
    const bgId = bg.code.match(/_wkltId:\s*"([^"]+)"/)?.[1];
    const mtIds = [...mt.code.matchAll(/registerWorkletInternal\([^,]*,\s*"([^"]+)"/g)]
      .map((m) => m[1]);
    expect(bgId).toBeTruthy();
    expect(mtIds).toContain(bgId);
  });
});
