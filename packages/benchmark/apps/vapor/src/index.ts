import { setupBenchInstrumentation } from '../../../shared/bench-core';
import { createApp } from 'vue-lynx/with-vapor';

// @ts-expect-error .vue resolution is handled by the bundler
import App from './App.vue';

// Patch lynx.getNativeApp before the first flush so every vuePatchUpdate
// batch is observed.
setupBenchInstrumentation();

createApp(App).mount();
