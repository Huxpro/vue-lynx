import { createRouter, createMemoryHistory } from 'vue-router';

import HomePage from './pages/HomePage.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
  ],
});

export default router;
