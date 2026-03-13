import '../gallery.css';
import { createApp, defineComponent, h } from 'vue-lynx';

import LikeImageCard from '../Components/LikeImageCard.vue';
import { furnituresPicturesSubArray } from '../Pictures/furnituresPictures.js';

// Wrapper that displays a single like-able image card centered on screen
const App = defineComponent({
  setup() {
    const picture = furnituresPicturesSubArray[0]!;
    return () =>
      h(
        'view',
        { class: 'gallery-wrapper single-card' },
        [h(LikeImageCard, { picture })],
      );
  },
});

const app = createApp(App);
app.mount();
