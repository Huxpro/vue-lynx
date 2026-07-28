/**
 * code-paint ephemeral IFR paint (#340) — runtime path.
 *
 * `ifrPaint: 'code-paint'` (legacy `disposable-et`) keeps the durable Vapor
 * tree on the Data-Template interpreter but paints the throwaway IFR
 * first-frame copy through a compiled Code-Template `create()` executor. The
 * whole point is that this runs on Lynx for Web (measurable), unlike the
 * engine rung.
 *
 * These tests drive `applyOps` directly with REGISTER_TREE / CLONE_TREE (the
 * same ops the Vapor renderer emits for the ephemeral clone) under two
 * conditions — the paint flag on (IFR MT window) vs off (durable path) — and
 * assert the painted native tree and the MT element registry are byte-for-byte
 * what the Data-Template interpreter produces. Parity is what lets BG
 * hydration adopt/replay the ephemeral copy unchanged.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { OP, type TemplateNode } from 'vue-lynx/internal/ops';
import {
  applyOps,
  elements,
  resetMainThreadState,
} from '../../../vue-lynx/main-thread/src/ops-apply.js';
import { getCodeTemplateStatus } from '../../../vue-lynx/main-thread/src/code-template.js';

const g = globalThis as unknown as Record<string, unknown>;

// A card subtree with a nested row, a static text hole, an anonymous image,
// and a BG-only comment anchor — enough to exercise materializability,
// nesting, and (for sparse) anonymous skeleton nodes.
const STRUCTURE: TemplateNode = [
  'view',
  { c: 'card' },
  [
    ['text', { c: 'label', t: 'hello' }, []],
    [
      'view',
      { c: 'row' },
      [
        ['image', { a: [['src', 'x.png']] }, []],
        ['#comment', 0, []],
        ['text', { c: 'tail', t: 'tail' }, []],
      ],
    ],
  ],
];

interface SerializedNode {
  tag: string;
  attrs: Record<string, string>;
  children: SerializedNode[];
}

/** Attribute-order-insensitive structural snapshot of a native subtree. */
function serialize(el: Element | undefined): SerializedNode | null {
  if (!el) return null;
  const attrs: Record<string, string> = {};
  for (const a of Array.from(el.attributes)) attrs[a.name] = a.value;
  return {
    tag: el.tagName.toLowerCase(),
    attrs,
    children: Array.from(el.children).map((c) => serialize(c)!),
  };
}

function runClone(
  addressed: number[] | 0,
  base: number,
  codePaint: boolean,
): { tree: SerializedNode | null; keys: number[]; status: string } {
  resetMainThreadState();
  if (codePaint) {
    g['__VUE_LYNX_IFR_PAINT__'] = 'code-paint';
    g['__VUE_LYNX_IFR_MT__'] = true;
  } else {
    delete g['__VUE_LYNX_IFR_PAINT__'];
    delete g['__VUE_LYNX_IFR_MT__'];
  }
  applyOps([
    OP.REGISTER_TREE, 1, STRUCTURE, addressed,
    OP.CLONE_TREE, 1, base,
  ]);
  const root = elements.get(base) as unknown as Element | undefined;
  const keys = [...elements.keys()]
    .filter((k) => k >= base)
    .sort((a, b) => a - b);
  return { tree: serialize(root), keys, status: getCodeTemplateStatus() };
}

afterEach(() => {
  resetMainThreadState();
  delete g['__VUE_LYNX_IFR_PAINT__'];
  delete g['__VUE_LYNX_IFR_MT__'];
});

describe('code-paint ephemeral clone parity', () => {
  it('dense: paints the same native tree + registry as the interpreter', () => {
    const data = runClone(0, 100, false);
    const paint = runClone(0, 100, true);

    expect(paint.tree).not.toBeNull();
    expect(paint.tree).toEqual(data.tree);
    expect(paint.keys).toEqual(data.keys);
    // Dense names every materialized preorder slot; the comment consumes a uid
    // but no element: view=100, label=101, row=102, image=103, tail=105.
    expect(data.keys).toEqual([100, 101, 102, 103, 105]);
    // The path was genuinely taken only under the paint flag.
    expect(data.status).toBe('unused');
    expect(paint.status).toBe('painted');
  });

  it('sparse: paints the same native tree + registry as the interpreter', () => {
    // Name view/label/row/tail; image stays an anonymous skeleton node.
    const addressed = [0, 1, 2, 5];
    const data = runClone(addressed, 200, false);
    const paint = runClone(addressed, 200, true);

    expect(paint.tree).not.toBeNull();
    expect(paint.tree).toEqual(data.tree);
    expect(paint.keys).toEqual(data.keys);
    // Sparse uid = base + indexInAddressed: view=200, label=201, row=202,
    // tail=203 — the anonymous image gets no registry id.
    expect(data.keys).toEqual([200, 201, 202, 203]);
    expect(paint.status).toBe('painted');
  });

  it('later ops still target the code-painted handles (INSERT into a hole)', () => {
    // Prove downstream ops resolve the same uids the interpreter would create.
    resetMainThreadState();
    g['__VUE_LYNX_IFR_PAINT__'] = 'code-paint';
    g['__VUE_LYNX_IFR_MT__'] = true;
    applyOps([OP.REGISTER_TREE, 1, STRUCTURE, 0, OP.CLONE_TREE, 1, 300]);

    const child = 9000;
    applyOps([
      OP.CREATE, child, 'view',
      OP.SET_CLASS, child, 'injected',
      // Append into the nested row (uid 302).
      OP.INSERT, 302, child, -1,
    ]);
    const row = elements.get(302) as unknown as Element;
    const classes = Array.from(row.children).map((n) =>
      n.getAttribute('class'),
    );
    expect(classes).toContain('injected');
    expect(classes[classes.length - 1]).toBe('injected');
  });

  it('does not code-paint outside the IFR main-thread window', () => {
    resetMainThreadState();
    // Paint requested, but no IFR MT flag → durable interpreter path.
    g['__VUE_LYNX_IFR_PAINT__'] = 'code-paint';
    applyOps([OP.REGISTER_TREE, 1, STRUCTURE, 0, OP.CLONE_TREE, 1, 400]);
    expect(getCodeTemplateStatus()).toBe('unused');
    expect(elements.has(400)).toBe(true); // still painted, just via interpreter
  });
});
