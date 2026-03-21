import { createRouter, createMemoryHistory } from 'vue-router';
import Index from './pages/index.vue';
import ButtonDemo from './pages/button.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: Index },
    { path: '/button', name: 'button', component: ButtonDemo },
  ],
});

export default router;
