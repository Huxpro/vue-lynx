// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LynxGlobal } from './lynx-global.js';

declare const lynx: LynxGlobal;

/**
 * Handles Lynx lifecycle events delivered from the main thread / LEPUS.
 */
export function onLifecycleEvent(event: [string, unknown]): void {
  const [type, data] = event;

  if (type !== 'globalEventFromLepus') {
    return;
  }

  const [eventName, params] = data as [string, unknown];
  lynx?.getJSModule?.('GlobalEventEmitter')?.trigger?.(eventName, params);
}
