import { createVaporApp } from 'vue';
// @ts-expect-error compiled by the esbuild vapor-sfc plugin
import App from './VaporApp.vue';

createVaporApp(App).mount('#app');
