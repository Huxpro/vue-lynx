import { createApp } from 'vue-lynx';

// @ts-expect-error .vue resolution is handled by the bundler
import ListApp from './ListApp.vue';

createApp(ListApp).mount();
