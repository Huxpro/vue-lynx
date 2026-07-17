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

// Some Lynx builds apply callLepusMethod successfully but do not invoke its
// callback. Never let nextTick()/Transition wait forever in that case.
const ACK_FALLBACK_MS = 50;

// Latched to true the first time the engine invokes a vuePatchUpdate callback.
// A healthy engine acks every batch, so once one real ack is observed the
// fallback timer is no longer armed — `nextTick()` keeps its strict
// "ops applied on the main thread" guarantee even when a large batch takes
// longer than ACK_FALLBACK_MS to apply.  Only engines that never invoke the
// callback keep racing the timer.
let engineAckObserved = false;
let warnedAckFallback = false;

/** @internal Exported for deterministic fallback timing tests. */
export function createFlushAck(
  timeoutMs: number | null = ACK_FALLBACK_MS,
  onTimeout?: () => void,
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
  // Some realms have no timers (the IFR MT Lepus realm stubs them; minimal
  // BG test realms omit them). Without setTimeout the fallback cannot be
  // armed — acks then settle only via the engine callback or a test reset,
  // which is the strict pre-fallback behavior.
  if (timeoutMs !== null && typeof setTimeout === 'function') {
    timer = setTimeout(() => {
      if (settled) return;
      onTimeout?.();
      resolve();
    }, timeoutMs);
  }
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
  inFlightAcks = 0;
  initialRenderCompletionRequested = false;
  engineAckObserved = false;
  warnedAckFallback = false;
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
  // resolves after this point will chain on it.  Once the engine has proven
  // it invokes callbacks, drop the fallback timer entirely — resolving early
  // on a slow-but-healthy engine would let `nextTick()` observe a main thread
  // that has not applied the ops yet.
  const ack = createFlushAck(
    engineAckObserved ? null : ACK_FALLBACK_MS,
    () => {
      if (__DEV__ && !warnedAckFallback) {
        warnedAckFallback = true;
        console.warn(
          '[vue-lynx] The engine did not acknowledge vuePatchUpdate within '
            + `${ACK_FALLBACK_MS}ms; nextTick() resolved via the fallback timer. `
            + 'On engines with this behavior, elements may not be materialised '
            + 'on the main thread yet when nextTick() settles.',
        );
      }
    },
  );
  pendingAckPromise = ack.promise;
  pendingAckResolve = ack.resolve;
  inFlightAcks++;
  ack.promise.then(() => {
    // A newer batch may already be in flight by the time an older fallback
    // settles. Only clear the state that belongs to this acknowledgement.
    if (pendingAckPromise === ack.promise) {
      pendingAckResolve = null;
      pendingAckPromise = null;
    }
    // The in-flight count follows the acknowledgement settle (real callback
    // OR fallback timer OR test reset), so the IFR initial-render completion
    // signal can never stall behind an engine that drops callbacks. Clamp:
    // resetFlushState() zeroes the counter before pending thens run.
    inFlightAcks = Math.max(0, inFlightAcks - 1);
    deliverInitialRenderCompletion();
  });

  // The local IFR path avoids serialization unless an observability hook
  // requested it. Background IPC still needs the wire payload.
  if (data === undefined) data = JSON.stringify(ops);

  // `lynx` is a bare AMD-injected identifier — in non-Lynx environments
  // (vitest node env) referencing it directly would throw ReferenceError.
  const app = typeof lynx === 'undefined' ? undefined : lynx?.getNativeApp?.();
  app?.callLepusMethod?.(
    'vuePatchUpdate',
    { data },
    () => {
      // Main thread has finished applying the ops — resolve the promise and
      // latch that this engine delivers callbacks. State cleanup and the IFR
      // completion signal run in the ack.promise.then above.
      engineAckObserved = true;
      ack.resolve();
    },
  );
}
