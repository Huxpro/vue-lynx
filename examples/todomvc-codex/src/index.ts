import './todomvc.css';
import { createApp } from 'vue-lynx';

import App from './App.vue';
import router, { usesMemoryHistory, visibilityPaths } from './router';

const app = createApp(App);

app.use(router);

if (usesMemoryHistory) {
  router.push(visibilityPaths.all);
}

app.mount();
