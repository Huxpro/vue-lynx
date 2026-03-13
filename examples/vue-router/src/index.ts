import { createApp } from 'vue-lynx';
import router from './router';
import App from './App.vue';

const app = createApp(App);
app.use(router);

// createMemoryHistory doesn't trigger initial navigation automatically,
// so we must push the initial route before mounting.
router.push('/');

app.mount();
