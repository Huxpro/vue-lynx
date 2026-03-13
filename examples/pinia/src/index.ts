// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Vue-Lynx + Pinia demo entry.
 *
 * Demonstrates integrating Pinia state management with vue-lynx:
 *   - createPinia() + app.use(pinia)
 *   - defineStore with setup syntax (ref, computed, functions)
 *   - Multiple stores (counter + todos)
 *   - Using stores in SFC components with <script setup>
 */

import { createApp } from 'vue-lynx';
import { createPinia } from 'pinia';

import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.mount();
