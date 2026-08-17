/**
 * Tests for v-memo / withMemo integration with the Lynx BG-thread renderer.
 *
 * v-memo is a compiler primitive — @vue/compiler-dom rewrites
 *   <tag v-memo="[dep]">...</tag>
 * into
 *   withMemo([dep], () => createElementVNode('tag', ...), _cache, 0)
 *
 * Vue's own upstream suite covers withMemo's VNode-level bailout behaviour.
 * These tests cover the Lynx-specific concern: that a cache hit correctly
 * prevents ops from entering the buffer and reaching the main thread.
 */

import {
  createApp,
  createElementBlock,
  defineComponent,
  Fragment,
  h,
  isMemoSame,
  nextTick,
  openBlock,
  ref,
  renderList,
  resetForTesting,
  withMemo,
} from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import { collectFlushedOps, resetCapturedOps } from './local-test-setup.js';

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
});

/** Extract all SET_PROP ops from a flat ops buffer. */
function parseSetPropOps(
  ops: unknown[],
): Array<{ id: unknown; key: unknown; value: unknown }> {
  const results: Array<{ id: unknown; key: unknown; value: unknown }> = [];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === OP.SET_PROP) {
      results.push({ id: ops[i + 1], key: ops[i + 2], value: ops[i + 3] });
      i += 3;
    }
  }
  return results;
}

// Both must be exported — compiler codegen imports them from vue-lynx.
// isMemoSame is emitted directly for v-for + v-memo combinations;
// withMemo is emitted for standalone v-memo.
it('withMemo and isMemoSame are exported from vue-lynx', () => {
  expect(typeof withMemo).toBe('function');
  expect(typeof isMemoSame).toBe('function');
});

describe('withMemo — ops pipeline', () => {
  it('produces no SET_PROP for memoized element when deps are unchanged', async () => {
    const outer = ref(0);  // triggers re-renders, NOT in memo deps
    const inner = ref('hello');  // IS in memo deps
    const cache: unknown[] = [];

    const App = defineComponent({
      setup() {
        return () =>
          h('view', { 'data-outer': String(outer.value) },
            withMemo(
              [inner.value],
              () => h('text', { content: inner.value }),
              cache,
              0,
            ),
          );
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps(); // drain mount ops

    outer.value++;
    await nextTick();

    const propOps = parseSetPropOps(collectFlushedOps());

    // Memoized subtree — no ops to MT
    expect(propOps.filter(op => op.key === 'content')).toHaveLength(0);
    // Non-memoized outer prop — still updated
    expect(propOps.filter(op => op.key === 'data-outer')).toHaveLength(1);
  });

  it('produces SET_PROP for memoized element when dep changes', async () => {
    const inner = ref('hello');
    const cache: unknown[] = [];

    const App = defineComponent({
      setup() {
        return () =>
          withMemo(
            [inner.value],
            () => h('text', { content: inner.value }),
            cache,
            0,
          );
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps(); // drain mount ops

    inner.value = 'world';
    await nextTick();

    const propOps = parseSetPropOps(collectFlushedOps());

    expect(propOps.filter(op => op.key === 'content')).toHaveLength(1);
    expect(propOps.filter(op => op.key === 'content')[0].value).toBe('world');
  });

  // v-memo="[]" — empty dep array, never changes, equivalent to v-once.
  it('v-memo with empty dep array never emits ops after mount', async () => {
    const msg = ref('hello');
    const outer = ref(0);
    const cache: unknown[] = [];

    const App = defineComponent({
      setup() {
        return () =>
          h('view', { 'data-outer': String(outer.value) },
            withMemo(
              [], // empty — deps never change
              () => h('text', { content: msg.value }),
              cache,
              0,
            ),
          );
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps();

    msg.value = 'world';
    outer.value++;
    await nextTick();

    const propOps = parseSetPropOps(collectFlushedOps());

    // Memoized subtree never updates — same as v-once
    expect(propOps.filter(op => op.key === 'content')).toHaveLength(0);
    // Outer still updates
    expect(propOps.filter(op => op.key === 'data-outer')).toHaveLength(1);
  });

  // v-for + v-memo compiles to a direct isMemoSame call inside a Fragment block,
  // not withMemo. The compiler wraps renderList in openBlock(true) +
  // createElementBlock(Fragment, ..., 128) — the same outer shape as v-for + v-once.
  // This test mirrors that exact codegen so the render function shape matches
  // @vue/compiler-dom output for:
  //   <text v-for="(item, idx) in list" :key="idx" v-memo="[item.selected, item.label]" :content="item.label" />
  it('v-for + v-memo pattern: unchanged list items produce no ops', async () => {
    type Item = { label: string; selected: boolean };
    const list = ref<Item[]>([
      { label: 'a', selected: false },
      { label: 'b', selected: false },
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache: any[] = [];

    const App = defineComponent({
      setup() {
        return () =>
          h('view', null,
            (openBlock(true),
            createElementBlock(
              Fragment,
              null,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (renderList as any)(list.value, (item: Item, idx: number, ___: number, _cached: any) => {
                const _memo = [item.selected, item.label];
                if (_cached && _cached.key === idx && isMemoSame(_cached, _memo))
                  return _cached;
                const _item = (
                  openBlock(),
                  createElementBlock(
                    'text',
                    { key: idx, content: item.label },
                    null,
                    8,
                    ['content'],
                  )
                );
                (_item as any).memo = _memo;
                return _item;
              }, cache, 0),
              128,
            )),
          );
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps(); // drain mount ops

    // Change only item[1].label — item[0] memo deps unchanged
    list.value = [
      { label: 'a', selected: false },    // unchanged — memo hit
      { label: 'b_new', selected: false }, // label changed — memo miss
    ];
    await nextTick();

    const propOps = parseSetPropOps(collectFlushedOps());
    const contentOps = propOps.filter(op => op.key === 'content');

    // Only item[1] should produce a SET_PROP — item[0] was memoized
    expect(contentOps).toHaveLength(1);
    expect(contentOps[0].value).toBe('b_new');
  });
});
