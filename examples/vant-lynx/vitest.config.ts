import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));
const vueLynxRoot = path.resolve(root, '../../packages/vue-lynx');
const testingLibraryRoot = path.resolve(root, '../../packages/testing-library');

export default defineConfig({
  plugins: [vue()],
  define: {
    __DEV__: 'true',
    __VUE_LYNX_AUTO_PIXEL_UNIT__: 'true',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.join(testingLibraryRoot, 'setup.ts')],
    alias: [
      {
        find: 'vue-lynx-testing-library',
        replacement: path.join(testingLibraryRoot, 'src/index.ts'),
      },
      {
        find: 'vue-lynx/entry-background',
        replacement: path.join(
          vueLynxRoot,
          'runtime/src/entry-background.ts',
        ),
      },
      {
        find: 'vue-lynx/main-thread',
        replacement: path.join(vueLynxRoot, 'main-thread/src/entry-main.ts'),
      },
      {
        find: 'vue-lynx/internal/ops',
        replacement: path.join(vueLynxRoot, 'internal/src/ops.ts'),
      },
      {
        find: /^vue-lynx$/,
        replacement: path.join(vueLynxRoot, 'runtime/src/index.ts'),
      },
      {
        find: /^vue$/,
        replacement: path.join(vueLynxRoot, 'runtime/src/index.ts'),
      },
    ],
  },
});
