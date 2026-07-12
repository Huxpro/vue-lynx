// Vue Lynx build of the playground preview bundles (upstream builds these
// with ReactLynx; the shell drives whichever bundle sits at
// `./a2ui.web.js` / `./openui.web.js`).
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginVueLynx } from 'vue-lynx/plugin';

export default defineConfig({
  dev: {
    hmr: false,
  },
  plugins: [
    pluginVueLynx({
      optionsApi: false,
    }),
  ],
  source: {
    entry: {
      a2ui: './lynx-src/a2ui/index.ts',
      openui: './lynx-src/openui/index.ts',
    },
  },
  environments: {
    web: {},
    lynx: {},
  },
  output: {
    distPath: {
      root: 'www',
    },
    filename: '[name].[platform].js',
    minify: false,
  },
});
