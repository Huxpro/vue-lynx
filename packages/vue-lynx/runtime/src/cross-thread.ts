// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Cross-thread invocation: dispatch a worklet function call to the Main Thread
 * and receive its return value as a Promise.
 *
 * The SWC worklet transform (Phase 2) replaces the function body with a
 * worklet context object (`{ _wkltId, _c }`) at build time. At runtime,
 * `runOnMainThread` dispatches the context to the Main Thread via
 * 'Lynx.Worklet.runWorkletCtx', where the worklet-runtime executes it.
 */

import { onFunctionCall } from './function-call.js';
import { registerWorkletCtx } from './run-on-background.js';
import type { Worklet } from './worklet-types.js';

const RUN_WORKLET_CTX = 'Lynx.Worklet.runWorkletCtx';

/**
 * Mark a function to be executed on the Main Thread.
 *
 * Returns a wrapper that, when called from the Background Thread, dispatches
 * the call to the Main Thread via the worklet runtime and returns a Promise
 * that resolves to the function's return value.
 *
 * The SWC worklet transform replaces the `fn` argument with a worklet context
 * object at build time. Without the transform, `fn` is passed through as-is
 * (dev warning in non-production builds).
 *
 * @example
 * ```ts
 * const animate = runOnMainThread((x: number) => {
 *   'main thread'
 *   element.setStyleProperty('opacity', String(x))
 * })
 * await animate(0.5) // executes on Main Thread
 * ```
 */
// The args constraint uses `never[]` (not `unknown[]`) because function-arg
// positions are contravariant: a `(initial: T) => void` is NOT assignable to
// `(...args: unknown[]) => void`, so a constraint of `unknown[]` would reject
// every typed worklet body. `never` is the bottom type — any concrete arg
// type is assignable from it — so `(...args: never[]) => unknown` matches any
// concrete function signature, and `Parameters<Fn>` / `ReturnType<Fn>` stay
// precise at the call site. This is the standard "any function" generic
// constraint that doesn't trip `noExplicitAny`.
export function runOnMainThread<Fn extends (...args: never[]) => unknown>(
  fn: Fn,
): (...args: Parameters<Fn>) => Promise<ReturnType<Fn>> {
  registerWorkletCtx(fn as unknown as Worklet);
  return async (...params: Parameters<Fn>): Promise<ReturnType<Fn>> => {
    return new Promise((resolve) => {
      const resolveId = onFunctionCall(resolve as (value: unknown) => void);
      lynx.getCoreContext().dispatchEvent({
        type: RUN_WORKLET_CTX,
        data: JSON.stringify({
          worklet: fn as unknown as Worklet,
          params,
          resolveId,
        }),
      });
    });
  };
}
