import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      'gallery-image-card': './src/ImageCard/index.ts',
      'gallery-like-card': './src/LikeCard/index.ts',
      'gallery-list': './src/GalleryList/index.ts',
      'gallery-autoscroll': './src/GalleryAutoScroll/index.ts',
      'gallery-scrollbar': './src/GalleryScrollbar/index.ts',
      'gallery-scrollbar-compare': './src/GalleryScrollbarCompare/index.ts',
      'gallery-complete': './src/GalleryComplete/index.ts',
    },
  },
  plugins: [
    pluginVueLynx({
      optionsApi: false,
      enableCSSSelector: true,
    }),
  ],
});
