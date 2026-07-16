import { createApp } from 'vue-lynx';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';

import router from './router';
import App from './App.vue';
import { hasFetch } from './api';

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin);
app.use(router);

router.push('/');

// Network-driven screens do not have a deterministic IFR render when the
// main-thread PrimJS context has no fetch. All modules have still evaluated
// by this point, so element-template registrations are available for the
// background render that follows.
if (hasFetch()) app.mount();
