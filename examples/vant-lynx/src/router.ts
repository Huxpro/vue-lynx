import { createRouter, createMemoryHistory } from 'vue-router';
import Index from './pages/index.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: Index },
  ],
});

export default router;
