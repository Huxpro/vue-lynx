import { createMemoryHistory, createRouter } from 'vue-router';

import ChatPage from './pages/ChatPage.vue';
import HomePage from './pages/HomePage.vue';

// Lynx has no browser History API — memory history mirrors the original's
// `/` and `/chat/:id` pages in-app.
export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/chat/:id', component: ChatPage },
  ],
});
