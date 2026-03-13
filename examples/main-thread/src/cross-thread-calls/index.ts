// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Cross-Thread Calls Demo
 *
 * Demonstrates runOnMainThread() and runOnBackground() for bidirectional
 * async communication between the Background Thread and the Main Thread.
 *
 * - Tap the box: Main Thread handler calls runOnBackground() to update
 *   reactive state (tap count) on the Background Thread.
 * - The Background Thread watcher calls runOnMainThread() to change the
 *   box's background color on the Main Thread based on the count.
 */

import { createApp } from 'vue-lynx';

import App from './App.vue';

const app = createApp(App);
app.mount();
