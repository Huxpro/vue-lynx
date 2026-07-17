// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * IFR (Instant First-Frame Rendering) bootstrap.
 *
 * Injected by vue-lynx/plugin (when built with `enableIFR: true`) into the
 * main-thread bundle between entry-main and user code, so the IFR globals
 * (`__VUE_LYNX_IFR_MT__`, `__vueLynxIfrApplyOps`) are in place before
 * `createApp().mount()` evaluates.
 */

import { enableIFR } from './ifr.js';

enableIFR();
