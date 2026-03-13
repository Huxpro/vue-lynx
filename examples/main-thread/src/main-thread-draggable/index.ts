// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main Thread Draggable Demo — Phase 2 SWC worklet transform.
 *
 * Shows two boxes that track a scroll-view's scroll position:
 *   - Left box: updated via Main Thread (smooth, zero thread crossings)
 *   - Right box: updated via Background Thread (laggy, 2 thread crossings)
 *
 * The 'main thread' directive is processed by the SWC worklet transform.
 */

import { createApp } from 'vue-lynx';

import App from './App.vue';

const app = createApp(App);
app.mount();
