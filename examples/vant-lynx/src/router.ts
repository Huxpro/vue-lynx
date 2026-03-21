import { createRouter, createMemoryHistory } from 'vue-router';
import Index from './pages/index.vue';
import ButtonDemo from './pages/button.vue';
import CellDemo from './pages/cell.vue';
import IconDemo from './pages/icon.vue';
import ImageDemo from './pages/image.vue';
import LoadingDemo from './pages/loading.vue';
import TagDemo from './pages/tag.vue';
import BadgeDemo from './pages/badge.vue';
import DividerDemo from './pages/divider.vue';
import SpaceDemo from './pages/space.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: Index },
    { path: '/button', name: 'button', component: ButtonDemo },
    { path: '/cell', name: 'cell', component: CellDemo },
    { path: '/icon', name: 'icon', component: IconDemo },
    { path: '/image', name: 'image', component: ImageDemo },
    { path: '/loading', name: 'loading', component: LoadingDemo },
    { path: '/tag', name: 'tag', component: TagDemo },
    { path: '/badge', name: 'badge', component: BadgeDemo },
    { path: '/divider', name: 'divider', component: DividerDemo },
    { path: '/space', name: 'space', component: SpaceDemo },
  ],
});

export default router;
