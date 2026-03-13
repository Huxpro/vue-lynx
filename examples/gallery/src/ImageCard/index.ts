import '../gallery.css';
import { createApp, defineComponent, h } from 'vue-lynx';

import ImageCard from './ImageCard.vue';
import { furnituresPicturesSubArray } from '../Pictures/furnituresPictures.js';

// Wrapper that displays a single image card centered on screen
const App = defineComponent({
  setup() {
    const picture = furnituresPicturesSubArray[0]!;
    return () =>
      h(
        'view',
        { class: 'gallery-wrapper single-card' },
        [h(ImageCard, { picture })],
      );
  },
});

const app = createApp(App);
app.mount();
