/**
 * Vue-Lynx Suspense demo — defineAsyncComponent entry.
 *
 * Validates defineAsyncComponent patterns:
 *   - Simulated slow component (artificial delay)
 *   - Dynamic import() for code-splitting
 */

import { createApp } from 'vue-lynx';

import DefineAsync from './DefineAsync.vue';

const app = createApp(DefineAsync);
app.mount();
