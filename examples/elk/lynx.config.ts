import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginTailwindCSS } from 'rsbuild-plugin-tailwindcss';
import { pluginVueLynx } from 'vue-lynx/plugin';

const exampleDir = path.dirname(fileURLToPath(import.meta.url));
const exampleName = path.basename(exampleDir);

export default defineConfig({
  environments: {
    lynx: {},
    web: {},
  },
  output: {
    assetPrefix: `https://vue.lynxjs.org/examples/${exampleName}/dist/`,
  },
  resolve: {
    alias: {
      // change-case@5 uses Unicode property escapes, which PrimJS cannot
      // parse. Mastodon's action and JSON field names are ASCII, so route
      // its camelCase/snakeCase imports through the equivalent adapter.
      'change-case': path.resolve(exampleDir, 'src/change-case.ts'),
    },
  },
  source: {
    entry: {
      main: './src/index.ts',
    },
    // RuntimeWrapperWebpackPlugin injects native fetch separately; the
    // first-import polyfills synchronize it with globalThis. Rewrite the
    // remaining web constructors that masto references as free identifiers.
    define: {
      Request: 'globalThis.Request',
      Response: 'globalThis.Response',
      Headers: 'globalThis.Headers',
      AbortSignal: 'globalThis.AbortSignal',
      AbortController: 'globalThis.AbortController',
      URLSearchParams: 'globalThis.URLSearchParams',
      FormData: 'globalThis.FormData',
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
