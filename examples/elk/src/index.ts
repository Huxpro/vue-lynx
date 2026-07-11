import { createApp } from 'vue-lynx';
import { createPinia } from 'pinia';

import { mastoLogin } from './composables/masto';
import { DEFAULT_SERVER } from './composables/users';
import router from './router';
import App from './App.vue';

// Anonymous session against the default public instance — Elk's guest mode
// (plugins/0.setup-users.ts does the same with runtimeConfig.defaultServer).
mastoLogin({ server: DEFAULT_SERVER });

const app = createApp(App);
app.use(createPinia());
app.use(router);

router.push('/');

app.mount();
