import { createApp } from 'vue-lynx';

import App from './App.vue';
import { router } from './router';

const app = createApp(App);
app.use(router);
router.push('/');
app.mount();
