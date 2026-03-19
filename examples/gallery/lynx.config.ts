import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      ImageCard: './src/ImageCard/index.ts',
      LikeCard: './src/LikeCard/index.ts',
      GalleryList: './src/GalleryList/index.ts',
      GalleryAutoScroll: './src/GalleryAutoScroll/index.ts',
      GalleryScrollbar: './src/GalleryScrollbar/index.ts',
      GalleryScrollbarCompare: './src/GalleryScrollbarCompare/index.ts',
      GalleryComplete: './src/GalleryComplete/index.ts',
    },
  },
  plugins: [
    pluginVueLynx({
      optionsApi: false,
      enableCSSSelector: true,
    }),
  ],
});
