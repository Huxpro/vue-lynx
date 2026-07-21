/**
 * Regression tests for the Main Thread element-registry cleanup.
 *
 * The BG thread only sends REMOVE for the root of an unmounted subtree, so
 * ops-apply must release the whole detached subtree from the `elements` map
 * itself — but only at the end of the batch, because moves (KeepAlive
 * storage, Teleport) emit REMOVE + INSERT for the same element within one
 * batch. Found via the vdom-vs-vapor benchmark: without cleanup, repeated
 * 10k-row create/clear cycles degraded from ~1.2s to ~27s per create.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { OP } from 'vue-lynx/internal/ops';
// Same-process module state as the pipeline set up by runtime-dom-setup.ts.
import { applyOps, elements } from '../../../vue-lynx/main-thread/src/ops-apply.js';

let nextId = 100000; // far above ids used by other suites in this worker

function ids(count: number): number[] {
  return Array.from({ length: count }, () => nextId++);
}

// A detached root container standing in for the page root (uid 1 is only
// seeded by renderPage, which this suite does not run). The shared setup
// file clears the registry before each test, so recreate it per test.
let ROOT = 0;
beforeEach(() => {
  ROOT = nextId++;
  applyOps([OP.CREATE, ROOT, 'view']);
});

describe('MT element registry cleanup', () => {
  it('releases removed subtrees from the elements map', () => {
    const [parent, child, grandchild] = ids(3);
    applyOps([
      OP.CREATE, parent, 'view',
      OP.CREATE, child, 'view',
      OP.CREATE, grandchild, 'text',
      OP.INSERT, ROOT, parent, -1,
      OP.INSERT, parent, child, -1,
      OP.INSERT, child, grandchild, -1,
    ]);
    expect(elements.has(parent)).toBe(true);
    expect(elements.has(child)).toBe(true);
    expect(elements.has(grandchild)).toBe(true);

    // Removing the intermediate node must release its whole subtree…
    applyOps([OP.REMOVE, parent, child]);
    expect(elements.has(child)).toBe(false);
    expect(elements.has(grandchild)).toBe(false);
    // …but not the still-attached parent.
    expect(elements.has(parent)).toBe(true);

    applyOps([OP.REMOVE, ROOT, parent]);
    expect(elements.has(parent)).toBe(false);
  });

  it('keeps elements moved within one batch (KeepAlive/Teleport pattern)', () => {
    const [a, b, moved] = ids(3);
    applyOps([
      OP.CREATE, a, 'view',
      OP.CREATE, b, 'view',
      OP.CREATE, moved, 'text',
      OP.INSERT, ROOT, a, -1,
      OP.INSERT, ROOT, b, -1,
      OP.INSERT, a, moved, -1,
    ]);

    // Move: REMOVE from a + INSERT under b in the same batch.
    applyOps([
      OP.REMOVE, a, moved,
      OP.INSERT, b, moved, -1,
    ]);
    expect(elements.has(moved)).toBe(true);

    // A real removal afterwards still releases it.
    applyOps([OP.REMOVE, b, moved]);
    expect(elements.has(moved)).toBe(false);

    applyOps([OP.REMOVE, ROOT, a, OP.REMOVE, ROOT, b]);
  });

  it('does not grow the registry across create/remove cycles', () => {
    const container = ids(1)[0]!;
    applyOps([OP.CREATE, container, 'view', OP.INSERT, ROOT, container, -1]);
    const baseline = elements.size;

    for (let cycle = 0; cycle < 3; cycle++) {
      const rows = ids(50);
      const createOps: unknown[] = [];
      for (const row of rows) {
        const textNode = nextId++;
        createOps.push(
          OP.CREATE, row, 'view',
          OP.CREATE_TEXT, textNode,
          OP.INSERT, container, row, -1,
          OP.INSERT, row, textNode, -1,
        );
      }
      applyOps(createOps);
      expect(elements.size).toBe(baseline + 100);

      const removeOps: unknown[] = [];
      for (const row of rows) removeOps.push(OP.REMOVE, container, row);
      applyOps(removeOps);
      expect(elements.size).toBe(baseline);
    }

    applyOps([OP.REMOVE, ROOT, container]);
  });
});
