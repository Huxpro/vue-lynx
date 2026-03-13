/**
 * Vue-Lynx Options API demo entry.
 *
 * Validates that the `optionsApi: true` plugin flag works correctly:
 *   - data() reactive state
 *   - computed properties
 *   - methods
 *   - watch
 *   - lifecycle hooks (mounted)
 *   - component registration via `components` option
 */

import { createApp } from 'vue-lynx';

import App from './App.vue';

const app = createApp(App);
app.mount();
