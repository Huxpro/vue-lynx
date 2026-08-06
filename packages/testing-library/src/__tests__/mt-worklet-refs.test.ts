/**
 * MainThreadRef registry behavior in the main-thread ops executor.
 *
 * `INIT_MT_REF` is an 'always' op during IFR hydration: the background
 * thread's initial value is authoritative and has to win over whatever the
 * main-thread first-screen render installed under the same `_wvid`.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  applyInitMtRef,
  resetWorkletState,
} from '../../../vue-lynx/main-thread/src/worklet-apply.js';

interface RefCell {
  current: unknown;
  _wvid: number;
}

let refMap: Record<number, RefCell>;
let previousImpl: unknown;

beforeEach(() => {
  refMap = {};
  previousImpl = (globalThis as any).lynxWorkletImpl;
  (globalThis as any).lynxWorkletImpl = {
    _refImpl: { _workletRefMap: refMap, updateWorkletRef: () => {} },
  };
});

afterEach(() => {
  if (previousImpl === undefined) delete (globalThis as any).lynxWorkletImpl;
  else (globalThis as any).lynxWorkletImpl = previousImpl;
});

describe('applyInitMtRef', () => {
  it('registers a value-only ref', () => {
    applyInitMtRef(7, 42);
    expect(refMap[7]).toEqual({ current: 42, _wvid: 7 });
  });

  it('lets the background value overwrite the first-screen one', () => {
    applyInitMtRef(7, 'from-main-thread');
    const cell = refMap[7]!;

    applyInitMtRef(7, 'from-background');

    expect(refMap[7]!.current).toBe('from-background');
    // Same cell object: worklet-runtime hands these out by reference, so the
    // entry must be mutated rather than replaced.
    expect(refMap[7]).toBe(cell);
  });
});

describe('resetWorkletState', () => {
  it('clears the external ref registry', () => {
    applyInitMtRef(1, 'a');
    applyInitMtRef(2, 'b');

    resetWorkletState();

    expect(Object.keys(refMap)).toEqual([]);
  });
});
