/**
 * IFR MT template clone fast paths: static root-only + sparse nav facades.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { IFR_MT_FLAG_GLOBAL, OP } from 'vue-lynx/internal/ops';
import {
  computeIfrNavSlots,
  inferHoleSlots,
} from 'vue-lynx/internal/html-to-template-node';
import { resetForTesting, ShadowElement } from 'vue-lynx';
import { template } from 'vue-lynx/vapor';
import { takeOps } from '../../../vue-lynx/runtime/src/ops.js';

function countShadowNodes(root: ShadowElement): number {
  let n = 0;
  const walk = (el: ShadowElement): void => {
    n++;
    let child = el.firstChild;
    while (child) {
      walk(child);
      child = child.next;
    }
  };
  walk(root);
  return n;
}

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

  it('builds a navigable sparse facade when the template has holes', () => {
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

  it('skips ShadowElements inside static subtrees off the hole nav path', () => {
    // static branch first, then a hole — vapor does child() then next().
    const t0 = template(
      '<view><view class=static><text class=a>hi</text><text class=b>yo</text></view><text> ',
      1,
    );
    delete (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL];
    t0();
    takeOps();

    (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL] = true;
    const root = t0();
    takeOps();

    // Sparse: root, static stub (no deep children), hole text (+ aliased #text).
    // Must NOT clone text.a / text.b under static.
    const staticBranch = root.firstChild;
    expect(staticBranch).not.toBeNull();
    expect(staticBranch!.tag).toBe('view');
    expect(staticBranch!.firstChild).toBeNull();

    const hole = staticBranch!.next;
    expect(hole).not.toBeNull();
    expect(hole!.tag).toBe('text');

    // root + static stub + hole host + aliased text = 4 (not the full static tree)
    expect(countShadowNodes(root)).toBe(4);
  });
});

describe('inferHoleSlots / computeIfrNavSlots', () => {
  it('reports no holes for a fully static card', () => {
    // Mirrors REGISTER_TREE shape for <view class=card><text class=sub>hi
    const structure = [
      'view',
      { c: 'card' },
      [['text', { c: 'sub', t: 'hi' }, []]],
    ] as const;
    expect(inferHoleSlots(structure as never)).toEqual([]);
  });

  it('keeps prefix siblings for next() without their static interiors', () => {
    // 0 view, 1 view.static, 2 text.a, 3 text.b, 4 text hole
    const structure = [
      'view',
      0,
      [
        [
          'view',
          { c: 'static' },
          [
            ['text', { c: 'a', t: 'hi' }, []],
            ['text', { c: 'b', t: 'yo' }, []],
          ],
        ],
        ['text', 0, []],
      ],
    ] as const;
    const holes = inferHoleSlots(structure as never);
    expect(holes).toEqual([4]);
    const needed = computeIfrNavSlots(structure as never, holes);
    expect([...needed].sort((a, b) => a - b)).toEqual([0, 1, 4]);
  });
});
