import { createApp } from 'vue-lynx';
import router from './router';
import App from './App.vue';
import './styles/transitions.css';

const app = createApp(App);
app.use(router);

router.push('/');

app.mount();
