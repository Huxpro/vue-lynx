import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ShadowElement,
  nodeOps,
  resetForTesting,
  takeOps,
} from 'vue-lynx';
import { OP } from 'vue-lynx/internal/ops';
import { getOnceWrapperCountForTesting } from '../../vue-lynx/runtime/src/event-props.js';
import {
  getEventRegistrySizeForTesting,
  publishEvent,
} from '../../vue-lynx/runtime/src/event-registry.js';
import { decodeOps, opsOf } from './vapor/ops-test-utils.js';

type Handler = (data: unknown) => void;
type Bind = (el: ShadowElement, key: string, value: Handler | null) => void;
type Insert = (child: ShadowElement, parent: ShadowElement) => void;
type Remove = (el: ShadowElement) => void;

const paths: ReadonlyArray<readonly [string, Bind, Insert, Remove]> = [
  [
    'VDOM',
    (el, key, value) => nodeOps.patchProp(el, key, null, value),
    (child, parent) => nodeOps.insert(child, parent),
    (el) => nodeOps.remove(el),
  ],
  [
    'Vapor',
    (el, key, value) =>
      value ? el.setAttribute(key, value) : el.removeAttribute(key),
    (child, parent) => parent.appendChild(child),
    (el) => el.remove(),
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

function globalCounts(): [number, number] {
  return [
    getEventRegistrySizeForTesting(),
    getOnceWrapperCountForTesting(),
  ];
}

beforeEach(() => {
  resetForTesting();
});

describe('event-prop subtree teardown', () => {
  it.each(paths)(
    'releases nested %s normal/once signs without REMOVE_EVENT frames',
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
      expect(opsOf(decodeOps(takeOps()), OP.REMOVE_EVENT)).toEqual([]);
      publishEvent(normalSign, {});
      publishEvent(onceSign, {});
      expect([normal.mock.calls.length, once.mock.calls.length]).toEqual([0, 0]);
      expect(globalCounts()).toEqual([0, 0]);
      expect('_eventPropSigns' in root || '_eventPropSigns' in child).toBe(false);
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
    expect([el._eventPropSigns?.size, ...globalCounts()]).toEqual([2, 2, 1]);

    bind(el, 'bindtap', null);
    bind(el, 'onLongpressOnce', null);
    expect(opsOf(decodeOps(takeOps()), OP.REMOVE_EVENT)).toHaveLength(2);
    expect('_eventPropSigns' in el).toBe(false);
    expect(globalCounts()).toEqual([0, 0]);
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
      paths[1]![1], elements[0]!, 'onTapOnce', 'tap', calls[0]!,
    );
    publishEvent(first, {});
    elements[0]!.remove();
    takeOps();
    publishEvent(first, {});

    parent.appendChild(elements[1]!);
    const second = bindSign(
      paths[1]![1], elements[1]!, 'onTapOnce', 'tap', calls[1]!,
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
    expect(globalCounts()).toEqual([0, 0]);
  });
});
