import { createApp } from 'vue-lynx';
import { createPinia } from 'pinia';

import router from './router';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.use(router);

router.push('/');

app.mount();
