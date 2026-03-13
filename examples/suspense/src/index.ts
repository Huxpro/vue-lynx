/**
 * Vue-Lynx Suspense demo entry.
 *
 * Validates `<Suspense>` with async setup() on Lynx:
 *   - #default / #fallback slot rendering
 *   - Top-level await in <script setup> (requires withAsyncContext)
 *
 * See also: define-async.ts for defineAsyncComponent patterns.
 */

import { createApp } from 'vue-lynx';

import App from './App.vue';

const app = createApp(App);
app.mount();
