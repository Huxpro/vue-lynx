import { createApp } from 'vue-lynx';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';

import router from './router';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin);
app.use(router);

router.push('/');

app.mount();
