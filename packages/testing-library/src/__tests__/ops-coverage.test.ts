/**
 * Additional ops coverage tests — exercises OP codes not covered by other
 * test files: SET_ID, SET_WORKLET_EVENT, SET_MT_REF, INIT_MT_REF, and
 * native <list> element creation/insertion.
 *
 * These tests go through the full dual-thread pipeline:
 * Vue component → ShadowElement → ops → applyOps → PAPI → JSDOM
 */

import { describe, it, expect } from 'vitest';
import {
  h,
  defineComponent,
  ref,
  nextTick,
  useMainThreadRef,
  ShadowElement,
} from 'vue-lynx';
import { render } from '../index.js';

// ---------------------------------------------------------------------------
// SET_ID
// ---------------------------------------------------------------------------

describe('SET_ID', () => {
  it('sets element id attribute', () => {
    const Comp = defineComponent({
      render() {
        return h('view', { id: 'my-view' });
      },
    });

    const { container } = render(Comp);
    const el = container.querySelector('#my-view');
    expect(el).not.toBeNull();
    expect(el!.tagName.toLowerCase()).toBe('view');
  });

  it('updates id reactively', async () => {
    const viewId = ref('first');

    const Comp = defineComponent({
      setup() {
        return () => h('view', { id: viewId.value });
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('#first')).not.toBeNull();

    viewId.value = 'second';
    await nextTick();
    await nextTick();

    expect(container.querySelector('#first')).toBeNull();
    expect(container.querySelector('#second')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Native <list> element (CREATE list + INSERT list-item + SET_PROP platform info)
// ---------------------------------------------------------------------------

describe('native list element', () => {
  it('creates a list element with list-item children', () => {
    const Comp = defineComponent({
      render() {
        return h('list', null, [
          h('list-item', { key: 'a', 'item-key': 'key-a' }, [
            h('text', null, 'Item A'),
          ]),
          h('list-item', { key: 'b', 'item-key': 'key-b' }, [
            h('text', null, 'Item B'),
          ]),
        ]);
      },
    });

    const { container } = render(Comp);
    const listEl = container.querySelector('list');
    expect(listEl).not.toBeNull();
    // Native list uses componentAtIndex callbacks rather than direct append,
    // but the list element itself should exist.
  });

  it('creates list with platform info attributes', () => {
    const Comp = defineComponent({
      render() {
        return h('list', null, [
          h('list-item', {
            key: '1',
            'item-key': 'item-1',
            'estimated-main-axis-size-px': 100,
            'reuse-identifier': 'type-a',
          }, [
            h('text', null, 'Content'),
          ]),
        ]);
      },
    });

    const { container } = render(Comp);
    // The list element should be created successfully without errors
    const listEl = container.querySelector('list');
    expect(listEl).not.toBeNull();
  });

  it('adds items to list reactively', async () => {
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
              ])
            ),
          );
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('list')).not.toBeNull();

    // Add more items
    items.value = ['A', 'B', 'C'];
    await nextTick();
    await nextTick();

    // List element should still exist after update
    expect(container.querySelector('list')).not.toBeNull();
  });

  it('append-only flush reports new insertActions with growing positions', async () => {
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
    const listEl = container.querySelector('list')!;
    expect(latestListInfo(listEl)?.insertAction.map((a) => a['item-key']))
      .toEqual(['A']);

    items.value = ['A', 'B', 'C'];
    await nextTick();
    await nextTick();

    const info = latestListInfo(listEl)!;
    expect(info.removeAction).toEqual([]);
    expect(info.updateAction).toEqual([]);
    expect(info.insertAction.map((a) => [a.position, a['item-key']])).toEqual([
      [1, 'B'],
      [2, 'C'],
    ]);
  });
});

// ---------------------------------------------------------------------------
// Native <list> mutations — prepend / reorder / remove / updateAction
// Mirrors examples/scrolling ListPrepend | ListReorder | ListRemove | ListFilter
// ---------------------------------------------------------------------------

type ListInfo = {
  insertAction: Array<Record<string, unknown>>;
  removeAction: number[];
  updateAction: Array<Record<string, unknown>>;
};

function allListInfos(listEl: Element): ListInfo[] {
  const raw = listEl.getAttribute('update-list-info');
  return raw ? (JSON.parse(raw) as ListInfo[]) : [];
}

function latestListInfo(listEl: Element): ListInfo | undefined {
  const all = allListInfos(listEl);
  return all[all.length - 1];
}

function mountKeyedList(items: { value: string[] }) {
  return defineComponent({
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
}

describe('native list element · mutations', () => {
  it('prepend emits insertAction at position 0 (not a tail push)', async () => {
    const items = ref(['A', 'B']);
    const { container } = render(mountKeyedList(items));
    const listEl = container.querySelector('list')!;
    const before = allListInfos(listEl).length;

    items.value = ['Z', 'A', 'B'];
    await nextTick();
    await nextTick();

    const infos = allListInfos(listEl).slice(before);
    expect(infos.length).toBeGreaterThan(0);
    const info = infos[infos.length - 1]!;
    expect(info.insertAction).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          position: 0,
          'item-key': 'Z',
          type: 'list-item',
        }),
      ]),
    );
    expect(
      info.insertAction.some(
        (a) => a['item-key'] === 'Z' && (a.position as number) >= 2,
      ),
    ).toBe(false);
  });

  it('reorder does not insert past the list length', async () => {
    const items = ref(['A', 'B', 'C']);
    const { container } = render(mountKeyedList(items));
    const listEl = container.querySelector('list')!;
    const before = allListInfos(listEl).length;

    items.value = ['C', 'B', 'A'];
    await nextTick();
    await nextTick();

    const infos = allListInfos(listEl).slice(before);
    for (const info of infos) {
      for (const action of info.insertAction) {
        expect(action.position).toBeLessThan(3);
      }
    }
  });

  it('remove middle emits removeAction', async () => {
    const items = ref(['A', 'B', 'C']);
    const { container } = render(mountKeyedList(items));
    const listEl = container.querySelector('list')!;
    const before = allListInfos(listEl).length;

    items.value = ['A', 'C'];
    await nextTick();
    await nextTick();

    const infos = allListInfos(listEl).slice(before);
    expect(infos.length).toBeGreaterThan(0);
    const info = infos[infos.length - 1]!;
    expect(info.removeAction).toEqual([1]);
    expect(info.insertAction).toEqual([]);
  });

  it('remove then restore same keys does not duplicate item-keys', async () => {
    const items = ref(['A', 'B', 'C', 'D']);
    const { container } = render(mountKeyedList(items));
    const listEl = container.querySelector('list')!;

    items.value = ['A'];
    await nextTick();
    await nextTick();
    items.value = ['A', 'B', 'C', 'D'];
    await nextTick();
    await nextTick();

    const keys = allListInfos(listEl).flatMap((info) =>
      info.insertAction.map((a) => String(a['item-key'])),
    );
    const counts = keys.reduce<Record<string, number>>((acc, k) => {
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts['A']).toBe(1);
    expect(counts['B']).toBe(2);
    expect(counts['C']).toBe(2);
    expect(counts['D']).toBe(2);
    expect(
      allListInfos(listEl).some((info) => info.removeAction.length > 0),
    ).toBe(true);
  });

  it('filter-out then restore does not leave stale duplicate inserts', async () => {
    const items = ref(['A', 'B', 'C', 'D']);
    const { container } = render(mountKeyedList(items));

    items.value = ['B', 'D'];
    await nextTick();
    await nextTick();
    items.value = ['A', 'B', 'C', 'D'];
    await nextTick();
    await nextTick();

    expect(container.querySelector('list')).not.toBeNull();
    const keys = allListInfos(container.querySelector('list')!).flatMap(
      (info) => info.insertAction.map((a) => String(a['item-key'])),
    );
    const counts = keys.reduce<Record<string, number>>((acc, k) => {
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts['A']).toBe(2);
    expect(counts['B']).toBe(1);
    expect(counts['C']).toBe(2);
    expect(counts['D']).toBe(1);
  });

  it('updating platform info on an existing item emits updateAction', async () => {
    const size = ref(100);
    const Comp = defineComponent({
      setup() {
        return () =>
          h('list', null, [
            h(
              'list-item',
              {
                key: 'A',
                'item-key': 'A',
                'estimated-main-axis-size-px': size.value,
              },
              [h('text', null, 'A')],
            ),
          ]);
      },
    });

    const { container } = render(Comp);
    const listEl = container.querySelector('list')!;
    const before = allListInfos(listEl).length;

    size.value = 160;
    await nextTick();
    await nextTick();

    const infos = allListInfos(listEl).slice(before);
    expect(infos.length).toBeGreaterThan(0);
    const info = infos[infos.length - 1]!;
    expect(info.updateAction.length).toBeGreaterThan(0);
    expect(info.updateAction[0]).toEqual(
      expect.objectContaining({
        from: 0,
        to: 0,
        'estimated-main-axis-size-px': 160,
        'item-key': 'A',
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// INIT_MT_REF (value-only MainThreadRef)
// ---------------------------------------------------------------------------

describe('INIT_MT_REF', () => {
  it('creates a value-only MainThreadRef without errors', () => {
    const Comp = defineComponent({
      setup() {
        // useMainThreadRef pushes INIT_MT_REF op during construction
        const counter = useMainThreadRef(42);
        return () => h('text', null, `ref wvid=${counter._wvid}`);
      },
    });

    const { container } = render(Comp);
    const textEl = container.querySelector('text');
    expect(textEl).not.toBeNull();
    // The ref was created and the op was processed without error
    expect(textEl!.textContent).toMatch(/ref wvid=\d+/);
  });
});

// ---------------------------------------------------------------------------
// SET_MT_REF (element-bound MainThreadRef)
// ---------------------------------------------------------------------------

describe('SET_MT_REF', () => {
  it('binds a MainThreadRef to an element via main-thread-ref prop', () => {
    const Comp = defineComponent({
      setup() {
        const elRef = useMainThreadRef(null);
        return () =>
          h('view', { 'main-thread-ref': elRef }, [
            h('text', null, 'bound'),
          ]);
      },
    });

    const { container } = render(Comp);
    // The component renders without errors, meaning SET_MT_REF was processed
    expect(container.querySelector('view')).not.toBeNull();
    expect(container.querySelector('text')!.textContent).toBe('bound');
  });
});

// ---------------------------------------------------------------------------
// SET_WORKLET_EVENT
// ---------------------------------------------------------------------------

describe('SET_WORKLET_EVENT', () => {
  it('sets a worklet event handler via main-thread-bindtap', () => {
    const Comp = defineComponent({
      setup() {
        // Worklet event handler — in real Lynx this runs on the Main Thread.
        // The handler value is serialized as a worklet context object.
        const handler = { _wkltId: 1, _closure: {} };
        return () =>
          h('view', { 'main-thread-bindtap': handler }, [
            h('text', null, 'worklet'),
          ]);
      },
    });

    const { container } = render(Comp);
    // The component renders without errors, meaning SET_WORKLET_EVENT was processed
    expect(container.querySelector('view')).not.toBeNull();
    expect(container.querySelector('text')!.textContent).toBe('worklet');
  });

  it('removes worklet handler when main-thread-bindtap becomes null (repro)', async () => {
    const enabled = ref(true);
    const workletCtx = { _wkltId: 'wklt-repro', _closure: {} };

    const Comp = defineComponent({
      setup() {
        return () =>
          h('view', {
            'main-thread-bindtap': enabled.value ? workletCtx : null,
          }, [
            h('text', null, 'worklet-unbind'),
          ]);
      },
    });

    const { container } = render(Comp);
    const env = (globalThis as any).lynxTestingEnv;

    env.switchToMainThread();
    const viewEl = container.querySelector('view') as any;
    expect(viewEl).not.toBeNull();
    expect(viewEl.eventMap?.['bindEvent:tap']).toBeTypeOf('function');

    env.switchToBackgroundThread();
    enabled.value = false;
    await nextTick();
    await nextTick();

    env.switchToMainThread();
    // Expected: listener should be removed after unbinding.
    // Current behavior: listener is still present because no unbind op is sent.
    expect(viewEl.eventMap?.['bindEvent:tap']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Template Ref → NodesRef (vue-ref-{id} attribute + ShadowElement methods)
// ---------------------------------------------------------------------------

describe('template ref / NodesRef', () => {
  it('sets vue-ref-{id} attribute on MT elements', () => {
    const Comp = defineComponent({
      render() {
        return h('view', null, [h('text', null, 'hello')]);
      },
    });

    const { container } = render(Comp);
    // Every non-comment element should have a vue-ref-{id} attribute
    const view = container.querySelector('view');
    expect(view).not.toBeNull();
    // The view element's id is 2 (first element after page root id=1)
    expect(view!.hasAttribute('vue-ref-2')).toBe(true);
  });

  it('ShadowElement has NodesRef methods', () => {
    const el = new ShadowElement('view');
    expect(typeof el.invoke).toBe('function');
    expect(typeof el.setNativeProps).toBe('function');
    expect(typeof el.fields).toBe('function');
    expect(typeof el.path).toBe('function');
    expect(typeof el.animate).toBe('function');
    expect(typeof el.playAnimation).toBe('function');
    expect(typeof el.pauseAnimation).toBe('function');
    expect(typeof el.cancelAnimation).toBe('function');
  });

  it('ShadowElement._selector returns correct attribute selector', () => {
    const el = new ShadowElement('view', 42);
    expect(el._selector).toBe('[vue-ref-42]');
  });
});
