import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginTailwindCSS } from 'rsbuild-plugin-tailwindcss';
import { pluginVueLynx } from 'vue-lynx/plugin';

const exampleName = path.basename(path.dirname(fileURLToPath(import.meta.url)));

export default defineConfig({
  environments: {
    lynx: {},
    web: {},
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
      main: './src/index.ts',
    },
  },
  plugins: [
    pluginQRCode({
      schema(url) {
        return `${url}?fullscreen=true`;
      },
    }),
    pluginVueLynx({
      // IFR: render the first screen on the main thread during
      // loadTemplate, then hydrate when the background thread boots.
      enableIFR: true,
      optionsApi: false,
      enableCSSInheritance: true,
      enableCSSInlineVariables: true,
    }),
    pluginTailwindCSS({
      config: 'tailwind.config.ts',
      exclude: [/[\\/]node_modules[\\/]/],
    }),
  ],
});
