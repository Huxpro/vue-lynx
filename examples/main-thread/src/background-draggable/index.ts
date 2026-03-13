// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Background Draggable Demo — Background Thread only (no Main Thread APIs).
 *
 * A box tracks a scroll-view's scroll position, updated entirely through
 * Vue's reactive system on the Background Thread. This demonstrates the
 * baseline behavior without Main Thread optimizations.
 */

import { createApp } from 'vue-lynx';

import App from './App.vue';

const app = createApp(App);
app.mount();
