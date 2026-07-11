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
    assetPrefix: `https://vue.lynxjs.org/examples/${exampleName}/dist/`,
  },
  source: {
    entry: {
      main: './src/index.ts',
    },
    // The Lynx background-thread eval scope defines a broken bare `fetch`
    // stub and hides other web globals that masto.js references as free
    // identifiers; rewrite them to globalThis.* at compile time. (Same
    // issue examples/networking works around with `globalThis.fetch`.)
    define: {
      fetch: 'globalThis.fetch',
      Request: 'globalThis.Request',
      Response: 'globalThis.Response',
      Headers: 'globalThis.Headers',
      AbortSignal: 'globalThis.AbortSignal',
      AbortController: 'globalThis.AbortController',
      URLSearchParams: 'globalThis.URLSearchParams',
      FormData: 'globalThis.FormData',
      WebSocket: 'globalThis.WebSocket',
      // Optional local API relay for sandboxed verification environments
      // where browser TLS egress is blocked (see PORTING.md "Verification").
      // Empty in normal builds — the app talks to https://<server> directly.
      __ELK_API_PROXY__: JSON.stringify(process.env.ELK_API_PROXY ?? ''),
    },
  },
  plugins: [
    pluginQRCode({
      schema(url) {
        return `${url}?fullscreen=true`;
      },
    }),
    pluginVueLynx({
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
