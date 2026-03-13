// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Cross-Thread Shared Module Demo
 *
 * Demonstrates importing a plain JS module with `with { runtime: 'shared' }`
 * so its functions can be called inside main thread functions.
 *
 * The shared module (`color-utils.ts`) provides pure helper functions that
 * run on whichever thread imports them. The main thread tap handler calls
 * these helpers directly — no `'main thread'` directive needed in the helpers.
 *
 * Also shows async return value: the MT handler calls runOnBackground()
 * to report the computed color back to the BG thread.
 */

import { createApp } from 'vue-lynx';

import App from './App.vue';

const app = createApp(App);
app.mount();
