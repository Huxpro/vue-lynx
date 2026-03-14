// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Shared Module Demo
 *
 * Demonstrates `import ... with { runtime: 'shared' }` to share plain
 * utility functions between the Main Thread and Background Thread.
 */

import { createApp } from 'vue-lynx';

import App from './App.vue';

const app = createApp(App);
app.mount();
