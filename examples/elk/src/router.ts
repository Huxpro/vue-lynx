// Route table mirroring Elk's file-based routes (app/pages/[[server]]/...).
// Nuxt file routing → explicit vue-router table with createMemoryHistory
// (no browser History API on Lynx).
import { createMemoryHistory, createRouter } from 'vue-router';

import AccountPage from './pages/AccountPage.vue';
import ComposePage from './pages/ComposePage.vue';
import ExplorePage from './pages/ExplorePage.vue';
import NotificationsPage from './pages/NotificationsPage.vue';
import SearchPage from './pages/SearchPage.vue';
import SettingsPage from './pages/SettingsPage.vue';
import StatusPage from './pages/StatusPage.vue';
import TagPage from './pages/TagPage.vue';
import TimelinePage from './pages/TimelinePage.vue';
import { currentServer, currentUser } from './composables/users';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      redirect: () =>
        currentUser.value?.token
          ? '/home'
          : `/${currentServer.value}/public/local`,
    },
    { path: '/home', component: TimelinePage, props: { kind: 'home' as const } },
    { path: '/notifications', component: NotificationsPage },
    { path: '/search', component: SearchPage },
    { path: '/compose', component: ComposePage },
    { path: '/settings', component: SettingsPage },
    { path: '/:server/public', component: TimelinePage, props: { kind: 'public' as const } },
    { path: '/:server/public/local', component: TimelinePage, props: { kind: 'local' as const } },
    { path: '/:server/explore', component: ExplorePage },
    { path: '/:server/tags/:tag', name: 'tag', component: TagPage },
    { path: '/:server/status/:id', name: 'status', component: StatusPage },
    { path: '/:server/@:account', name: 'account', component: AccountPage },
  ],
});

export default router;
