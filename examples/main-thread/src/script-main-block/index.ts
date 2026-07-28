// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * `<script main>` Block Demo (issue #314)
 *
 * The same cross-thread round trip as the cross-thread-calls demo, but the
 * main-thread code lives in a dedicated `<script main>` SFC block instead of
 * per-function `'main thread'` directives.
 */

import { createApp } from 'vue-lynx';

import App from './App.vue';

const app = createApp(App);
app.mount();
