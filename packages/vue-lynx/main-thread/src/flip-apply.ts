// Copyright 2026 The Vue Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * FLIP move animations for <TransitionGroup>, run on the main thread.
 *
 * The main thread has no synchronous bounds call, so the last laid-out rect
 * of every tracked child is remembered from its `layoutchange` event. When
 * the background thread reorders children it sends FLIP_MOVE in the same
 * batch; the next `layoutchange` of each child then carries the new rect,
 * the delta to the remembered one is the inverse transform, and the engine
 * animates it back to zero with `__ElementAnimate`. Nothing crosses back to
 * the background thread.
 */

import { elements } from './element-registry.js';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LayoutChangeEvent {
  detail?: Partial<Rect>;
}

interface PendingMove {
  duration: number;
  easing: string;
  at: number;
}

/** The worklet id FLIP_TRACK binds to every child's `layoutchange`. */
export const FLIP_WORKLET_ID = 'vue-lynx:flip';
/** A FLIP_MOVE older than this is stale: the child did not move in that update. */
const PENDING_WINDOW_MS = 250;
/** `AnimationOperation.START` of the element PAPI. */
const ANIMATION_START = 0;

const rects = new Map<number, Rect>();
const pending = new Map<number, PendingMove>();
let registered = false;
let animationSeq = 0;

interface WorkletGlobals {
  registerWorkletInternal?: (
    type: string,
    id: string,
    worklet: (...args: unknown[]) => unknown,
  ) => void;
}

function ensureWorklet(): boolean {
  if (registered) return true;
  const g = globalThis as WorkletGlobals;
  if (typeof g.registerWorkletInternal !== 'function') return false;
  g.registerWorkletInternal(
    'main-thread',
    FLIP_WORKLET_ID,
    onLayoutChange as (...args: unknown[]) => unknown,
  );
  registered = true;
  return true;
}

/**
 * The `layoutchange` worklet. The runtime binds it to its event ctx, so
 * `this.id` is the tracked child's element id.
 */
export function onLayoutChange(
  this: { id?: number } | undefined,
  event: LayoutChangeEvent,
): void {
  const id = this?.id;
  if (typeof id !== 'number') return;
  const detail = event?.detail;
  if (!detail) return;
  const rect: Rect = {
    left: detail.left ?? 0,
    top: detail.top ?? 0,
    width: detail.width ?? 0,
    height: detail.height ?? 0,
  };
  const prev = rects.get(id);
  rects.set(id, rect);

  const move = pending.get(id);
  if (!move || !prev) return;
  pending.delete(id);
  if (Date.now() - move.at > PENDING_WINDOW_MS) return;

  const dx = prev.left - rect.left;
  const dy = prev.top - rect.top;
  if (dx === 0 && dy === 0) return;

  const el = elements.get(id);
  if (!el || typeof __ElementAnimate !== 'function') return;
  __ElementAnimate(el, [
    ANIMATION_START,
    `vue-lynx-flip-${++animationSeq}`,
    [
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: 'translate(0px, 0px)' },
    ],
    {
      duration: move.duration,
      timingFunction: move.easing,
      fillMode: 'none',
    },
  ]);
}

/** FLIP_TRACK: remember this child's rect from now on. */
export function applyFlipTrack(id: number): void {
  const el = elements.get(id);
  if (!el || !ensureWorklet()) return;
  __AddEvent(el, 'bindEvent', 'layoutchange', {
    type: 'worklet',
    value: { _wkltId: FLIP_WORKLET_ID, _workletType: 'main-thread', id },
  });
}

/** FLIP_UNTRACK: the child left; forget it. The element takes its event with it. */
export function applyFlipUntrack(id: number): void {
  rects.delete(id);
  pending.delete(id);
}

/** FLIP_MOVE: these children may have moved in the batch just applied. */
export function applyFlipMove(
  ids: number[],
  duration: number,
  easing: string,
): void {
  const at = Date.now();
  for (const id of ids) {
    if (rects.has(id)) pending.set(id, { duration, easing, at });
  }
}

/** Reset module state, for a new page and for tests. */
export function resetFlipState(): void {
  rects.clear();
  pending.clear();
  animationSeq = 0;
}
