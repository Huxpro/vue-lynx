import { defineConfig } from 'vitest/config';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  define: {
    __DEV__: 'true',
    __VUE_LYNX_AUTO_PIXEL_UNIT__: 'true',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, 'test-setup.ts')],
    passWithNoTests: true,
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    alias: [
      {
        find: 'vue-lynx-testing-library',
        replacement: path.resolve(
          __dirname,
          '../../testing-library/src/index.ts',
        ),
      },
      {
        find: 'vue-lynx/entry-background',
        replacement: path.resolve(
          __dirname,
          '../../runtime/src/entry-background.ts',
        ),
      },
      {
        find: 'vue-lynx/main-thread',
        replacement: path.resolve(
          __dirname,
          '../../main-thread/src/entry-main.ts',
        ),
      },
      {
        find: 'vue-lynx/internal/ops',
        replacement: path.resolve(
          __dirname,
          '../../internal/src/ops.ts',
        ),
      },
      {
        find: /^vue-lynx$/,
        replacement: path.resolve(
          __dirname,
          '../../runtime/src/index.ts',
        ),
      },
    ],
  },
});
