// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Shared helpers between <Transition> and <TransitionGroup>.
 *
 * whenTransitionEnds() previously only cleaned up its event-registry entry
 * from inside the transitionend/animationend handler itself. If that event
 * never arrived — most commonly because a rapid re-render cancels the
 * transition before it fires — the handler stayed registered in the global
 * event-registry (event-registry.ts) forever, along with its closure over
 * the removed element.
 *
 * We can't call getComputedStyle() from the BG thread the way @vue/runtime-dom
 * does to size an exact fallback timeout, so we use a generous fixed fallback
 * timer instead: whichever of "the real event" or "the fallback timer" fires
 * first unregisters the handler and resolves `done`. A per-element generation
 * counter (mirroring runtime-dom's `el._endId`) guards against a *stale*
 * finish() — one belonging to an already-superseded transition on the same
 * element — from tearing down a newer transition's live MT event binding.
 * The registry unregister always happens regardless of staleness, since an
 * outdated sign must be freed either way.
 */

import { queuePostFlushCb } from '@vue/runtime-core';
import { waitForFlush, scheduleFlush } from './flush.js';
import { resolveClass } from './node-ops.js';
import { OP, pushOp } from './ops.js';
import { register, unregister } from './event-registry.js';
import type { ShadowElement } from './shadow-element.js';

// Fallback ceiling for transitions with no explicit `duration`. Real CSS
// transition/animation durations in practice are well under this; it only
// exists to guarantee we never leak when the event doesn't arrive.
const FALLBACK_TIMEOUT_MS = 4000;

// Per-element generation counter, mirroring @vue/runtime-dom's `el._endId`.
let endId = 0;

export function addTransitionClass(el: ShadowElement, cls: string): void {
  el._transitionClasses.add(cls);
  pushOp(OP.SET_CLASS, el.id, resolveClass(el));
  scheduleFlush();
}

export function removeTransitionClass(el: ShadowElement, cls: string): void {
  el._transitionClasses.delete(cls);
  pushOp(OP.SET_CLASS, el.id, resolveClass(el));
  scheduleFlush();
}

// ---------------------------------------------------------------------------
// nextFrame — waits for MT to apply the current ops batch before proceeding.
// See Transition.ts's original comment for the full rationale.
// ---------------------------------------------------------------------------

export function nextFrame(cb: () => void): void {
  queuePostFlushCb(() => {
    waitForFlush().then(() => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          requestAnimationFrame(cb);
        });
      }
      else {
        setTimeout(cb, 16);
      }
    });
  });
}

/**
 * whenTransitionEnds — listens for transitionend/animationend on the element.
 *
 * Because we can't call getComputedStyle() from the BG thread, we rely on
 * either the actual event or a fixed-ceiling timeout as a fallback. Whichever
 * fires first wins; the loser is a no-op (guarded by `settled`).
 */
export function whenTransitionEnds(
  el: ShadowElement,
  expectedType: 'transition' | 'animation' | undefined,
  done: () => void,
): void {
  const eventName =
    expectedType === 'animation' ? 'animationend' : 'transitionend';

  const id = (el._transitionEndId = ++endId);
  let settled = false;

  const finish = () => {
    if (settled) return;
    settled = true;

    // Always free the registry entry — a stale sign must not linger just
    // because a newer transition has since started on the same element.
    unregister(sign);

    // Only touch the live MT event binding / call `done` if this finish()
    // still belongs to the current (most recent) transition on this
    // element. A stale finish() firing after a newer transition has
    // already re-registered its own listener must not rip that listener
    // out from under it.
    if (id === el._transitionEndId) {
      pushOp(OP.REMOVE_EVENT, el.id, 'bindEvent', eventName);
      scheduleFlush();
      done();
    }
  };

  const sign = register((_data: unknown) => {
    finish();
  });

  pushOp(OP.SET_EVENT, el.id, 'bindEvent', eventName, sign);
  scheduleFlush();

  setTimeout(finish, FALLBACK_TIMEOUT_MS);
}

export interface NormalizedDuration {
  enter: number;
  leave: number;
}

export function normalizeDuration(
  duration: number | { enter: number; leave: number } | undefined,
): NormalizedDuration {
  if (typeof duration === 'number') {
    return { enter: duration, leave: duration };
  }
  if (duration && typeof duration === 'object') {
    return { enter: duration.enter, leave: duration.leave };
  }
  return { enter: 0, leave: 0 };
}

export function hasExplicitDuration(props: {
  duration?: number | { enter: number; leave: number };
}): boolean {
  return props.duration != null;
}

// biome-ignore lint/suspicious/noExplicitAny: hooks have varying signatures
export function callHook(
  hook: ((...args: any[]) => void) | undefined,
  args: unknown[],
): void {
  if (hook) {
    hook(...args);
  }
}
