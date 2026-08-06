/**
 * IFR × native `<list>` interaction.
 *
 * A native list does not own its rows: `__CreateList` hands native three
 * main-thread closures, and the rows they hand back live in `list-apply`'s
 * registries, not in the element tree.  IFR moves a first screen from the main
 * thread to the background thread, so these tests pin the two places where
 * that ownership could go wrong:
 *
 *   1. Steady state — a hydrated list must keep exactly one native list, and
 *      the callbacks native holds must see the item order the *background*
 *      thread maintains after hydration (not the frozen first-screen copy).
 *   2. Fallback — when hydration hits a structural mismatch, the abandoned
 *      main-thread stream must not leave list registries behind: a later
 *      background op addressing a reused element id would otherwise be routed
 *      into a dead list instead of the element tree.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  h,
  defineComponent,
  ref,
  createApp,
  onMounted,
  resetForTesting,
} from 'vue-lynx';
import type { Component } from 'vue-lynx';
import { IFR_MOUNT_APPS_GLOBAL, OP, PAGE_ROOT_ID } from 'vue-lynx/internal/ops';
import {
  enableIFR,
  getIfrPhase,
  resetIfrForTesting,
} from '../../../vue-lynx/main-thread/src/ifr.js';
import { getListItemBgIdsForTest } from '../../../vue-lynx/main-thread/src/list-apply.js';
import { waitForUpdate } from '../render.js';

const env = () => (globalThis as any).lynxTestingEnv;

/** Phase 1: main-thread first-screen render via renderPage. */
function mtFirstScreenRender(comp: Component): Document {
  const e = env();
  e.switchToMainThread();
  const doc = e.jsdom.window.document as Document;
  doc.body.innerHTML = '';

  resetForTesting();
  resetIfrForTesting();
  enableIFR();

  createApp(comp).mount();
  (globalThis as any).renderPage({});
  return doc;
}

/** Phase 2: background thread boots, renders the same app, hydrates. */
function bgHydrate(comp: Component): void {
  const e = env();
  delete (globalThis as any).__VUE_LYNX_IFR_MT__;
  e.switchToBackgroundThread();
  resetForTesting();
  createApp(comp).mount();
}

/**
 * Ops-level harness: record a synthetic main-thread stream through the IFR
 * recorder, then feed synthetic background batches to `vuePatchUpdate`.
 * Component-level tests cannot produce a *multi-batch* first screen with a
 * mismatch in a later batch, which is exactly where fallback ordering matters.
 */
function mtRecordBatches(batches: unknown[][]): Document {
  const e = env();
  e.switchToMainThread();
  const doc = e.jsdom.window.document as Document;
  doc.body.innerHTML = '';

  resetForTesting();
  resetIfrForTesting();
  enableIFR();

  (globalThis as any)[IFR_MOUNT_APPS_GLOBAL] = () => {
    const apply = (globalThis as any)['__vueLynxIfrApplyOps'] as (
      ops: unknown[],
    ) => void;
    for (const batch of batches) apply(batch);
  };
  (globalThis as any).renderPage({});
  delete (globalThis as any)[IFR_MOUNT_APPS_GLOBAL];
  return doc;
}

function bgBatch(ops: unknown[]): void {
  (globalThis as any).vuePatchUpdate({ data: JSON.stringify(ops) });
}

/** The BG-side element id the main thread stamped on an element. */
function bgIdOf(el: Element): number {
  const attr = Array.from(el.attributes).find((a) =>
    a.name.startsWith('vue-ref-')
  );
  return Number(attr!.name.slice('vue-ref-'.length));
}

beforeEach(() => {
  delete (globalThis as any).__VUE_LYNX_IFR_MT__;
});

describe('IFR + native <list>', () => {
  it('keeps one native list and lets the background thread own the rows', async () => {
    const Comp = defineComponent({
      setup() {
        const rows = ref(['a', 'b', 'c']);
        // onMounted only runs on the background thread — this is the
        // post-hydration mutation native must be able to observe.
        onMounted(() => {
          rows.value = [...rows.value, 'd'];
        });
        return () =>
          h(
            'list',
            null,
            rows.value.map((row) =>
              h('list-item', { key: row, 'item-key': row }, [
                h('text', null, row),
              ])
            ),
          );
      },
    });

    const doc = mtFirstScreenRender(Comp);
    env().switchToMainThread();
    // The first screen paints one native list. Rows are not in the tree yet:
    // native materializes them by calling back into componentAtIndex.
    expect(doc.querySelectorAll('list').length).toBe(1);

    bgHydrate(Comp);
    await waitForUpdate();

    env().switchToMainThread();
    // Hydration skipped the identical structural frame — still one list, and
    // the background's post-hydration append landed in the *live* registry the
    // callbacks read.
    expect(getIfrPhase()).toBe('hydrated');
    const lists = doc.querySelectorAll('list');
    expect(lists.length).toBe(1);
    const listEl = lists[0]! as Element & {
      componentAtIndex(
        list: Element,
        listID: number,
        cellIndex: number,
        operationID: number,
      ): number | undefined;
    };
    expect(getListItemBgIdsForTest(bgIdOf(listEl)).length).toBe(4);

    // Native materializes a row that never existed during the IFR render.
    const sign = listEl.componentAtIndex(listEl, 0, 3, 1);
    expect(sign).toBeTypeOf('number');
    const materialized = listEl.lastElementChild!;
    expect(materialized.tagName.toLowerCase()).toBe('list-item');
    expect(materialized.textContent).toBe('d');
  });

  it('does not route background inserts into an abandoned list after fallback', () => {
    // Main thread renders id 2 as a <list>; the background render diverges and
    // uses id 2 for a plain <view> with a child. If the abandoned list's
    // registries survived teardown, the child insert would be swallowed by
    // `insertListItem` and never reach the element tree.
    const doc = mtRecordBatches([
      [
        OP.CREATE, 2, 'list',
        OP.INSERT, PAGE_ROOT_ID, 2, -1,
        OP.CREATE, 3, 'list-item',
        OP.SET_PROP, 3, 'item-key', 'a',
        OP.INSERT, 2, 3, -1,
      ],
    ]);
    expect(doc.querySelectorAll('list').length).toBe(1);

    bgBatch([
      OP.CREATE, 2, 'view',
      OP.INSERT, PAGE_ROOT_ID, 2, -1,
      OP.CREATE, 3, 'text',
      OP.INSERT, 2, 3, -1,
      OP.SET_TEXT, 3, 'bg',
    ]);

    expect(getIfrPhase()).toBe('hydrated');
    expect(doc.querySelectorAll('list').length).toBe(0);
    const view = doc.querySelector('view')!;
    expect(view.children.length).toBe(1);
    expect(view.textContent).toBe('bg');
  });

  it('replays earlier background batches when a later batch mismatches', () => {
    // Batch 1 matches and is skipped; batch 2 diverges. The list described by
    // batch 1 was only ever painted by the main-thread render, so teardown
    // removes it — the fallback has to replay batch 1 to put it back.
    const doc = mtRecordBatches([
      [
        OP.CREATE, 2, 'list',
        OP.INSERT, PAGE_ROOT_ID, 2, -1,
        OP.CREATE, 3, 'list-item',
        OP.SET_PROP, 3, 'item-key', 'a',
        OP.INSERT, 2, 3, -1,
      ],
      [
        OP.CREATE, 4, 'text',
        OP.INSERT, PAGE_ROOT_ID, 4, -1,
        OP.SET_TEXT, 4, 'main-thread',
      ],
    ]);

    bgBatch([
      OP.CREATE, 2, 'list',
      OP.INSERT, PAGE_ROOT_ID, 2, -1,
      OP.CREATE, 3, 'list-item',
      OP.SET_PROP, 3, 'item-key', 'a',
      OP.INSERT, 2, 3, -1,
    ]);
    expect(getIfrPhase()).toBe('rendered'); // skipped, one batch left

    bgBatch([
      OP.CREATE, 4, 'image',
      OP.INSERT, PAGE_ROOT_ID, 4, -1,
      OP.SET_PROP, 4, 'src', 'x.png',
    ]);

    expect(getIfrPhase()).toBe('hydrated');
    // The list from the replayed batch survives, exactly once, with its row.
    const lists = doc.querySelectorAll('list');
    expect(lists.length).toBe(1);
    expect(getListItemBgIdsForTest(bgIdOf(lists[0]!))).toEqual([3]);
    expect(doc.querySelectorAll('image').length).toBe(1);
    expect(doc.querySelectorAll('text').length).toBe(0);
  });
});
