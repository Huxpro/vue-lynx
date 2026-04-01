/**
 * Tests for useCssVars — the Lynx BG-thread implementation of Vue's
 * CSS v-bind() support.
 *
 * useCssVars is called by the SFC compiler when a <style> block uses v-bind().
 * These tests exercise the function directly (passing the getter manually in
 * setup()) to verify:
 *
 *   1. Basic element — SET_STYLE op emitted on mount and on reactive update.
 *   2. Fragment root — SET_STYLE emitted for every sibling root element.
 *   3. Nested component root — CSS vars propagate through SF_COMPONENT paths.
 *   4. vShow interaction — SET_STYLE preserves `display: none` when v-show is active.
 *   5. Reactivity — changing the reactive source triggers a new SET_STYLE op
 *      via watchPostEffect without a manual flush.
 *
 * NOTE on ops capture:
 *   useCssVars calls scheduleFlush() which queues doFlush via queuePostFlushCb.
 *   doFlush drains the ops buffer (takeOps()) and sends the result to the MT
 *   via lynx.getNativeApp().callLepusMethod().  The local-test-setup.ts stub
 *   intercepts callLepusMethod and re-exposes the ops via collectFlushedOps().
 *   Tests must therefore use collectFlushedOps() (not takeOps()) after awaiting
 *   nextTick(), since the ops buffer is already empty by that point.
 */

import {
  createApp,
  defineComponent,
  Fragment,
  h,
  nextTick,
  ref,
  resetForTesting,
  useCssVars,
  vShow,
  withDirectives,
} from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import { collectFlushedOps, resetCapturedOps } from './local-test-setup.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find all SET_STYLE ops in the flat ops buffer.
 * The buffer format is: [..., OP.SET_STYLE, id, styleObject, ...]
 * Returns an array of { id, style } tuples for each SET_STYLE op found.
 */
function parseSetStyleOps(ops: unknown[]): Array<{ id: unknown; style: unknown }> {
  const results: Array<{ id: unknown; style: unknown }> = [];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === OP.SET_STYLE) {
      results.push({ id: ops[i + 1], style: ops[i + 2] });
      i += 2; // skip id and style
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
});

// ---------------------------------------------------------------------------
// 1. Basic element
// ---------------------------------------------------------------------------

describe('useCssVars — basic element', () => {
  it('emits SET_STYLE with CSS var on mount', async () => {
    const color = ref('red');

    const App = defineComponent({
      setup() {
        useCssVars((_ctx: unknown) => ({ 'abc123': color.value }));
        return () => h('view', { style: { fontSize: '14px' } });
      },
    });

    createApp(App).mount();
    await nextTick();

    const ops = collectFlushedOps();
    const styleOps = parseSetStyleOps(ops);

    // There should be at least one SET_STYLE op for the root element
    expect(styleOps.length).toBeGreaterThanOrEqual(1);

    // The last SET_STYLE for the root element (from useCssVars) should include
    // the CSS var with the leading '--' added by the implementation.
    const lastStyleOp = styleOps[styleOps.length - 1];
    expect(lastStyleOp.style).toMatchObject({
      '--abc123': 'red',
    });
  });

  it('emits a new SET_STYLE op when reactive source updates', async () => {
    const color = ref('red');

    const App = defineComponent({
      setup() {
        useCssVars((_ctx: unknown) => ({ 'abc123': color.value }));
        return () => h('view');
      },
    });

    createApp(App).mount();
    await nextTick();

    // Drain the mount-time ops
    collectFlushedOps();

    // Update the reactive source
    color.value = 'blue';
    await nextTick();

    const ops = collectFlushedOps();
    const styleOps = parseSetStyleOps(ops);

    expect(styleOps.length).toBeGreaterThanOrEqual(1);
    const lastStyleOp = styleOps[styleOps.length - 1];
    expect(lastStyleOp.style).toMatchObject({
      '--abc123': 'blue',
    });
  });

  it('merges CSS var on top of existing element styles', async () => {
    const color = ref('green');

    const App = defineComponent({
      setup() {
        useCssVars((_ctx: unknown) => ({ 'v1a2b3': color.value }));
        return () => h('view', { style: { backgroundColor: 'white' } });
      },
    });

    createApp(App).mount();
    await nextTick();

    const ops = collectFlushedOps();
    const styleOps = parseSetStyleOps(ops);

    // The SET_STYLE from useCssVars must include BOTH the original style AND
    // the CSS var (useCssVars spreads el._style then adds the vars).
    const cssVarOp = styleOps.find(
      (op) => (op.style as Record<string, unknown>)['--v1a2b3'] !== undefined,
    );
    expect(cssVarOp).toBeDefined();
    expect(cssVarOp!.style).toMatchObject({
      backgroundColor: 'white',
      '--v1a2b3': 'green',
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Fragment root
// ---------------------------------------------------------------------------

describe('useCssVars — fragment root', () => {
  it('emits SET_STYLE for every sibling root element in a Fragment', async () => {
    const color = ref('purple');

    const App = defineComponent({
      setup() {
        useCssVars((_ctx: unknown) => ({ 'frag1': color.value }));
        return () =>
          h(Fragment, null, [
            h('view', { key: 'a' }),
            h('text', { key: 'b' }),
            h('image', { key: 'c' }),
          ]);
      },
    });

    createApp(App).mount();
    await nextTick();

    const ops = collectFlushedOps();
    const styleOps = parseSetStyleOps(ops);

    // Each of the three root fragment children should have received a SET_STYLE
    // with the CSS var injected.
    const cssVarOps = styleOps.filter(
      (op) => (op.style as Record<string, unknown>)['--frag1'] !== undefined,
    );

    expect(cssVarOps.length).toBe(3);

    for (const op of cssVarOps) {
      expect((op.style as Record<string, unknown>)['--frag1']).toBe('purple');
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Nested component root
// ---------------------------------------------------------------------------

describe('useCssVars — nested component root', () => {
  it('propagates CSS vars through SF_COMPONENT path to child element', async () => {
    const color = ref('orange');

    // Inner child component — single root element
    const Child = defineComponent({
      setup() {
        return () => h('view');
      },
    });

    // Parent applies useCssVars; its subtree is a component (Child)
    const Parent = defineComponent({
      setup() {
        useCssVars((_ctx: unknown) => ({ 'nested1': color.value }));
        return () => h(Child);
      },
    });

    createApp(Parent).mount();
    await nextTick();

    const ops = collectFlushedOps();
    const styleOps = parseSetStyleOps(ops);

    // The CSS var must reach the actual DOM element inside Child
    const cssVarOp = styleOps.find(
      (op) => (op.style as Record<string, unknown>)['--nested1'] !== undefined,
    );
    expect(cssVarOp).toBeDefined();
    expect((cssVarOp!.style as Record<string, unknown>)['--nested1']).toBe('orange');
  });
});

// ---------------------------------------------------------------------------
// 4. vShow interaction
// ---------------------------------------------------------------------------

describe('useCssVars — vShow interaction', () => {
  it('preserves display:none when v-show is false alongside CSS vars', async () => {
    const color = ref('teal');
    const visible = ref(false);

    const App = defineComponent({
      setup() {
        useCssVars((_ctx: unknown) => ({ 'show1': color.value }));
        return () =>
          withDirectives(h('view'), [[vShow, visible.value]]);
      },
    });

    createApp(App).mount();
    await nextTick();

    const ops = collectFlushedOps();
    const styleOps = parseSetStyleOps(ops);

    // The SET_STYLE emitted by useCssVars must include display:none because
    // applyVarsToEl reads el._vShowHidden and merges it in.
    const cssVarOp = styleOps.find(
      (op) => (op.style as Record<string, unknown>)['--show1'] !== undefined,
    );

    expect(cssVarOp).toBeDefined();
    expect((cssVarOp!.style as Record<string, unknown>)['display']).toBe('none');
    expect((cssVarOp!.style as Record<string, unknown>)['--show1']).toBe('teal');
  });

  it('does not add display:none when v-show is true', async () => {
    const color = ref('teal');
    const visible = ref(true);

    const App = defineComponent({
      setup() {
        useCssVars((_ctx: unknown) => ({ 'show2': color.value }));
        return () =>
          withDirectives(h('view'), [[vShow, visible.value]]);
      },
    });

    createApp(App).mount();
    await nextTick();

    const ops = collectFlushedOps();
    const styleOps = parseSetStyleOps(ops);

    const cssVarOp = styleOps.find(
      (op) => (op.style as Record<string, unknown>)['--show2'] !== undefined,
    );

    expect(cssVarOp).toBeDefined();
    expect((cssVarOp!.style as Record<string, unknown>)['display']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5. Reactivity — watchPostEffect triggers automatically
// ---------------------------------------------------------------------------

describe('useCssVars — reactivity', () => {
  it('triggers SET_STYLE via watchPostEffect without manual flush', async () => {
    const color = ref('black');

    const App = defineComponent({
      setup() {
        useCssVars((_ctx: unknown) => ({ 'react1': color.value }));
        return () => h('view');
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps(); // drain mount ops

    // Change the reactive source — the watchPostEffect inside useCssVars
    // should automatically schedule and emit a new SET_STYLE op.
    color.value = 'white';

    // nextTick() waits for the Vue scheduler to flush the post-effect queue,
    // which is exactly when watchPostEffect fires — no manual flush needed.
    await nextTick();

    const ops = collectFlushedOps();
    const styleOps = parseSetStyleOps(ops);

    expect(styleOps.length).toBeGreaterThanOrEqual(1);

    const cssVarOp = styleOps.find(
      (op) => (op.style as Record<string, unknown>)['--react1'] !== undefined,
    );
    expect(cssVarOp).toBeDefined();
    expect((cssVarOp!.style as Record<string, unknown>)['--react1']).toBe('white');
  });

  it('does not emit SET_STYLE when reactive source does not change', async () => {
    const color = ref('gray');

    const App = defineComponent({
      setup() {
        useCssVars((_ctx: unknown) => ({ 'react2': color.value }));
        return () => h('view');
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps(); // drain mount ops

    // Setting the same value should not trigger a new effect run
    color.value = 'gray';
    await nextTick();

    const ops = collectFlushedOps();
    const styleOps = parseSetStyleOps(ops);

    // No SET_STYLE from useCssVars — the reactive dependency didn't change
    const cssVarOp = styleOps.find(
      (op) => (op.style as Record<string, unknown>)['--react2'] !== undefined,
    );
    expect(cssVarOp).toBeUndefined();
  });
});
