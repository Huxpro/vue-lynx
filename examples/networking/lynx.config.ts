import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      main: './src/index.ts',
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
