import { createApp, defineComponent, h } from 'vue-lynx';

import '../swiper.css';
import Swiper from './Swiper.vue';
import Page from '../Components/Page.vue';
import { picsArr } from '../utils/pics.js';

const App = defineComponent({
  setup() {
    return () =>
      h(Page, null, {
        default: () => h(Swiper, { data: picsArr }),
      });
  },
});

createApp(App).mount();
