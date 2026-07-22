/**
 * IFR × sparse uid blocks (M3c, #324).
 *
 * The #290 concern: does IFR hydration assume dense contiguous uids?
 * `interceptPatchUpdate` compares recorded vs incoming op frames
 * structurally — REGISTER_TREE's `addressedOr0` array and CLONE_TREE's
 * baseUid ride ordinary frame arguments through deep `sameValue`, so a
 * sparse uid block hydrates whenever both realms emit the same
 * deterministic stream. These tests pin that contract at the ops level:
 * no densify pass is needed, and divergent sparse metadata still falls
 * back to the full background replay.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OP, type TemplateNode } from 'vue-lynx/internal/ops';
import {
  completeIfrHydration,
  enableIFR,
  getIfrPhase,
  interceptPatchUpdate,
  resetIfrForTesting,
  runIfrRender,
} from '../../../vue-lynx/main-thread/src/ifr.js';
import {
  elements,
  resetMainThreadState,
} from '../../../vue-lynx/main-thread/src/ops-apply.js';

const g = globalThis as Record<string, unknown>;

const STRUCTURE: TemplateNode = [
  'view',
  { c: 'card' },
  [
    ['text', { t: 'hello' }, []],
    ['#comment', 0, []],
    ['image', { a: [['src', 'x.png']] }, []],
  ],
];

// Sparse block: addressed [0, 1, 3] → uids base+0..base+2 (slot 2 is an
// anonymous comment anchor; slot 3 names base+2 — a non-contiguous slot map).
const BASE = 40;
const SPARSE_FIRST_FRAME = [
  OP.REGISTER_TREE, 1, STRUCTURE, [0, 1, 3],
  OP.CLONE_TREE, 1, BASE,
  OP.INSERT, 1, BASE, -1,
  OP.SET_TEXT, BASE + 1, 'hello',
];

function paintIfrFirstFrame(ops: unknown[]): void {
  enableIFR();
  g['__vueLynxIfrMountApps'] = () => {
    (g['__vueLynxIfrApplyOps'] as (o: unknown[]) => void)(ops);
  };
  runIfrRender();
  expect(getIfrPhase()).toBe('rendered');
}

beforeEach(() => {
  (globalThis as any).lynxTestingEnv.switchToMainThread();
  resetMainThreadState();
  resetIfrForTesting();
});

afterEach(() => {
  delete g['__vueLynxIfrMountApps'];
  resetIfrForTesting();
  resetMainThreadState();
});

describe('IFR hydration accepts sparse uid blocks', () => {
  it('hydrates an identical sparse background stream without fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    paintIfrFirstFrame(SPARSE_FIRST_FRAME);

    // Sparse instance painted: named uids BASE..BASE+2 present, comment not.
    expect(elements.has(BASE)).toBe(true);
    expect(elements.has(BASE + 1)).toBe(true);
    expect(elements.has(BASE + 2)).toBe(true);

    // BG boots and produces the identical deterministic sparse stream.
    const handled = interceptPatchUpdate(JSON.stringify(SPARSE_FIRST_FRAME));
    expect(handled).toBe(true);
    completeIfrHydration();
    expect(getIfrPhase()).toBe('hydrated');
    // No structural-mismatch fallback fired.
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('hydration mismatch'),
    );
    warn.mockRestore();
  });

  it('adopts BG values into the sparse tree (value-level diff, no teardown)', () => {
    paintIfrFirstFrame(SPARSE_FIRST_FRAME);

    const bgOps = [...SPARSE_FIRST_FRAME];
    bgOps[bgOps.length - 1] = 'hello from bg'; // SET_TEXT value differs
    expect(interceptPatchUpdate(JSON.stringify(bgOps))).toBe(true);
    completeIfrHydration();
    expect(getIfrPhase()).toBe('hydrated');

    const textEl = elements.get(BASE + 1) as unknown as Element;
    expect(textEl.textContent).toBe('hello from bg');
  });

  it('falls back to full BG replay when the addressed list diverges', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    paintIfrFirstFrame(SPARSE_FIRST_FRAME);

    // BG recovered a different addressed closure (e.g. skew after an HMR
    // mismatch) — structural argument differs → authoritative replay.
    const bgOps = [
      OP.REGISTER_TREE, 1, STRUCTURE, [0, 3],
      OP.CLONE_TREE, 1, BASE,
      OP.INSERT, 1, BASE, -1,
      OP.SET_TEXT, BASE + 1, 'hello',
    ];
    expect(interceptPatchUpdate(JSON.stringify(bgOps))).toBe(true);
    expect(getIfrPhase()).toBe('hydrated');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('hydration mismatch'),
    );
    // The replayed BG tree is now authoritative: [0,3] names BASE..BASE+1.
    expect(elements.has(BASE)).toBe(true);
    expect(elements.has(BASE + 1)).toBe(true);
    warn.mockRestore();
  });

  it('hydrates a dense stream identically (naming axis is orthogonal to IFR)', () => {
    const denseFrame = [
      OP.REGISTER_TREE, 1, STRUCTURE, 0,
      OP.CLONE_TREE, 1, BASE,
      OP.INSERT, 1, BASE, -1,
    ];
    paintIfrFirstFrame(denseFrame);
    expect(interceptPatchUpdate(JSON.stringify(denseFrame))).toBe(true);
    completeIfrHydration();
    expect(getIfrPhase()).toBe('hydrated');
  });
});
