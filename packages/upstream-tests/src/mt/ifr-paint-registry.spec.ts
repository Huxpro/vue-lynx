/**
 * IFR paint registry: CLONE skip-if-exists + sparse densify on commit.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { OP } from 'vue-lynx/internal/ops';
import {
  applyOps,
  beginIfrSelectorAttributeDeferral,
  commitIfrSelectorAttributes,
  elements,
  registerIfrPaintHandles,
  resetMainThreadState,
} from '../../../vue-lynx/main-thread/src/ops-apply.js';

let nextId = 400000;
let ROOT = 0;

beforeEach(() => {
  resetMainThreadState();
  ROOT = nextId++;
  applyOps([OP.CREATE, ROOT, 'view']);
});

describe('IFR paint registry / CLONE adopt', () => {
  it('skips CLONE_TREE when the base uid is already painted', () => {
    const tplId = nextId++;
    const base = nextId;
    nextId += 2;

    const structure = ['view', { c: 'row' }, [['text', { t: 'a' }, []]]];

    applyOps([
      OP.REGISTER_TREE, tplId, structure,
      OP.CLONE_TREE, tplId, base,
    ]);
    const firstRoot = elements.get(base);
    const firstText = elements.get(base + 1);
    expect(firstRoot).toBeTruthy();
    expect(firstText).toBeTruthy();

    // Second CLONE at the same base must be a no-op (no duplicate natives).
    applyOps([OP.CLONE_TREE, tplId, base]);
    expect(elements.get(base)).toBe(firstRoot);
    expect(elements.get(base + 1)).toBe(firstText);
  });

  it('densifies a sparse IFR paint on selector commit', () => {
    beginIfrSelectorAttributeDeferral();
    const base = nextId;
    nextId += 3;

    // Real natives (PAPI) so commit can install vue-ref-* selectors.
    applyOps([
      OP.CREATE, base, 'view',
      OP.CREATE, base + 1, 'view',
      OP.CREATE, base + 2, 'text',
    ], false);
    const root = elements.get(base)!;
    const mid = elements.get(base + 1)!;
    const leaf = elements.get(base + 2)!;

    // Simulate sparse paint: drop interior names; retain full stack.
    elements.delete(base + 1);
    elements.delete(base + 2);
    registerIfrPaintHandles(base, [root, mid, leaf]);

    expect(elements.has(base + 1)).toBe(false);
    expect(elements.has(base + 2)).toBe(false);

    commitIfrSelectorAttributes();

    expect(elements.get(base + 1)).toBe(mid);
    expect(elements.get(base + 2)).toBe(leaf);
  });

  it('IFR CLONE_TREE names only root + holes; commit densifies interiors', () => {
    // Preorder: 0 view.card, 1 text.title (hole), 2 view.badge (static), 3 text (hole)
    const structure = [
      'view',
      { c: 'card' },
      [
        ['text', { c: 'title', t: ' ' }, []],
        [
          'view',
          { c: 'badge' },
          [['text', { t: ' ' }, []]],
        ],
      ],
    ];
    const tplId = nextId++;
    const base = nextId;
    nextId += 4;

    beginIfrSelectorAttributeDeferral();
    applyOps([
      OP.REGISTER_TREE, tplId, structure,
      OP.CLONE_TREE, tplId, base,
    ], false);

    // Sparse: root + holes named; static badge (slot 2) not yet in the map.
    expect(elements.has(base)).toBe(true);
    expect(elements.has(base + 1)).toBe(true);
    expect(elements.has(base + 2)).toBe(false);
    expect(elements.has(base + 3)).toBe(true);

    const root = elements.get(base);
    const title = elements.get(base + 1);
    const badgeLabel = elements.get(base + 3);

    commitIfrSelectorAttributes();

    expect(elements.get(base)).toBe(root);
    expect(elements.get(base + 1)).toBe(title);
    expect(elements.get(base + 2)).toBeTruthy(); // densified static interior
    expect(elements.get(base + 3)).toBe(badgeLabel);

    // BG dense CLONE_TREE at the same base adopts — no duplicate natives.
    applyOps([OP.CLONE_TREE, tplId, base], false);
    expect(elements.get(base)).toBe(root);
    expect(elements.get(base + 1)).toBe(title);
  });
});
