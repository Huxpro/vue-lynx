// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { IFR_MT_FLAG_GLOBAL } from 'vue-lynx/internal/ops';

/** Return true only inside an IFR-enabled main-thread bundle. */
export function isIfrMainThread(): boolean {
  return (
    (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL] === true
  );
}

const IFR_ENABLED_GLOBAL = '__VUE_LYNX_IFR_ENABLED__';

/** Mark this generated bundle as participating in an IFR handoff. */
export function enableIfrRuntime(): void {
  (globalThis as Record<string, unknown>)[IFR_ENABLED_GLOBAL] = true;
}

/** Whether the build pipeline enabled IFR in the current realm. */
export function isIfrEnabled(): boolean {
  return Boolean(
    (globalThis as Record<string, unknown>)[IFR_ENABLED_GLOBAL],
  );
}

/**
 * Suppress lifecycle registration during the ephemeral (IFR scout copy) render while
 * preserving the original API's type and normal background-thread behavior.
 */
export function ifrInert<T extends (...args: never[]) => unknown>(fn: T): T {
  return ((...args: never[]) => {
    if (isIfrMainThread()) return undefined;
    return fn(...args);
  }) as T;
}

/**
 * Gate emitted by the Lynx worklet transform. The runtime itself is loaded by
 * the main-thread entry, so the transformed registration may run when its
 * global registration function is available.
 */
export function loadWorkletRuntime(_entry?: unknown): boolean {
  return typeof (globalThis as Record<string, unknown>)[
    'registerWorkletInternal'
  ] === 'function';
}
