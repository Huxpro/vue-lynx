import { createApp } from 'vue-lynx';
import router from './router';
import App from './App.vue';

const app = createApp(App);
app.use(router);

router.push('/');

app.mount();
