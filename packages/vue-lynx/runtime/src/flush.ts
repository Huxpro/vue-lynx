// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { queuePostFlushCb } from '@vue/runtime-core';

import { isIfrEnabled, isIfrMainThread } from './ifr-env.js';
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
let inFlightAcks = 0;
let initialRenderCompletionRequested = false;

function deliverInitialRenderCompletion(): void {
  if (
    !initialRenderCompletionRequested
    || scheduled
    || inFlightAcks > 0
  ) return;

  initialRenderCompletionRequested = false;
  if (isIfrMainThread()) {
    const seal = (globalThis as Record<string, unknown>)[
      '__vueLynxIfrSealOps'
    ];
    if (typeof seal === 'function') seal();
    return;
  }

  const app = typeof lynx === 'undefined' ? undefined : lynx?.getNativeApp?.();
  app?.callLepusMethod?.('vueIfrHydrationComplete', {}, () => {
    // Completion acknowledgement has no follow-up work.
  });
}

/**
 * Flush the complete initial stream, then signal its end across the thread.
 * The explicit boundary distinguishes a split batch from a genuine BG prefix.
 */
export function completeIfrInitialRender(): void {
  if (!isIfrEnabled()) return;
  initialRenderCompletionRequested = true;
  if (scheduled) doFlush();
  deliverInitialRenderCompletion();
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
  pendingAckResolve = null;
  pendingAckPromise = null;
  inFlightAcks = 0;
  initialRenderCompletionRequested = false;
}

function doFlush(): void {
  scheduled = false;
  const ops = takeOps();
  if (ops.length === 0) {
    deliverInitialRenderCompletion();
    return;
  }

  // Optional observability hook (benchmarks, debugging): called with every
  // flushed batch before it is posted to the Main Thread.
  const hook = (globalThis as {
    __VUE_LYNX_FLUSH_HOOK__?: (ops: unknown[], serialized: string) => void;
  }).__VUE_LYNX_FLUSH_HOOK__;
  let data: string | undefined;
  if (hook) {
    try {
      data = JSON.stringify(ops);
      hook(ops, data);
    } catch {
      // Observability must never break the pipeline.
    }
  }

  // IFR runs the first render inside the main-thread realm. Apply and record
  // its ops locally; no IPC acknowledgement can exist on this path.
  if (isIfrMainThread()) {
    const applyLocal = (globalThis as Record<string, unknown>)[
      '__vueLynxIfrApplyOps'
    ] as ((value: unknown[]) => void) | undefined;
    if (applyLocal) {
      applyLocal(ops);
    } else if (__DEV__) {
      console.warn(
        '[vue-lynx] IFR main-thread ops sink is unavailable; dropping the batch.',
      );
    }
    deliverInitialRenderCompletion();
    return;
  }

  // Create the ack promise BEFORE sending so that any `nextTick` call that
  // resolves after this point will chain on it.
  pendingAckPromise = new Promise<void>((resolve) => {
    pendingAckResolve = resolve;
  });

  // The local IFR path avoids serialization unless an observability hook
  // requested it. Background IPC still needs the wire payload.
  if (data === undefined) data = JSON.stringify(ops);

  // `lynx` is a bare AMD-injected identifier — in non-Lynx environments
  // (vitest node env) referencing it directly would throw ReferenceError.
  const app = typeof lynx === 'undefined' ? undefined : lynx?.getNativeApp?.();
  if (app?.callLepusMethod) inFlightAcks++;
  app?.callLepusMethod?.(
    'vuePatchUpdate',
    { data },
    () => {
      // Main thread has finished applying the ops — resolve the promise.
      pendingAckResolve?.();
      pendingAckResolve = null;
      pendingAckPromise = null;
      inFlightAcks--;
      deliverInitialRenderCompletion();
    },
  );
}
