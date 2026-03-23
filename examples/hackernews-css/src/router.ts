import { createRouter, createMemoryHistory } from 'vue-router';
import { validFeeds } from './api';
import FeedList from './pages/FeedList.vue';
import ItemPage from './pages/ItemPage.vue';
import UserPage from './pages/UserPage.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      redirect: '/news',
    },
    {
      path: '/:feed/:page?',
      name: 'feed-page',
      component: FeedList,
      props: (route) => ({
        feed: route.params.feed as string,
        page: Number(route.params.page) || 1,
        maxPage: validFeeds[route.params.feed as string]?.pages ?? 1,
      }),
    },
    {
      path: '/item/:id',
      name: 'item-id',
      component: ItemPage,
    },
    {
      path: '/user/:id',
      name: 'user-id',
      component: UserPage,
    },
  ],
});

export default router;
