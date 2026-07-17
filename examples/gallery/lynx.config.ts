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
    // Asset URLs must be absolute so Lynx Explorer (QR code) can fetch
    // images from the deployed site — but they must follow the *current*
    // deployment: pointing previews at production 404s any asset that
    // production doesn't have yet (e.g. dist-vapor/ before a merge).
    assetPrefix: `${
      process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production'
        && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://vue.lynxjs.org'
    }/examples/${exampleName}/dist/`,
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
