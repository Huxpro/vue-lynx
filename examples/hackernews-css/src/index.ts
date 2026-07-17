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

// Mount on both threads. IFR paints the chrome (header / nav / loading
// shell); network queries are gated off during the main-thread pass
// (see pages/* — `enabled: !isIfrMainThread()`), so the first frame stays
// deterministic without fetch. Background mount hydrates and then fetches.
app.mount();
