import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

const exampleName = path.basename(path.dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  output: {
    assetPrefix: `https://vue.lynxjs.org/examples/${exampleName}/dist/`,
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
      // IFR: render the first screen on the main thread during
      // loadTemplate, then hydrate when the background thread boots.
      enableIFR: true,
      optionsApi: false,
      enableCSSSelector: true,
    }),
  ],
});
