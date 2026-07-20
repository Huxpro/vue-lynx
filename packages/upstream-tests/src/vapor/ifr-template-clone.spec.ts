/**
 * IFR MT template clone fast paths: static root-only + lite shadow clone.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { IFR_MT_FLAG_GLOBAL, OP } from 'vue-lynx/internal/ops';
import { inferHoleSlots } from 'vue-lynx/internal/html-to-template-node';
import { resetForTesting, ShadowElement } from 'vue-lynx';
import { template } from 'vue-lynx/vapor';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';

describe('IFR template clone fast paths', () => {
  beforeEach(() => {
    resetForTesting();
    delete (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL];
    takeOps();
  });

  it('uses a root-only shadow for fully static templates on IFR MT', () => {
    (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL] = true;

    const t0 = template('<view class=card><text class=sub>hi', 1);
    // First call builds the inert proto (not IFR-sensitive).
    delete (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL];
    t0(); // warm proto + REGISTER on non-IFR so structure is cached… actually
    // each factory() clones; proto is shared. Clear ops from warm clone.
    takeOps();

    (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL] = true;
    const beforeUid = ShadowElement.nextUid;
    const root = t0();
    const ops = takeOps();

    // Root-only: a single ShadowElement for the view; children are MT-only
    // via CLONE_TREE. nextUid still reserved the full preorder block.
    expect(root.tag).toBe('view');
    expect(root.firstChild).toBeNull();
    expect(ShadowElement.nextUid).toBeGreaterThan(beforeUid + 1);

    const cloneIdx = ops.indexOf(OP.CLONE_TREE);
    expect(cloneIdx).toBeGreaterThanOrEqual(0);
  });

  it('builds a navigable lite tree when the template has holes', () => {
    (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL] = true;

    const t0 = template('<view class=card><text> ', 1);
    delete (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL];
    t0();
    takeOps();

    (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL] = true;
    const root = t0();
    takeOps();

    // Hole template must expose the text host for txt()/setText.
    expect(root.firstChild).not.toBeNull();
    expect(root.firstChild!.tag).toBe('text');
  });
});

describe('inferHoleSlots', () => {
  it('reports no holes for a fully static card', () => {
    // Mirrors REGISTER_TREE shape for <view class=card><text class=sub>hi
    const structure = [
      'view',
      { c: 'card' },
      [['text', { c: 'sub', t: 'hi' }, []]],
    ] as const;
    expect(inferHoleSlots(structure as never)).toEqual([]);
  });
});
