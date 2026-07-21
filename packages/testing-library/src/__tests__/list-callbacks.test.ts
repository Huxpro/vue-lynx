/**
 * #303 — refresh __UpdateListCallbacks on every list flush; clear on destroy.
 */

import { describe, it, expect } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render } from '../index.js';

function env() {
  return (globalThis as any).lynxTestingEnv;
}

function elementTree() {
  return (globalThis as any).elementTree;
}

describe('list UpdateListCallbacks (#303)', () => {
  it('replaces componentAtIndex identity after a list flush', async () => {
    const items = ref(['A']);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            'list',
            null,
            items.value.map((item) =>
              h('list-item', { key: item, 'item-key': item }, [
                h('text', null, item),
              ]),
            ),
          );
      },
    });

    const { container } = render(Comp);
    const e = env();
    e.switchToMainThread();
    const listEl = container.querySelector('list') as any;
    expect(listEl).not.toBeNull();
    const before = listEl.componentAtIndex;
    expect(typeof before).toBe('function');

    e.switchToBackgroundThread();
    items.value = ['A', 'B'];
    await nextTick();
    await nextTick();

    e.switchToMainThread();
    expect(listEl.componentAtIndex).not.toBe(before);
    expect(typeof listEl.componentAtIndex).toBe('function');

    // Fresh callbacks still drive enter/leave.
    const sign = elementTree().enterListItemAtIndex(listEl, 0);
    expect(typeof sign).toBe('number');
  });

  it('installs inert callbacks when the list is destroyed', async () => {
    const show = ref(true);

    const Comp = defineComponent({
      setup() {
        return () =>
          show.value
            ? h('list', null, [
              h('list-item', { key: 'a', 'item-key': 'a' }, [
                h('text', null, 'A'),
              ]),
            ])
            : h('view', null, [h('text', null, 'gone')]);
      },
    });

    const { container } = render(Comp);
    const e = env();
    e.switchToMainThread();
    const listEl = container.querySelector('list') as any;
    expect(listEl).not.toBeNull();
    const listID = listEl.$$uiSign;
    const live = listEl.componentAtIndex(listEl, listID, 0, 1);
    expect(typeof live).toBe('number');
    expect(live).not.toBe(-1);

    e.switchToBackgroundThread();
    show.value = false;
    await nextTick();
    await nextTick();

    e.switchToMainThread();
    // Element reference retained; callbacks replaced with destroy noops.
    expect(listEl.componentAtIndex(listEl, listID, 0, 2)).toBe(-1);
  });

  it('recreate after destroy mounts a fresh working list', async () => {
    const show = ref(true);

    const Comp = defineComponent({
      setup() {
        return () =>
          show.value
            ? h('list', { key: 'L1' }, [
              h('list-item', { key: 'a', 'item-key': 'a' }, [
                h('text', null, 'A'),
              ]),
              h('list-item', { key: 'b', 'item-key': 'b' }, [
                h('text', null, 'B'),
              ]),
            ])
            : h('view', null, [h('text', null, 'gone')]);
      },
    });

    const { container } = render(Comp);
    const e = env();

    e.switchToBackgroundThread();
    show.value = false;
    await nextTick();
    await nextTick();
    show.value = true;
    await nextTick();
    await nextTick();

    e.switchToMainThread();
    const listEl = container.querySelector('list') as any;
    expect(listEl).not.toBeNull();
    const sign = elementTree().enterListItemAtIndex(listEl, 0);
    expect(typeof sign).toBe('number');
    expect(sign).not.toBe(-1);
  });
});
