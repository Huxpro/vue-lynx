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
  probeListRecycle,
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
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign, 'list-item:row')).toBe(
      1,
    );
  });

  it('without reuse-identifier, does not cross-item recycle', () => {
    const { container } = mountList(['A', 'B']);
    const e = env();
    e.switchToMainThread();

    const listEl = container.querySelector('list') as any;
    const tree = elementTree();

    const sign0 = tree.enterListItemAtIndex(listEl, 0);
    tree.leaveListItem(listEl, sign0);

    // Empty reuse-identifier → per-item pool only; B must get a fresh sign.
    const sign1 = tree.enterListItemAtIndex(listEl, 1);
    expect(sign1).not.toBe(sign0);
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign)).toBe(1);
  });

  it('skips cross-item hydrate when shapes are incompatible', () => {
    // Documents the uniform-cells-only limitation: same reuse-identifier but
    // different child counts (as with an inner v-if) must NOT mis-map content —
    // shapesCompatible refuses hydrate and B mounts its own tree.
    const Comp = defineComponent({
      render() {
        return h('list', null, [
          h(
            'list-item',
            { key: 'a', 'item-key': 'a', 'reuse-identifier': 'row' },
            [h('text', null, 'A')],
          ),
          h(
            'list-item',
            { key: 'b', 'item-key': 'b', 'reuse-identifier': 'row' },
            // Conditional-subtree stand-in: extra child vs cell A.
            [h('text', null, 'B'), h('text', null, 'EXTRA')],
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

    const signB = tree.enterListItemAtIndex(listEl, 1);
    expect(signB).not.toBe(signA);
    // Donor stays in the pool; B mounts its own tree (no silent mis-map).
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign, 'list-item:row')).toBe(
      1,
    );
    // EXTRA text must still be present on B's own tree.
    const texts = [...listEl.querySelectorAll('text')].map(
      (n: { textContent?: string }) => n.textContent,
    );
    expect(texts).toContain('EXTRA');
  });

  it('skips cross-item hydrate for reactive conditional subtrees', async () => {
    // Same reuse-identifier, but one cell gains a child via a reactive flag —
    // the shape gate must refuse hydrate rather than pair by Math.min length.
    const showExtra = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h('list', null, [
            h(
              'list-item',
              { key: 'a', 'item-key': 'a', 'reuse-identifier': 'row' },
              [h('text', null, 'A')],
            ),
            h(
              'list-item',
              { key: 'b', 'item-key': 'b', 'reuse-identifier': 'row' },
              showExtra.value
                ? [h('text', null, 'B'), h('text', null, 'EXTRA')]
                : [h('text', null, 'B')],
            ),
          ]);
      },
    });

    const { container } = render(Comp);
    const e = env();

    e.switchToBackgroundThread();
    showExtra.value = true;
    await nextTick();
    await nextTick();

    e.switchToMainThread();
    const listEl = container.querySelector('list') as any;
    const tree = elementTree();

    const signA = tree.enterListItemAtIndex(listEl, 0);
    tree.leaveListItem(listEl, signA);
    const signB = tree.enterListItemAtIndex(listEl, 1);
    expect(signB).not.toBe(signA);
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
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign, 'list-item:type-a')).toBe(
      1,
    );
    expect(getRecyclePoolSizeForTest(listEl.$$uiSign, 'list-item:type-b')).toBe(
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

  it('probeListRecycle reports self + cross reuse', () => {
    const { container } = mountList(['A', 'B', 'C'], 'row');
    const e = env();
    e.switchToMainThread();
    const listEl = container.querySelector('list') as any;

    const result = probeListRecycle(listEl);
    expect(result.selfOk).toBe(true);
    expect(result.crossOk).toBe(true);
    expect(result.sign0b).toBe(result.sign0);
    expect(result.sign1).toBe(result.sign0b);
    expect(result.poolAfterLeave).toBe(1);
    expect(result.reuseKey).toBe('list-item:row');
  });
});
