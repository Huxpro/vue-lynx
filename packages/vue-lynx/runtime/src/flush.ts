// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { queuePostFlushCb } from '@vue/runtime-core';

import { takeOps } from './ops.js';

/**
 * Schedule a flush of the ops buffer via Vue's post-flush hook.
 *
 * queuePostFlushCb fires after all reactive effects and component renders in
 * the current scheduler tick have completed.  We batch all DOM ops from one
 * reactive "tick" into a single callLepusMethod call, minimising cross-thread
 * traffic.
 */

// `lynx` is injected by RuntimeWrapperWebpackPlugin as a parameter to the
// tt.define() AMD callback – it is NOT on globalThis.  Declare it as an
// ambient variable so TypeScript accepts the bare identifier reference.
// eslint-disable-next-line no-var
declare var lynx:
  | {
    getNativeApp():
      | {
        callLepusMethod(
          method: string,
          params: unknown,
          callback: () => void,
        ): void;
      }
      | null
      | undefined;
  }
  | null
  | undefined;

let scheduled = false;

// ---------------------------------------------------------------------------
// Main-thread acknowledgement tracking
//
// In Lynx's dual-thread architecture, `callLepusMethod` sends ops to the main
// thread asynchronously.  Vue's built-in `nextTick` resolves as soon as the BG
// flush cycle finishes — but the main thread has not yet applied the ops at
// that point.  We track a promise that resolves when the MT calls back, and
// expose `waitForFlush()` so the runtime can chain it into `nextTick`.
// ---------------------------------------------------------------------------

let pendingAckResolve: (() => void) | null = null;
let pendingAckPromise: Promise<void> | null = null;

// Some Lynx builds apply callLepusMethod successfully but do not invoke its
// callback. Never let nextTick()/Transition wait forever in that case.
const ACK_FALLBACK_MS = 50;

/** @internal Exported for deterministic fallback timing tests. */
export function createFlushAck(
  timeoutMs = ACK_FALLBACK_MS,
): { promise: Promise<void>; resolve: () => void } {
  let fulfill!: () => void;
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const promise = new Promise<void>((resolve) => {
    fulfill = resolve;
  });
  const resolve = () => {
    if (settled) return;
    settled = true;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    fulfill();
  };
  timer = setTimeout(resolve, timeoutMs);
  return { promise, resolve };
}

/**
 * Returns a promise that resolves once the most recent ops batch has been
 * applied on the main thread.  If no ops are in flight, resolves immediately.
 */
export function waitForFlush(): Promise<void> {
  return pendingAckPromise ?? Promise.resolve();
}

export function scheduleFlush(): void {
  if (scheduled) return;
  scheduled = true;
  queuePostFlushCb(doFlush);
}

/** Reset module state – for testing only. */
export function resetFlushState(): void {
  scheduled = false;
  pendingAckResolve?.();
  pendingAckResolve = null;
  pendingAckPromise = null;
}

function doFlush(): void {
  scheduled = false;
  const ops = takeOps();
  if (ops.length === 0) return;

  // Create the ack promise BEFORE sending so that any `nextTick` call that
  // resolves after this point will chain on it.
  const ack = createFlushAck();
  pendingAckPromise = ack.promise;
  pendingAckResolve = ack.resolve;
  ack.promise.then(() => {
    // A newer batch may already be in flight by the time an older fallback
    // settles. Only clear the state that belongs to this acknowledgement.
    if (pendingAckPromise === ack.promise) {
      pendingAckResolve = null;
      pendingAckPromise = null;
    }
  });

  const app = lynx?.getNativeApp?.();
  app?.callLepusMethod?.(
    'vuePatchUpdate',
    { data: JSON.stringify(ops) },
    // Main thread has finished applying the ops — resolve the promise.
    ack.resolve,
  );
}
