/**
 * List cell recycling — mirrors ReactLynx enterListItemAtIndex / leaveListItem
 * coverage for gSignMap / gRecycleMap self-reuse and cross-item hydrate.
 *
 * Reference: lynx-family/lynx-stack packages/react/runtime/lib/list.js
 */

import { describe, it, expect } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render } from '../index.js';
import {
  getRecyclePoolSizeForTest,
  getSignMapSizeForTest,
} from '../../../vue-lynx/main-thread/src/list-apply.js';

function env() {
  return (globalThis as any).lynxTestingEnv;
}

/** ElementTree lives on MT globalThis after switchToMainThread(). */
function elementTree() {
  return (globalThis as any).elementTree;
}

function mountList(keys: string[], reuseIdentifier?: string) {
  const Comp = defineComponent({
    setup() {
      return () =>
        h(
          'list',
          null,
          keys.map((key) =>
            h(
              'list-item',
              {
                key,
                'item-key': key,
                ...(reuseIdentifier
                  ? { 'reuse-identifier': reuseIdentifier }
                  : {}),
              },
              [h('text', null, key)],
            ),
          ),
        );
    },
  });
  return render(Comp);
}

describe('list cell recycling', () => {
  it('self-reuses the same uiSign after leave + re-enter', () => {
    const { container } = mountList(['A', 'B', 'C']);
    const e = env();
    e.switchToMainThread();

    const listEl = container.querySelector('list') as any;
    expect(listEl).not.toBeNull();
    const tree = elementTree();

    const sign0 = tree.enterListItemAtIndex(listEl, 0);
    expect(typeof sign0).toBe('number');
    expect(getSignMapSizeForTest(listEl.$$uiSign)).toBe(1);

    tree.leaveListItem(listEl, sign0);
    expect(getSignMapSizeForTest(listEl.$$uiSign)).toBe(0);
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign)).toBe(1);

    const sign0b = tree.enterListItemAtIndex(listEl, 0);
    expect(sign0b).toBe(sign0);
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign)).toBe(0);
    expect(getSignMapSizeForTest(listEl.$$uiSign)).toBe(1);
  });

  it('cross-item recycle reuses the pooled uiSign for another index', () => {
    const { container } = mountList(['A', 'B'], 'row');
    const e = env();
    e.switchToMainThread();

    const listEl = container.querySelector('list') as any;
    const tree = elementTree();

    const sign0 = tree.enterListItemAtIndex(listEl, 0);
    tree.leaveListItem(listEl, sign0);

    // Enter a different cell — should hydrate onto the pooled root.
    const sign1 = tree.enterListItemAtIndex(listEl, 1);
    expect(sign1).toBe(sign0);

    // Displaced spare is pooled for the donor.
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign, 'list-itemrow')).toBe(
      1,
    );
  });

  it('keeps distinct reuse-identifier pools separate', () => {
    const Comp = defineComponent({
      render() {
        return h('list', null, [
          h(
            'list-item',
            { key: 'a', 'item-key': 'a', 'reuse-identifier': 'type-a' },
            [h('text', null, 'A')],
          ),
          h(
            'list-item',
            { key: 'b', 'item-key': 'b', 'reuse-identifier': 'type-b' },
            [h('text', null, 'B')],
          ),
        ]);
      },
    });

    const { container } = render(Comp);
    const e = env();
    e.switchToMainThread();
    const listEl = container.querySelector('list') as any;
    const tree = elementTree();

    const signA = tree.enterListItemAtIndex(listEl, 0);
    tree.leaveListItem(listEl, signA);

    // type-b must not take type-a's pooled root.
    const signB = tree.enterListItemAtIndex(listEl, 1);
    expect(signB).not.toBe(signA);
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign, 'list-itemtype-a')).toBe(
      1,
    );
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign, 'list-itemtype-b')).toBe(
      0,
    );
  });

  it('mounts multiple cells via componentAtIndex and pools on leave', () => {
    const { container } = mountList(['A', 'B', 'C']);
    const e = env();
    e.switchToMainThread();
    const listEl = container.querySelector('list') as any;
    const tree = elementTree();

    const sign0 = tree.enterListItemAtIndex(listEl, 0, 101);
    const sign1 = tree.enterListItemAtIndex(listEl, 1, 102);
    expect(typeof sign0).toBe('number');
    expect(typeof sign1).toBe('number');
    expect(sign0).not.toBe(sign1);
    expect(getSignMapSizeForTest(listEl.$$uiSign)).toBe(2);

    tree.leaveListItem(listEl, sign0);
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign)).toBe(1);
    expect(getSignMapSizeForTest(listEl.$$uiSign)).toBe(1);

    // Re-enter index 0 — self-reuse.
    expect(tree.enterListItemAtIndex(listEl, 0, 103)).toBe(sign0);
  });

  it('reactive list still works with recycling after mutations', async () => {
    const items = ref(['A', 'B', 'C']);
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
    const tree = elementTree();

    const s0 = tree.enterListItemAtIndex(listEl, 0);
    tree.leaveListItem(listEl, s0);
    expect(tree.enterListItemAtIndex(listEl, 0)).toBe(s0);

    e.switchToBackgroundThread();
    items.value = ['A', 'C'];
    await nextTick();
    await nextTick();

    e.switchToMainThread();
    // After remove, remaining cells can still be entered.
    const sA = tree.enterListItemAtIndex(listEl, 0);
    expect(typeof sA).toBe('number');
  });
});
