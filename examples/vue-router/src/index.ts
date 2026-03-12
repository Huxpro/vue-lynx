// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Vue Router demo entry.
 *
 * Demonstrates Vue Router with createMemoryHistory() in a Lynx environment
 * where window.location / window.navigator are unavailable.
 *
 * Features exercised:
 *   - createMemoryHistory (no browser APIs needed)
 *   - RouterView for rendering matched routes
 *   - RouterLink with custom v-slot (Lynx has no <a> tag)
 *   - Programmatic navigation via router.push()
 *   - Dynamic route params (/users/:id)
 *   - useRoute / useRouter composables
 */

import { createApp } from 'vue-lynx';
import router from './router';
import App from './App.vue';

const app = createApp(App);
app.use(router);

// createMemoryHistory doesn't trigger initial navigation automatically,
// so we must push the initial route before mounting.
router.push('/');

app.mount();
