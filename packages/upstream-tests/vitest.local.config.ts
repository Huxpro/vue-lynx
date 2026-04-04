/**
 * Vitest configuration for vue-lynx-specific (non-upstream) tests.
 *
 * These tests exercise vue-lynx runtime internals directly — they do NOT
 * require the upstream Vue core submodule or the full DOM bridge pipeline.
 * They only need the BG-thread renderer (ShadowElement + ops buffer).
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineConfig({
  define: {
    __DEV__: 'true',
    __TEST__: 'true',
    __BROWSER__: 'false',
    __GLOBAL__: 'false',
    __ESM_BUNDLER__: 'true',
    __ESM_BROWSER__: 'false',
    __CJS__: 'false',
    __SSR__: 'false',
    __FEATURE_OPTIONS_API__: 'true',
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    __VUE_LYNX_AUTO_PIXEL_UNIT__: 'true',
    __FEATURE_SUSPENSE__: 'true',
    __FEATURE_PROD_DEVTOOLS__: 'false',
    __FEATURE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    __COMPAT__: 'false',
    __VERSION__: '"3.5.12"',
  },
  test: {
    globals: true,
    include: [
      path.resolve(__dirname, 'src/**/*.spec.ts'),
    ],
    alias: [
      // vue-lynx/internal/ops → source
      {
        find: 'vue-lynx/internal/ops',
        replacement: path.resolve(__dirname, '../vue-lynx/internal/src/ops.ts'),
      },
      // vue-lynx → runtime source
      {
        find: /^vue-lynx$/,
        replacement: path.resolve(__dirname, '../vue-lynx/runtime/src/index.ts'),
      },
      // Ensure all @vue/* resolve to the same ESM bundle instance so
      // module-level state (currentRenderingInstance, scheduler, etc.) is
      // shared between vue-lynx and the test file.
      {
        find: '@vue/runtime-core',
        replacement: path.join(
          path.dirname(require.resolve('@vue/runtime-core/package.json')),
          'dist/runtime-core.esm-bundler.js',
        ),
      },
      {
        find: '@vue/reactivity',
        replacement: path.join(
          path.dirname(require.resolve('@vue/reactivity/package.json')),
          'dist/reactivity.esm-bundler.js',
        ),
      },
      {
        find: '@vue/shared',
        replacement: path.join(
          path.dirname(require.resolve('@vue/shared/package.json')),
          'dist/shared.esm-bundler.js',
        ),
      },
    ],
    setupFiles: [
      path.resolve(__dirname, 'src/local-test-setup.ts'),
    ],
    testTimeout: 10000,
  },
});
