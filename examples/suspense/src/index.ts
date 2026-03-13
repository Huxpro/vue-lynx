/**
 * Vue-Lynx Suspense demo entry.
 *
 * Validates that `<Suspense>` works on Lynx:
 *   - #default / #fallback slot rendering
 *   - Async setup() with top-level await
 *   - defineAsyncComponent (lazy-loaded component)
 *   - onErrorCaptured for async error boundaries
 */

import { createApp } from 'vue-lynx';

import App from './App.vue';

const app = createApp(App);
app.mount();
