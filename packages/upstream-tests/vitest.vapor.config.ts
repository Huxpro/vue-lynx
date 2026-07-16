import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { init, parse } from 'es-module-lexer';
import MagicString from 'magic-string';
import { defineConfig } from 'vitest/config';

interface VaporSkiplist {
  skip_list: string[];
  _skip_reasons: Record<string, string>;
  skip_suites: string[];
  _skip_suite_reasons: Record<string, string>;
  excluded_files: string[];
  _excluded_file_reasons: Record<string, string>;
}

const require = createRequire(import.meta.url);
const testDir = path.resolve(
  __dirname,
  'core/packages/runtime-vapor/__tests__',
);
const testDirVite = normalizeVitePath(testDir);
const bridgePath = normalizeVitePath(
  path.resolve(__dirname, 'src/lynx-runtime-vapor-bridge.ts'),
);
const rawRuntimeVaporPath = normalizeVitePath(
  esm('@vue/runtime-vapor', 'runtime-vapor.esm-bundler.js'),
);
const includedFiles = [
  'apiCreateDynamicComponent.spec.ts',
  'apiCreateFragment.spec.ts',
  'apiCreateSelector.spec.ts',
  'apiCreateVaporApp.spec.ts',
  'apiDefineAsyncComponent.spec.ts',
  'apiExpose.spec.ts',
  'apiInject.spec.ts',
  'apiLifecycle.spec.ts',
  'apiSetupContext.spec.ts',
  'apiSetupHelpers.spec.ts',
  'apiWatch.spec.ts',
  'block.spec.ts',
  'componentAttrs.spec.ts',
  'componentEmits.spec.ts',
  'componentProps.spec.ts',
  'component.spec.ts',
  'componentSlots.spec.ts',
  'components/KeepAlive.spec.ts',
  'directives/customDirective.spec.ts',
  'directives/vCloak.spec.ts',
  'directives/vShow.spec.ts',
  'dom/template.spec.ts',
  'dom/templateRef.spec.ts',
  'errorHandling.spec.ts',
  'for.spec.ts',
  'helpers/setKey.spec.ts',
  'helpers/useCssModule.spec.ts',
  'helpers/useId.spec.ts',
  'if.spec.ts',
  'renderEffect.spec.ts',
];
const TEST_DECLARATION =
  /\b((?:it|test)(?:\.only)?)\s*\(\s*(['"`])((?:(?!\2).)*)\2/g;
const SUITE_DECLARATION =
  /\b(describe(?:\.only)?)\s*\(\s*(['"`])((?:(?!\2).)*)\2/g;

function esm(packageName: string, file: string): string {
  return path.join(
    path.dirname(require.resolve(`${packageName}/package.json`)),
    'dist',
    file,
  );
}

function toPosix(file: string): string {
  return file.split(path.sep).join('/');
}

function normalizeVitePath(file: string): string {
  return file.replaceAll('\\', '/');
}

function relativeTestFile(id: string): string | undefined {
  const cleanId = normalizeVitePath(id.split('?', 1)[0]!);
  const prefix = `${testDirVite}/`;
  return cleanId.startsWith(prefix) ? cleanId.slice(prefix.length) : undefined;
}

function discoverSpecFiles(directory: string): string[] {
  const files: string[] = [];
  const visit = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
        files.push(toPosix(path.relative(directory, absolute)));
      }
    }
  };
  visit(directory);
  return files.sort();
}

function assertStringArray(
  value: unknown,
  label: string,
): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`[vapor skiplist] ${label} must be a string array`);
  }
}

function assertNoDuplicates(items: string[], label: string): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    if (seen.has(item)) duplicates.add(item);
    seen.add(item);
  }
  if (duplicates.size > 0) {
    throw new Error(
      `[vapor skiplist] duplicate ${label}: ${[...duplicates].join(', ')}`,
    );
  }
}

function assertReasonMap(
  items: string[],
  reasons: unknown,
  label: string,
): asserts reasons is Record<string, string> {
  if (!reasons || typeof reasons !== 'object' || Array.isArray(reasons)) {
    throw new Error(`[vapor skiplist] ${label} must be an object`);
  }
  const reasonMap = reasons as Record<string, unknown>;
  const itemSet = new Set(items);
  const reasonKeys = Object.keys(reasonMap);
  const missing = items.filter((item) => !(item in reasonMap));
  const orphaned = reasonKeys.filter((key) => !itemSet.has(key));
  const blank = reasonKeys.filter(
    (key) =>
      typeof reasonMap[key] !== 'string'
      || (reasonMap[key] as string).trim() === '',
  );
  if (missing.length > 0 || orphaned.length > 0 || blank.length > 0) {
    throw new Error(
      `[vapor skiplist] invalid ${label}; missing=[${missing.join(', ')}], `
        + `orphaned=[${orphaned.join(', ')}], blank=[${blank.join(', ')}]`,
    );
  }
}

function assertCanonicalFiles(files: string[], label: string): void {
  for (const file of files) {
    if (
      file === ''
      || file !== path.posix.normalize(file)
      || path.posix.isAbsolute(file)
      || file.startsWith('../')
      || file.includes('\\')
    ) {
      throw new Error(
        `[vapor skiplist] ${label} entry is not a canonical POSIX-relative path: ${file}`,
      );
    }
  }
}

function staticTestTitles(source: string): string[] {
  const titles: string[] = [];
  for (const match of source.matchAll(TEST_DECLARATION)) titles.push(match[3]!);
  return titles;
}

function staticSuiteTitles(source: string): string[] {
  const titles: string[] = [];
  for (const match of source.matchAll(SUITE_DECLARATION)) titles.push(match[3]!);
  return titles;
}

function loadAndValidateSkiplist(): {
  skiplist: VaporSkiplist;
  skipsByFile: Map<string, Set<string>>;
  skippedSuitesByFile: Map<string, Set<string>>;
} {
  const skiplistPath = path.resolve(__dirname, 'skiplist-vapor.json');
  const parsed = JSON.parse(fs.readFileSync(skiplistPath, 'utf8')) as Partial<
    VaporSkiplist
  >;

  assertStringArray(parsed.skip_list, 'skip_list');
  assertStringArray(parsed.skip_suites, 'skip_suites');
  assertStringArray(parsed.excluded_files, 'excluded_files');
  assertNoDuplicates(parsed.skip_list, 'skip_list entries');
  assertNoDuplicates(parsed.skip_suites, 'skip_suites entries');
  assertNoDuplicates(parsed.excluded_files, 'excluded_files entries');
  assertNoDuplicates(includedFiles, 'included files');
  assertReasonMap(parsed.skip_list, parsed._skip_reasons, '_skip_reasons');
  assertReasonMap(
    parsed.skip_suites,
    parsed._skip_suite_reasons,
    '_skip_suite_reasons',
  );
  assertReasonMap(
    parsed.excluded_files,
    parsed._excluded_file_reasons,
    '_excluded_file_reasons',
  );
  assertCanonicalFiles(includedFiles, 'included file');
  assertCanonicalFiles(parsed.excluded_files, 'excluded file');

  const includedSet = new Set(includedFiles);
  const excludedSet = new Set(parsed.excluded_files);
  const overlap = includedFiles.filter((file) => excludedSet.has(file));
  if (overlap.length > 0) {
    throw new Error(
      `[vapor skiplist] files cannot be both included and excluded: ${overlap.join(', ')}`,
    );
  }

  const actualFiles = discoverSpecFiles(testDir);
  const actualSet = new Set(actualFiles);
  const classified = new Set([...includedFiles, ...parsed.excluded_files]);
  const unclassified = actualFiles.filter((file) => !classified.has(file));
  const nonexistent = [...classified]
    .filter((file) => !actualSet.has(file))
    .sort();
  if (unclassified.length > 0 || nonexistent.length > 0) {
    throw new Error(
      '[vapor skiplist] runtime-vapor spec inventory is not closed; '
        + `unclassified=[${unclassified.join(', ')}], `
        + `nonexistent=[${nonexistent.join(', ')}]`,
    );
  }

  const skipsByFile = new Map<string, Set<string>>();
  for (const scopedKey of parsed.skip_list) {
    const separator = scopedKey.indexOf('::');
    const file = scopedKey.slice(0, separator);
    const title = scopedKey.slice(separator + 2);
    if (separator <= 0 || title.trim() === '') {
      throw new Error(
        `[vapor skiplist] skip key must use "file::test title": ${scopedKey}`,
      );
    }
    assertCanonicalFiles([file], 'skip key file');
    if (!includedSet.has(file)) {
      throw new Error(
        `[vapor skiplist] skipped test belongs to a non-included file: ${scopedKey}`,
      );
    }

    const source = fs.readFileSync(path.join(testDir, file), 'utf8');
    const matchCount = staticTestTitles(source).filter(
      (candidate) => candidate === title,
    ).length;
    if (matchCount !== 1) {
      throw new Error(
        `[vapor skiplist] ${scopedKey} must match exactly one static it/test declaration; found ${matchCount}`,
      );
    }
    const titles = skipsByFile.get(file) ?? new Set<string>();
    titles.add(title);
    skipsByFile.set(file, titles);
  }

  const skippedSuitesByFile = new Map<string, Set<string>>();
  for (const scopedKey of parsed.skip_suites) {
    const separator = scopedKey.indexOf('::');
    const file = scopedKey.slice(0, separator);
    const title = scopedKey.slice(separator + 2);
    if (separator <= 0 || title.trim() === '') {
      throw new Error(
        `[vapor skiplist] suite key must use "file::suite title": ${scopedKey}`,
      );
    }
    assertCanonicalFiles([file], 'suite key file');
    if (!includedSet.has(file)) {
      throw new Error(
        `[vapor skiplist] skipped suite belongs to a non-included file: ${scopedKey}`,
      );
    }
    const source = fs.readFileSync(path.join(testDir, file), 'utf8');
    const matchCount = staticSuiteTitles(source).filter(
      (candidate) => candidate === title,
    ).length;
    if (matchCount !== 1) {
      throw new Error(
        `[vapor skiplist] ${scopedKey} must match exactly one static describe declaration; found ${matchCount}`,
      );
    }
    const titles = skippedSuitesByFile.get(file) ?? new Set<string>();
    titles.add(title);
    skippedSuitesByFile.set(file, titles);
  }

  return {
    skiplist: parsed as VaporSkiplist,
    skipsByFile,
    skippedSuitesByFile,
  };
}

const { skipsByFile, skippedSuitesByFile } = loadAndValidateSkiplist();

function skiplistPlugin() {
  return {
    name: 'vue-lynx-runtime-vapor-skiplist',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      const relative = relativeTestFile(id);
      if (!relative) return;
      const titles = skipsByFile.get(relative);
      const suites = skippedSuitesByFile.get(relative);
      if ((!titles || titles.size === 0) && (!suites || suites.size === 0)) {
        return;
      }

      let result = code;
      if (titles?.size) {
        result = result.replace(
          TEST_DECLARATION,
          (match, keyword: string, quote: string, title: string) => {
            if (!titles.has(title)) return match;
            const base = keyword.startsWith('test') ? 'test' : 'it';
            return `${base}.skip(${quote}${title}${quote}`;
          },
        );
      }
      if (suites?.size) {
        result = result.replace(
          SUITE_DECLARATION,
          (match, _keyword: string, quote: string, title: string) =>
            suites.has(title)
              ? `describe.skip(${quote}${title}${quote}`
              : match,
        );
      }
      return result === code ? undefined : result;
    },
  };
}

function rewriteRuntimeVaporImports() {
  return {
    name: 'vue-lynx-rewrite-runtime-vapor-imports',
    enforce: 'pre' as const,
    async transform(code: string, id: string) {
      if (!relativeTestFile(id)) return;
      await init;
      const [imports] = parse(code);
      let output: MagicString | undefined;
      for (const item of imports) {
        const specifier = item.n;
        if (
          specifier !== 'vue'
          && specifier !== '@vue/runtime-vapor'
          && !/^(?:\.\.\/)+src(?:\/.*)?$/.test(specifier ?? '')
        ) {
          continue;
        }
        output ??= new MagicString(code);
        output.overwrite(item.s, item.e, bridgePath);
      }
      return output?.toString();
    },
  };
}

/**
 * A few upstream unit specs intentionally import private helpers from
 * runtime-vapor/src. Append test-only exports to the already-installed ESM
 * bundle so those helpers and the public API keep sharing one runtime
 * singleton. A second source build here would duplicate currentInstance,
 * scheduler, and hydration state.
 */
function exposeRuntimeVaporTestInternals() {
  return {
    name: 'vue-lynx-expose-runtime-vapor-test-internals',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      const cleanId = normalizeVitePath(id.split('?', 1)[0]!);
      if (cleanId !== rawRuntimeVaporPath) return;
      // Published bundles compile `__TEST__` away as false. Source-level
      // upstream tests compile it as true, suppressing this diagnostic for
      // deliberate standalone RenderEffect coverage. Restore that one test
      // build guard without changing any runtime behavior under test.
      const warningGuard = 'if (!!(process.env.NODE_ENV !== "production") && !this.subs && !isVaporComponent(instance)) warn("renderEffect called without active EffectScope or Vapor instance.");';
      const testCode = code.replace(warningGuard, `if (false) ${warningGuard.slice(warningGuard.indexOf('warn('))}`);
      if (testCode === code) {
        throw new Error(
          '[vapor harness] installed runtime-vapor no longer contains the expected RenderEffect __TEST__ warning guard',
        );
      }
      return `${testCode}\nexport { RenderEffect, SlotFragment, VaporComponentInstance, applyFallthroughProps, currentInstance, currentSlotBoundary, currentSlotOwner, enableSuspense, getCurrentSlotEndAnchor, hydrateDynamicFragmentAnchor, hydrateNode, insertFragment, insertNode, isApplyingFallthroughProps, isHydratingSlotFallbackActive, isHydrationAnchor, isValidBlock, isValidSlot, markSlotResolutionDirty, normalizeBlock, parentSuspense, recheckSlotResolution, removeFragment, removeNode, resolveDynamicProps, setCurrentHydrationNode, setCurrentSlotOwner, setDynamicProp, setIsHydratingEnabled, setParentSuspense, trackSlotBoundaryDirtying, withHydratingSlotBoundary, withHydratingSlotFallbackActive, withSlotBoundary };\n`;
    },
  };
}

export default defineConfig({
  plugins: [
    exposeRuntimeVaporTestInternals(),
    skiplistPlugin(),
    rewriteRuntimeVaporImports(),
  ],
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
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    __VUE_LYNX_AUTO_PIXEL_UNIT__: 'true',
    __COMPAT__: 'false',
    __VERSION__: '"3.6.0-beta.17"',
  },
  test: {
    fileParallelism: false,
    globals: true,
    maxWorkers: 1,
    environment: 'node',
    include: includedFiles.map((file) => path.join(testDir, file)),
    setupFiles: [
      path.resolve(__dirname, 'src/vapor-upstream-setup.ts'),
      path.resolve(__dirname, 'core/scripts/setup-vitest.ts'),
    ],
    alias: [
      {
        find: 'vue-lynx/internal/ops',
        replacement: path.resolve(
          __dirname,
          '../vue-lynx/internal/src/ops.ts',
        ),
      },
      {
        find: /^vue-lynx\/vapor$/,
        replacement: path.resolve(
          __dirname,
          '../vue-lynx/runtime/src/vapor-app.ts',
        ),
      },
      {
        find: /^@vue\/runtime-vapor\/raw$/,
        replacement: rawRuntimeVaporPath,
      },
      { find: /^vue$/, replacement: bridgePath },
      {
        find: /^@vue\/runtime-dom$/,
        replacement: esm('@vue/runtime-dom', 'runtime-dom.esm-bundler.js'),
      },
      {
        find: /^@vue\/runtime-core$/,
        replacement: esm('@vue/runtime-core', 'runtime-core.esm-bundler.js'),
      },
      {
        find: /^@vue\/reactivity$/,
        replacement: esm('@vue/reactivity', 'reactivity.esm-bundler.js'),
      },
      {
        find: /^@vue\/shared$/,
        replacement: esm('@vue/shared', 'shared.esm-bundler.js'),
      },
      {
        find: /^@vue\/server-renderer$/,
        replacement: path.resolve(__dirname, 'src/stubs/server-renderer.ts'),
      },
    ],
  },
});
