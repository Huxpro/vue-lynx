// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { onScopeDispose } from '@vue/runtime-core';

import type { GlobalEventHandler, LynxGlobal } from './lynx-global.js';

declare const lynx: LynxGlobal;

/**
 * Registers a listener on Lynx's global event emitter for the current scope.
 */
export function useGlobalEvent(
  eventName: string,
  handler: GlobalEventHandler,
): void {
  const emitter = lynx?.getJSModule?.('GlobalEventEmitter');

  emitter?.addListener?.(eventName, handler);
  onScopeDispose(() => {
    emitter?.removeListener?.(eventName, handler);
  });
}
