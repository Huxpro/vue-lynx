import { createApp } from 'vue-lynx';
import { createPinia } from 'pinia';

import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.mount();
