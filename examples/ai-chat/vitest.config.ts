import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'vue-lynx': 'vue',
    },
  },
  test: {
    environment: 'node',
    include: [path.join(root, 'tests/**/*.test.ts')],
  },
});
