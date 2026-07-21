/**
 * Unit tests for list-apply diff — mirrors ReactLynx ListUpdateInfoRecording
 * semantics (move = remove + insert; LIS keeps a stable subsequence).
 *
 * Reference: lynx-family/lynx-stack
 *   packages/react/runtime/src/snapshot/list/listUpdateInfo.ts
 */

import { describe, it, expect } from 'vitest';
import {
  diffListItems,
  longestIncreasingSubsequence,
  type ListItemEntry,
} from '../../../vue-lynx/main-thread/src/list-apply.js';

function entries(ids: number[]): ListItemEntry[] {
  // el is unused by diff — stub with null-ish cast for unit tests
  return ids.map((bgId) => ({ el: null as unknown as LynxElement, bgId }));
}

describe('longestIncreasingSubsequence', () => {
  it('returns empty for empty input', () => {
    expect([...longestIncreasingSubsequence([])]).toEqual([]);
  });

  it('keeps a strictly increasing run', () => {
    expect(longestIncreasingSubsequence([0, 1, 2, 3])).toEqual(
      new Set([0, 1, 2, 3]),
    );
  });

  it('picks length-1 for a full reverse', () => {
    const lis = longestIncreasingSubsequence([2, 1, 0]);
    expect(lis.size).toBe(1);
    expect([0, 1, 2].some((v) => lis.has(v))).toBe(true);
  });

  it('keeps increasing subset in a shuffle', () => {
    // old indices in new order for [A,B,C,D] → [A,C,B,D] would be [0,2,1,3]
    // LIS can be [0,2,3] or [0,1,3]
    const lis = longestIncreasingSubsequence([0, 2, 1, 3]);
    expect(lis.size).toBe(3);
  });
});

describe('diffListItems (ReactLynx-style)', () => {
  it('initial mount inserts every item at its position', () => {
    const { removeAction, insertAction, stayedBgIds } = diffListItems(
      [],
      entries([10, 20, 30]),
    );
    expect(removeAction).toEqual([]);
    expect(insertAction).toEqual([
      { position: 0, bgId: 10 },
      { position: 1, bgId: 20 },
      { position: 2, bgId: 30 },
    ]);
    expect(stayedBgIds.size).toBe(0);
  });

  it('append-only emits inserts at the tail', () => {
    const { removeAction, insertAction, stayedBgIds } = diffListItems(
      entries([10, 20]),
      entries([10, 20, 30, 40]),
    );
    expect(removeAction).toEqual([]);
    expect(insertAction).toEqual([
      { position: 2, bgId: 30 },
      { position: 3, bgId: 40 },
    ]);
    expect([...stayedBgIds].sort()).toEqual([10, 20]);
  });

  it('prepend emits a single insert at position 0', () => {
    const { removeAction, insertAction, stayedBgIds } = diffListItems(
      entries([10, 20]),
      entries([99, 10, 20]),
    );
    expect(removeAction).toEqual([]);
    expect(insertAction).toEqual([{ position: 0, bgId: 99 }]);
    expect([...stayedBgIds].sort()).toEqual([10, 20]);
  });

  it('remove middle emits only that old index', () => {
    // [A,B,C] → [A,C]  ids 1,2,3
    const { removeAction, insertAction, stayedBgIds } = diffListItems(
      entries([1, 2, 3]),
      entries([1, 3]),
    );
    expect(removeAction).toEqual([1]);
    expect(insertAction).toEqual([]);
    expect([...stayedBgIds].sort()).toEqual([1, 3]);
  });

  it('remove last emits the last old index', () => {
    const { removeAction, insertAction } = diffListItems(
      entries([1, 2, 3, 4]),
      entries([1, 2, 3]),
    );
    expect(removeAction).toEqual([3]);
    expect(insertAction).toEqual([]);
  });

  it('mixed remove middle then remove last (single flush) emits both indices', () => {
    // Snapshot-relative contract (ReactLynx ListUpdateInfoRecording):
    // old [1,2,3,4,5,6] drop indices 2 and 5 → removeAction [2, 5] ascending.
    // Native applies the whole array against the pre-diff snapshot as a batch.
    // If native ever applied sequentially against a shrinking array, [2, 5]
    // would be wrong (would need [2, 4] or descending [5, 2]) — do not "fix".
    const { removeAction, insertAction } = diffListItems(
      entries([1, 2, 3, 4, 5, 6]),
      entries([1, 2, 4, 5]),
    );
    expect(removeAction).toEqual([2, 5]);
    expect(insertAction).toEqual([]);
  });

  it('sequential remove middle then remove last across two diffs', () => {
    // Flush 1: remove middle from 12 items (index 6)
    const twelve = entries([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const afterMiddle = entries([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12]);
    const d1 = diffListItems(twelve, afterMiddle);
    expect(d1.removeAction).toEqual([6]);
    expect(d1.insertAction).toEqual([]);

    // Flush 2: remove last of the 11-item list
    const afterLast = entries([1, 2, 3, 4, 5, 6, 8, 9, 10, 11]);
    const d2 = diffListItems(afterMiddle, afterLast);
    expect(d2.removeAction).toEqual([10]);
    expect(d2.insertAction).toEqual([]);
  });

  it('full reverse removes non-LIS and re-inserts (no item loss)', () => {
    const old = entries([1, 2, 3]);
    const neu = entries([3, 2, 1]);
    const { removeAction, insertAction, stayedBgIds } = diffListItems(
      old,
      neu,
    );
    // One stayer; the other two are removed from old indices and inserted
    expect(stayedBgIds.size).toBe(1);
    expect(removeAction.length).toBe(2);
    expect(insertAction.length).toBe(2);
    // Every bgId still accounted for: stayers + inserts cover new list
    const present = new Set([
      ...stayedBgIds,
      ...insertAction.map((a) => a.bgId),
    ]);
    expect([...present].sort()).toEqual([1, 2, 3]);
    // Insert positions must be in-range for the new length
    for (const a of insertAction) {
      expect(a.position).toBeGreaterThanOrEqual(0);
      expect(a.position).toBeLessThan(3);
    }
    // Native applies removals against OLD indices — must be valid
    for (const r of removeAction) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(3);
    }
  });

  it('yellow-to-top move keeps the other three as LIS when possible', () => {
    // [R,B,G,Y] → [Y,R,B,G]  ids 1,2,3,4
    const { removeAction, insertAction, stayedBgIds } = diffListItems(
      entries([1, 2, 3, 4]),
      entries([4, 1, 2, 3]),
    );
    // Best LIS is [1,2,3] (old indices 0,1,2); Y removed from 3 and inserted at 0
    expect(removeAction).toEqual([3]);
    expect(insertAction).toEqual([{ position: 0, bgId: 4 }]);
    expect([...stayedBgIds].sort()).toEqual([1, 2, 3]);
  });

  it('remove then restore same identities re-inserts at correct positions', () => {
    const d1 = diffListItems(
      entries([1, 2, 3, 4]),
      entries([1]),
    );
    expect(d1.removeAction).toEqual([1, 2, 3]);

    const d2 = diffListItems(
      entries([1]),
      entries([1, 2, 3, 4]),
    );
    expect(d2.removeAction).toEqual([]);
    expect(d2.insertAction).toEqual([
      { position: 1, bgId: 2 },
      { position: 2, bgId: 3 },
      { position: 3, bgId: 4 },
    ]);
  });

  it('no-op when identical', () => {
    const { removeAction, insertAction, stayedBgIds } = diffListItems(
      entries([1, 2, 3]),
      entries([1, 2, 3]),
    );
    expect(removeAction).toEqual([]);
    expect(insertAction).toEqual([]);
    expect([...stayedBgIds].sort()).toEqual([1, 2, 3]);
  });
});
