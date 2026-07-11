import { createApp } from 'vue-lynx/vapor-app';

// @ts-expect-error .vue resolution is handled by the bundler
import App from './App.vue';

createApp(App).mount();
