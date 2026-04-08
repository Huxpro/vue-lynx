import { defineConfig } from '@lynx-js/rspeedy';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';

export default defineConfig({
  environments: {
    web: {},
    lynx: {},
  },
  source: {
    entry: {
      main: './src/index.tsx',
    },
  },
  plugins: [
    pluginReactLynx({
      enableCSSInheritance: true,
    }),
  ],
});
