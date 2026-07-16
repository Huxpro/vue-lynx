import { defineConfig } from 'vitest/config';
import path from 'node:path';
import fs from 'node:fs';

type SkipEntry = string | { name: string; reason: string };
interface Skiplist { skip_list: SkipEntry[]; }

const skiplistPath = path.resolve(__dirname, 'skiplist-vapor.json');
const skiplist: Skiplist = JSON.parse(fs.readFileSync(skiplistPath, 'utf-8'));
const skipSet = new Set(skiplist.skip_list.map((entry) => typeof entry === 'string' ? entry : entry.name));

function skiplistPlugin() {
  return {
    name: 'vue-upstream-vapor-skiplist',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('runtime-vapor/__tests__') || !id.endsWith('.spec.ts')) return;
      if (skipSet.size === 0) return;

      const pattern = /\b((?:describe|it|test)(?:\.only)?)\s*\(\s*(['"`])((?:(?!\2).)*)\2/g;
      let modified = false;
      const result = code.replace(pattern, (match, keyword, quote, testName) => {
        if (skipSet.has(testName)) {
          modified = true;
          const base = keyword.startsWith('describe') ? 'describe' : keyword.startsWith('test') ? 'test' : 'it';
          return `${base}.skip(${quote}${testName}${quote}`;
        }
        return match;
      });
      return modified ? result : undefined;
    },
  };
}

function rewriteRuntimeVaporImportsPlugin() {
  const vaporPath = path.resolve(__dirname, 'src/lynx-runtime-vapor-bridge.ts');
  return {
    name: 'vue-upstream-rewrite-runtime-vapor-imports',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.includes('runtime-vapor/__tests__')) return;
      let result = code;
      result = result.replace(/from\s+['"](\.\.\/)+src(?:\/[^'"]*)?['"]/g, `from '${vaporPath}'`);
      result = result.replace(/from\s+['"]@vue\/runtime-vapor['"]/g, `from '${vaporPath}'`);
      result = result.replace(/from\s+['"]vue['"]/g, `from '${vaporPath}'`);
      return result !== code ? result : undefined;
    },
  };
}

const testDir = 'core/packages/runtime-vapor/__tests__';
const includedTests = [
  'block',
].map((name) => `${testDir}/${name}.spec.ts`);

export default defineConfig({
  plugins: [skiplistPlugin(), rewriteRuntimeVaporImportsPlugin()],
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
    __FEATURE_SUSPENSE__: 'true',
    __FEATURE_PROD_DEVTOOLS__: 'false',
    __FEATURE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    __COMPAT__: 'false',
    __VUE_LYNX_AUTO_PIXEL_UNIT__: 'true',
    __VERSION__: '"3.6.0-beta.17"',
  },
  test: {
    globals: true,
    include: includedTests,
    setupFiles: [
      path.resolve(__dirname, 'src/vapor-setup.ts'),
      path.resolve(__dirname, 'core/scripts/setup-vitest.ts'),
    ],
    testTimeout: 10000,
    alias: [
      { find: '@vue/runtime-dom', replacement: path.resolve(__dirname, 'node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js') },
      { find: 'vue', replacement: path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm-bundler.js') },
      { find: 'vue-lynx/entry-background', replacement: path.resolve(__dirname, '../vue-lynx/runtime/src/entry-background.ts') },
      { find: 'vue-lynx/main-thread', replacement: path.resolve(__dirname, '../vue-lynx/main-thread/src/entry-main.ts') },
      { find: 'vue-lynx/internal/ops', replacement: path.resolve(__dirname, '../vue-lynx/internal/src/ops.ts') },
      { find: 'vue-lynx/vapor', replacement: path.resolve(__dirname, '../vue-lynx/runtime/src/vapor/index.ts') },
      { find: /^vue-lynx$/, replacement: path.resolve(__dirname, '../vue-lynx/runtime/src/index.ts') },
    ],
  },
});
