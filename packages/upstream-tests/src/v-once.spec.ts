/**
 * Tests for v-once integration with the Lynx BG-thread renderer.
 *
 * v-once is a compiler primitive — @vue/compiler-dom rewrites
 *   <tag v-once>{{ val }}</tag>
 * into
 *   _cache[0] || (
 *     _setBlockTracking(-1, true),
 *     (_cache[0] = createElementVNode('tag', null, toDisplayString(val), -1)).cacheIndex = 0,
 *     _setBlockTracking(1),
 *     _cache[0]
 *   )
 *
 * After the first render _cache[0] is truthy, so the cached VNode is returned
 * on every subsequent render. The patcher sees the same object reference and
 * short-circuits — no ops enter the buffer for the v-once subtree.
 *
 * These tests simulate that compiler output using render functions and
 * verify the Lynx-specific concern: that no ops reach the main thread after
 * the initial mount.
 */

import {
  createApp,
  createElementVNode,
  defineComponent,
  h,
  nextTick,
  ref,
  renderList,
  resetForTesting,
  setBlockTracking,
  toDisplayString,
} from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import { collectFlushedOps, resetCapturedOps } from './local-test-setup.js';

beforeEach(() => {
  resetForTesting();
  resetCapturedOps();
});

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

it('setBlockTracking is exported from vue-lynx', () => {
  expect(typeof setBlockTracking).toBe('function');
});

describe('v-once — ops pipeline', () => {
  it('initial render emits SET_PROP ops for v-once subtree', async () => {
    const msg = ref('hello');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache: any[] = [];

    const App = defineComponent({
      setup() {
        return () =>
          // Mirrors compiler output for: <text :content="msg" v-once />
          cache[0] ||
          (setBlockTracking(-1, true),
          (cache[0] = createElementVNode(
            'text',
            { content: toDisplayString(msg.value) },
            null,
            -1,
          ) as any).cacheIndex = 0,
          setBlockTracking(1),
          cache[0]);
      },
    });

    createApp(App).mount();
    await nextTick();

    const propOps = parseSetPropOps(collectFlushedOps());
    expect(propOps.filter(op => op.key === 'content')).toHaveLength(1);
    expect(propOps.find(op => op.key === 'content')!.value).toBe('hello');
  });

  it('re-render after reactive change emits no ops for v-once subtree', async () => {
    const msg = ref('hello');
    const outer = ref(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache: any[] = [];

    const App = defineComponent({
      setup() {
        return () =>
          h('view', { 'data-outer': String(outer.value) },
            // v-once subtree — compiled to cache lookup
            cache[0] ||
            (setBlockTracking(-1, true),
            (cache[0] = createElementVNode(
              'text',
              { content: toDisplayString(msg.value) },
              null,
              -1,
            ) as any).cacheIndex = 0,
            setBlockTracking(1),
            cache[0]),
          );
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps(); // drain mount ops

    msg.value = 'world'; // change tracked inside v-once — should be ignored
    outer.value++;       // change outside v-once — should produce ops
    await nextTick();

    const propOps = parseSetPropOps(collectFlushedOps());

    // v-once subtree: no ops despite msg changing
    expect(propOps.filter(op => op.key === 'content')).toHaveLength(0);
    // Non-v-once prop: still updated
    expect(propOps.filter(op => op.key === 'data-outer')).toHaveLength(1);
  });

  it('v-once subtree retains initial value across multiple re-renders', async () => {
    const msg = ref('initial');
    const tick = ref(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache: any[] = [];

    const App = defineComponent({
      setup() {
        return () =>
          h('view', { 'data-tick': tick.value },
            cache[0] ||
            (setBlockTracking(-1, true),
            (cache[0] = createElementVNode(
              'text',
              { content: toDisplayString(msg.value) },
              null,
              -1,
            ) as any).cacheIndex = 0,
            setBlockTracking(1),
            cache[0]),
          );
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps();

    for (let i = 0; i < 3; i++) {
      msg.value = `update-${i}`;
      tick.value++;
      await nextTick();
      const propOps = parseSetPropOps(collectFlushedOps());
      expect(propOps.filter(op => op.key === 'content')).toHaveLength(0);
    }
  });

  // v-once inside v-for: compiler wraps the entire _renderList(...) result in
  // a single _cache[0] slot — it does NOT allocate one slot per item.
  // This matches @vue/compiler-dom output for:
  //   <text v-for="(item, idx) in list" :key="idx" v-once :content="item" />
  it('v-once inside v-for: whole list is frozen in a single cache slot', async () => {
    const list = ref(['a', 'b', 'c']);
    const outer = ref(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache: any[] = [];

    const App = defineComponent({
      setup() {
        return () =>
          h('view', { 'data-outer': outer.value },
            cache[0] ||
            (setBlockTracking(-1, true),
            (cache[0] = renderList(list.value, (item, idx) =>
              createElementVNode(
                'text',
                { key: idx, content: toDisplayString(item) },
                null,
                -1,
              ),
            ) as any).cacheIndex = 0,
            setBlockTracking(1),
            cache[0]),
          );
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps();

    // Mutate list values and trigger re-render via outer
    list.value = ['x', 'y', 'z'];
    outer.value++;
    await nextTick();

    const propOps = parseSetPropOps(collectFlushedOps());

    // No content ops — entire list is v-once frozen in cache[0]
    expect(propOps.filter(op => op.key === 'content')).toHaveLength(0);
    // Outer wrapper still updates
    expect(propOps.filter(op => op.key === 'data-outer')).toHaveLength(1);
  });

  // v-once on a component: compiler emits the same cache-slot pattern regardless
  // of whether the cached VNode is an element or a component. The patcher's
  // n1 === n2 same-reference check fires before any type-specific branching,
  // so the component subtree is frozen identically to a plain element.
  it('v-once on a component: no ops after mount even when prop changes', async () => {
    const msg = ref('hello');
    const outer = ref(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache: any[] = [];

    const Child = defineComponent({
      props: { label: String },
      setup(props) {
        return () => h('text', { content: props.label });
      },
    });

    const App = defineComponent({
      setup() {
        return () =>
          h('view', { 'data-outer': outer.value },
            // Mirrors compiler output for: <Child v-once :label="msg" />
            cache[0] ||
            (setBlockTracking(-1, true),
            (cache[0] = h(Child, { label: msg.value }) as any).cacheIndex = 0,
            setBlockTracking(1),
            cache[0]),
          );
      },
    });

    createApp(App).mount();
    await nextTick();
    collectFlushedOps(); // drain mount ops

    msg.value = 'world'; // prop change — ignored because VNode ref is cached
    outer.value++;
    await nextTick();

    const propOps = parseSetPropOps(collectFlushedOps());

    // Component subtree frozen — Child never re-renders
    expect(propOps.filter(op => op.key === 'content')).toHaveLength(0);
    // Non-v-once wrapper still updates
    expect(propOps.filter(op => op.key === 'data-outer')).toHaveLength(1);
  });
});
