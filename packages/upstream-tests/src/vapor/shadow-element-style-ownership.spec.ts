import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resetForTesting } from 'vue-lynx';
import {
  ShadowElement,
  setPendingVaporAddressing,
} from '../../../vue-lynx/runtime/src/shadow-element.js';
import { nodeOps } from '../../../vue-lynx/runtime/src/node-ops.js';

function inert(tag = 'view'): ShadowElement {
  const element = new ShadowElement(tag);
  element._inert = true;
  return element;
}

function clonePair(sparse: boolean, styled = false): {
  prototype: ShadowElement;
  first: ShadowElement;
  second: ShadowElement;
} {
  const prototype = inert();
  const child = inert();
  prototype._link(child, null);
  if (styled) {
    prototype._style = { color: 'red' };
    child._style = { height: '10px' };
  }

  (globalThis as Record<string, unknown>)['__VUE_LYNX_SPARSE_NAMING__'] = sparse;
  const addressing = sparse
    ? {
      holes: [1],
      addressed: [0, 1],
      slotCount: 2,
      tags: ['view', 'view'],
    }
    : undefined;

  setPendingVaporAddressing(addressing);
  const first = prototype.cloneNode(true);
  setPendingVaporAddressing(addressing);
  const second = prototype.cloneNode(true);
  setPendingVaporAddressing(undefined);
  return { prototype, first, second };
}

beforeEach(() => {
  resetForTesting();
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>)['__VUE_LYNX_SPARSE_NAMING__'];
  resetForTesting();
});

describe('ShadowElement style ownership', () => {
  it('shares only the unobserved empty state and detaches on direct _style access', () => {
    const first = new ShadowElement('view');
    const second = new ShadowElement('view');
    const shared = first._getStyle();

    expect(shared).toBe(second._getStyle());
    expect(Object.isFrozen(shared)).toBe(true);

    const firstStyle = first._style;
    firstStyle.color = 'red';

    expect(firstStyle).toBe(first._getStyle());
    expect(first._getStyle()).toEqual({ color: 'red' });
    expect(second._getStyle()).toBe(shared);
    expect(second._getStyle()).toEqual({});
  });

  it('preserves direct _style assignment and isolates every facade mutation form', () => {
    const first = inert();
    const second = inert();
    const assigned: Record<string, unknown> = { color: 'red' };

    first._style = assigned;
    expect(first._style).toBe(assigned);

    first.style.backgroundColor = 'blue';
    (first.style.setProperty as (name: string, value: unknown) => void)(
      '--tone',
      'warm',
    );
    expect(first._style).toBe(assigned);
    expect(first._style).toEqual({
      color: 'red',
      backgroundColor: 'blue',
      '--tone': 'warm',
    });

    (first.style.removeProperty as (name: string) => string)('color');
    expect(first._style).toBe(assigned);
    expect(first._style.color).toBeUndefined();

    first.style.cssText = 'height: 12px';
    expect(first._style).not.toBe(assigned);
    expect(first._style).toEqual({ height: '12px' });
    expect(second._getStyle()).toEqual({});
  });

  it('isolates set/removeAttribute and vdom patchProp replacement state', () => {
    const first = inert();
    const second = inert();

    first.setAttribute('style', 'color:red');
    const fromAttribute = first._style;
    first.removeAttribute('style');

    expect(fromAttribute).toEqual({ color: 'red' });
    expect(first._style).not.toBe(fromAttribute);
    expect(first._style).toEqual({});
    expect(second._getStyle()).toEqual({});

    nodeOps.patchProp(first, 'style', null, { opacity: 0.5 });
    expect(first._style).toEqual({ opacity: 0.5 });
    expect(second._getStyle()).toEqual({});
  });

  it.each([false, true])(
    'keeps empty %s clone siblings and their inert prototype isolated',
    (sparse) => {
      const { prototype, first, second } = clonePair(sparse);
      const shared = prototype._getStyle();

      expect(first._getStyle()).toBe(shared);
      expect(second._getStyle()).toBe(shared);
      expect(first.firstChild!._getStyle()).toBe(shared);
      expect(second.firstChild!._getStyle()).toBe(shared);

      first.style.color = 'blue';
      first.firstChild!._style.height = '20px';

      expect(first._style).toEqual({ color: 'blue' });
      expect(first.firstChild!._style).toEqual({ height: '20px' });
      expect(second._getStyle()).toBe(shared);
      expect(second.firstChild!._getStyle()).toBe(shared);
      expect(prototype._getStyle()).toBe(shared);
      expect(prototype.firstChild!._getStyle()).toBe(shared);
    },
  );

  it.each([false, true])(
    'copies non-empty %s clone styles without aliasing',
    (sparse) => {
      const { prototype, first, second } = clonePair(sparse, true);
      const prototypeStyle = prototype._style;
      const firstStyle = first._style;
      const secondStyle = second._style;

      expect(firstStyle).not.toBe(prototypeStyle);
      expect(secondStyle).not.toBe(prototypeStyle);
      expect(firstStyle).not.toBe(secondStyle);

      firstStyle.color = 'blue';
      first.firstChild!._style.height = '20px';

      expect(prototype._style).toEqual({ color: 'red' });
      expect(prototype.firstChild!._style).toEqual({ height: '10px' });
      expect(second._style).toEqual({ color: 'red' });
      expect(second.firstChild!._style).toEqual({ height: '10px' });
    },
  );
});
