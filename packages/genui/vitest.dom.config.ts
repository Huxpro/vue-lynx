import path from 'node:path';
import { defineConfig } from 'vitest/config';

// DOM-pipeline tests: render genui components through the full vue-lynx
// dual-thread pipeline (BG → ops → MT → PAPI → jsdom) using the
// testing-library setup from packages/testing-library.
export default defineConfig({
  define: {
    __DEV__: 'true',
    __VUE_LYNX_AUTO_PIXEL_UNIT__: 'true',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, '../testing-library/setup.ts')],
    include: ['test-dom/**/*.test.ts'],
    alias: [
      {
        find: 'vue-lynx-testing-library',
        replacement: path.resolve(
          __dirname,
          '../testing-library/src/index.ts',
        ),
      },
      {
        find: 'vue-lynx/entry-background',
        replacement: path.resolve(
          __dirname,
          '../vue-lynx/runtime/src/entry-background.ts',
        ),
      },
      {
        find: 'vue-lynx/main-thread',
        replacement: path.resolve(
          __dirname,
          '../vue-lynx/main-thread/src/entry-main.ts',
        ),
      },
      {
        find: 'vue-lynx/internal/ops',
        replacement: path.resolve(
          __dirname,
          '../vue-lynx/internal/src/ops.ts',
        ),
      },
      {
        find: /^vue-lynx$/,
        replacement: path.resolve(
          __dirname,
          '../vue-lynx/runtime/src/index.ts',
        ),
      },
    ],
  },
});
