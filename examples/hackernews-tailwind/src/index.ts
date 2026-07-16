import { createApp, isIfrMainThread } from 'vue-lynx';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';

import router from './router';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin);
app.use(router);

router.push('/');

// This screen is network-driven — there is nothing meaningful to paint
// before a response arrives — so it opts out of the IFR main-thread mount.
// Module evaluation still runs on both threads, keeping worklet and
// element-template registrations available.
if (!isIfrMainThread()) app.mount();
