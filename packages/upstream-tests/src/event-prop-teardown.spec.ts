import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ShadowElement,
  Teleport,
  _render,
  createPageRoot,
  h,
  nextTick,
  nodeOps,
  ref,
  resetForTesting,
  takeOps,
} from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import { getOnceWrapperCountForTesting } from '../../vue-lynx/runtime/src/event-props.js';
import {
  getEventRegistrySizeForTesting,
  publishEvent,
} from '../../vue-lynx/runtime/src/event-registry.js';
import { getRemovedRootCountForTesting } from '../../vue-lynx/runtime/src/tree-ops.js';
import { decodeOps, opsOf } from './vapor/ops-test-utils.js';

type Handler = (data: unknown) => void;
type Bind = (el: ShadowElement, key: string, value: Handler | null) => void;
type Insert = (child: ShadowElement, parent: ShadowElement) => void;
type Remove = (el: ShadowElement) => void;
type Clear = (el: ShadowElement) => void;

const paths: ReadonlyArray<readonly [string, Bind, Insert, Remove, Clear]> = [
  [
    'VDOM-compatible',
    (el, key, value) => nodeOps.patchProp(el, key, null, value),
    (child, parent) => nodeOps.insert(child, parent),
    (el) => nodeOps.remove(el),
    (el) => nodeOps.setElementText(el, ''),
  ],
  [
    'Vapor runtime',
    (el, key, value) =>
      value ? el.setAttribute(key, value) : el.removeAttribute(key),
    (child, parent) => parent.appendChild(child),
    (el) => el.remove(),
    (el) => {
      el.textContent = '';
    },
  ],
];

function bindSign(
  bind: Bind,
  el: ShadowElement,
  key: string,
  name: string,
  handler: Handler,
): string {
  bind(el, key, handler);
  const event = opsOf(decodeOps(takeOps()), OP.SET_EVENT).find(
    ({ args }) => args[0] === el.uid && args[2] === name,
  );
  expect(event).toBeDefined();
  return event!.args[3] as string;
}

function globalCounts(): [number, number, number] {
  return [
    getEventRegistrySizeForTesting(),
    getOnceWrapperCountForTesting(),
    getRemovedRootCountForTesting(),
  ];
}

beforeEach(() => {
  resetForTesting();
});

describe('event-prop subtree teardown', () => {
  it.each(paths)(
    'keeps nested %s signs across same-parent detach and reinsert',
    (_name, bind, insert, remove) => {
      const parent = new ShadowElement('view');
      const root = new ShadowElement('view');
      const child = new ShadowElement('view');
      const normal = vi.fn();
      const once = vi.fn();
      insert(root, parent);
      insert(child, root);
      const normalSign = bindSign(bind, root, 'bindtap', 'tap', normal);
      const onceSign = bindSign(bind, child, 'onTapOnce', 'tap', once);

      expect([root._eventPropSigns?.size, child._eventPropSigns?.size])
        .toEqual([1, 1]);
      remove(root);
      expect(globalCounts()).toEqual([2, 1, 1]);
      insert(root, parent);
      expect(globalCounts()).toEqual([2, 1, 0]);

      const moveOps = decodeOps(takeOps());
      expect(moveOps).toEqual([
        { op: OP.REMOVE, args: [parent.uid, root.uid] },
        { op: OP.INSERT, args: [parent.uid, root.uid, -1] },
      ]);
      publishEvent(normalSign, {});
      publishEvent(onceSign, {});
      expect([normal.mock.calls.length, once.mock.calls.length]).toEqual([1, 1]);
      expect(globalCounts()).toEqual([2, 1, 0]);

      remove(root);
      expect(globalCounts()).toEqual([2, 1, 1]);
      const removeOps = decodeOps(takeOps());
      expect(opsOf(removeOps, OP.REMOVE_EVENT)).toEqual([]);
      expect(globalCounts()).toEqual([0, 0, 0]);
      expect('_eventPropSigns' in root || '_eventPropSigns' in child).toBe(false);
      publishEvent(normalSign, {});
      publishEvent(onceSign, {});
      expect([normal.mock.calls.length, once.mock.calls.length]).toEqual([1, 1]);
    },
  );

  it.each(paths)(
    'keeps nested %s signs across detach and reinsert under a new parent',
    (_name, bind, insert, remove) => {
      const source = new ShadowElement('view');
      const target = new ShadowElement('view');
      const root = new ShadowElement('view');
      const child = new ShadowElement('view');
      const normal = vi.fn();
      const once = vi.fn();
      insert(root, source);
      insert(child, root);
      const normalSign = bindSign(bind, root, 'bindtap', 'tap', normal);
      const onceSign = bindSign(bind, child, 'onTapOnce', 'tap', once);

      remove(root);
      expect(globalCounts()).toEqual([2, 1, 1]);
      insert(root, target);
      expect(globalCounts()).toEqual([2, 1, 0]);

      const moveOps = decodeOps(takeOps());
      expect(moveOps).toEqual([
        { op: OP.REMOVE, args: [source.uid, root.uid] },
        { op: OP.INSERT, args: [target.uid, root.uid, -1] },
      ]);
      expect([root._eventPropSigns?.size, child._eventPropSigns?.size])
        .toEqual([1, 1]);

      publishEvent(normalSign, {});
      publishEvent(onceSign, {});
      expect([normal.mock.calls.length, once.mock.calls.length]).toEqual([1, 1]);
      expect(globalCounts()).toEqual([2, 1, 0]);

      remove(root);
      expect(globalCounts()).toEqual([2, 1, 1]);
      takeOps();
      expect(globalCounts()).toEqual([0, 0, 0]);
      publishEvent(normalSign, {});
      publishEvent(onceSign, {});
      expect([normal.mock.calls.length, once.mock.calls.length]).toEqual([1, 1]);
    },
  );

  it('keeps ids and addEventListener bindings across a same-batch move', () => {
    const source = new ShadowElement('view');
    const target = new ShadowElement('view');
    const root = new ShadowElement('view');
    const child = new ShadowElement('view');
    const listener = vi.fn();
    nodeOps.insert(root, source);
    nodeOps.insert(child, root);
    nodeOps.patchProp(child, 'id', null, 'move-target');
    child.addEventListener('tap', listener);

    const event = opsOf(decodeOps(takeOps()), OP.SET_EVENT).find(
      ({ args }) => args[0] === child.uid && args[2] === 'tap',
    );
    expect(event).toBeDefined();
    const sign = event!.args[3] as string;
    expect(nodeOps.querySelector('#move-target')).toBe(child);
    expect(globalCounts()).toEqual([1, 0, 0]);

    nodeOps.remove(root);
    nodeOps.insert(root, target);
    expect(nodeOps.querySelector('#move-target')).toBe(child);
    expect(globalCounts()).toEqual([1, 0, 0]);
    takeOps();
    publishEvent(sign, {});
    expect(listener).toHaveBeenCalledTimes(1);

    nodeOps.remove(root);
    expect(nodeOps.querySelector('#move-target')).toBeNull();
    expect(globalCounts()).toEqual([1, 0, 1]);
    takeOps();
    expect(nodeOps.querySelector('#move-target')).toBeNull();
    expect(globalCounts()).toEqual([0, 0, 0]);
    publishEvent(sign, {});
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not resolve a Teleport target removed earlier in the same patch', async () => {
    const showTarget = ref(true);
    const showTeleport = ref(false);
    const root = createPageRoot();
    const view = () =>
      h('view', [
        showTarget.value ? h('view', { id: 'target' }) : null,
        showTeleport.value
          ? h(Teleport, { to: '#target' }, h('text', 'teleported'))
          : null,
      ]);

    _render(view(), root);
    await nextTick();
    const target = nodeOps.querySelector('#target')!;
    expect(target).not.toBeNull();

    showTarget.value = false;
    showTeleport.value = true;
    _render(view(), root);

    expect(nodeOps.querySelector('#target')).toBeNull();
    expect(target.parent).toBeNull();
    expect(target.firstChild).toBeNull();
  });

  it.each(paths)(
    'releases nested %s signs after a terminal clear',
    (_name, bind, insert, _remove, clear) => {
      const parent = new ShadowElement('view');
      const root = new ShadowElement('view');
      const child = new ShadowElement('view');
      const normal = vi.fn();
      const once = vi.fn();
      insert(root, parent);
      insert(child, root);
      const normalSign = bindSign(bind, root, 'bindtap', 'tap', normal);
      const onceSign = bindSign(bind, child, 'onTapOnce', 'tap', once);

      clear(parent);
      expect(globalCounts()).toEqual([2, 1, 1]);
      const clearOps = decodeOps(takeOps());
      expect(opsOf(clearOps, OP.REMOVE_EVENT)).toEqual([]);
      expect(globalCounts()).toEqual([0, 0, 0]);
      expect('_eventPropSigns' in root || '_eventPropSigns' in child).toBe(false);

      publishEvent(normalSign, {});
      publishEvent(onceSign, {});
      expect([normal.mock.calls.length, once.mock.calls.length]).toEqual([0, 0]);
    },
  );

  it.each(paths)(
    'releases nested %s signs after a terminal remove',
    (_name, bind, insert, remove) => {
      const parent = new ShadowElement('view');
      const root = new ShadowElement('view');
      const child = new ShadowElement('view');
      const normal = vi.fn();
      const once = vi.fn();
      insert(root, parent);
      insert(child, root);
      const normalSign = bindSign(bind, root, 'bindtap', 'tap', normal);
      const onceSign = bindSign(bind, child, 'onTapOnce', 'tap', once);

      remove(root);
      expect(globalCounts()).toEqual([2, 1, 1]);
      const removeOps = decodeOps(takeOps());
      expect(removeOps).toEqual([
        { op: OP.REMOVE, args: [parent.uid, root.uid] },
      ]);
      expect(globalCounts()).toEqual([0, 0, 0]);
      expect('_eventPropSigns' in root || '_eventPropSigns' in child).toBe(false);

      publishEvent(normalSign, {});
      publishEvent(onceSign, {});
      expect([normal.mock.calls.length, once.mock.calls.length]).toEqual([0, 0]);
    },
  );

  it.each(paths)('clears the sparse %s owner after explicit unbind', (
    _name,
    bind,
    insert,
    remove,
  ) => {
    const parent = new ShadowElement('view');
    const el = new ShadowElement('view');
    insert(el, parent);
    const tap = bindSign(bind, el, 'bindtap', 'tap', vi.fn());
    const once = bindSign(bind, el, 'onLongpressOnce', 'longpress', vi.fn());
    expect([el._eventPropSigns?.size, ...globalCounts()])
      .toEqual([2, 2, 1, 0]);

    bind(el, 'bindtap', null);
    bind(el, 'onLongpressOnce', null);
    expect(opsOf(decodeOps(takeOps()), OP.REMOVE_EVENT)).toHaveLength(2);
    expect('_eventPropSigns' in el).toBe(false);
    expect(globalCounts()).toEqual([0, 0, 0]);
    publishEvent(tap, {});
    publishEvent(once, {});
    remove(el);
    remove(el);
    expect(opsOf(decodeOps(takeOps()), OP.REMOVE_EVENT)).toEqual([]);
  });

  it('keeps once called-state isolated across removed and new uids', () => {
    const parent = new ShadowElement('view');
    const calls = [vi.fn(), vi.fn()];
    const elements = [new ShadowElement('view'), new ShadowElement('view')];
    parent.appendChild(elements[0]!);
    const first = bindSign(
      paths[1]![1],
      elements[0]!,
      'onTapOnce',
      'tap',
      calls[0]!,
    );
    publishEvent(first, {});
    elements[0]!.remove();
    takeOps();
    publishEvent(first, {});

    parent.appendChild(elements[1]!);
    const second = bindSign(
      paths[1]![1],
      elements[1]!,
      'onTapOnce',
      'tap',
      calls[1]!,
    );
    publishEvent(second, {});
    publishEvent(second, {});
    expect([calls[0]!.mock.calls.length, calls[1]!.mock.calls.length])
      .toEqual([1, 1]);
    expect(second).not.toBe(first);
  });

  it('leaves nodes without event props on the empty local-field path', () => {
    const parent = new ShadowElement('view');
    const root = new ShadowElement('view');
    const child = new ShadowElement('text');
    parent.appendChild(root);
    root.appendChild(child);
    expect(Object.hasOwn(root, '_eventPropSigns')).toBe(false);
    expect(Object.hasOwn(child, '_eventPropSigns')).toBe(false);
    root.remove();
    expect(globalCounts()).toEqual([0, 0, 1]);
    takeOps();
    expect(globalCounts()).toEqual([0, 0, 0]);
  });

  it.each(paths)(
    'keeps deterministic %s registry accounting across move and clear cycles',
    (_name, bind, insert, remove, clear) => {
      const source = new ShadowElement('view');
      const target = new ShadowElement('view');
      const roots: ShadowElement[] = [];
      const eventOwners: ShadowElement[] = [];
      const staleSigns: string[] = [];
      const handlers: ReturnType<typeof vi.fn>[] = [];
      const rootCount = 40;

      for (let index = 0; index < rootCount; index++) {
        const root = new ShadowElement('view');
        const child = new ShadowElement('view');
        const normal = vi.fn();
        const once = vi.fn();
        insert(root, source);
        insert(child, root);
        staleSigns.push(
          bindSign(bind, root, 'bindtap', 'tap', normal),
          bindSign(bind, child, 'onTapOnce', 'tap', once),
        );
        roots.push(root);
        eventOwners.push(root, child);
        handlers.push(normal, once);
      }

      expect(globalCounts()).toEqual([rootCount * 2, rootCount, 0]);

      for (let round = 0; round < 25; round++) {
        for (let index = 0; index < roots.length; index++) {
          const root = roots[index]!;
          remove(root);
          insert(root, (index + round) % 2 === 0 ? source : target);
        }
        expect(globalCounts()).toEqual([rootCount * 2, rootCount, 0]);
        takeOps();
        expect(globalCounts()).toEqual([rootCount * 2, rootCount, 0]);
      }

      clear(source);
      clear(target);
      expect(globalCounts()).toEqual([rootCount * 2, rootCount, rootCount]);
      takeOps();
      expect(globalCounts()).toEqual([0, 0, 0]);
      expect(
        eventOwners.every(
          (owner) => !Object.hasOwn(owner, '_eventPropSigns'),
        ),
      ).toBe(true);

      for (const sign of staleSigns) publishEvent(sign, {});
      expect(handlers.every((handler) => handler.mock.calls.length === 0))
        .toBe(true);
    },
  );
});
