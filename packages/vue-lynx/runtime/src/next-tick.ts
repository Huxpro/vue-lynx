// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { nextTick as _vueNextTick } from '@vue/runtime-core';

import { waitForFlush } from './flush.js';

/**
 * Wait for the next DOM update flush **and** the main-thread ops acknowledgement.
 *
 * Unlike standard Vue's `nextTick` which only waits for the scheduler flush,
 * Vue Lynx's version also waits for the main thread to apply the ops, so
 * native Lynx elements are fully materialised when the callback fires.
 *
 * @param fn - Optional callback to execute after flush
 * @returns A promise that resolves when the main thread has applied all pending ops
 *
 * @see {@link https://vuejs.org/api/general.html#nexttick | Vue nextTick} — Vue Lynx extends the standard behavior.
 *
 * @public
 */
export function nextTick(fn?: () => void): Promise<void> {
  if (fn) {
    return _vueNextTick()
      .then(() => waitForFlush())
      .then(fn);
  }
  return _vueNextTick().then(() => waitForFlush());
}
