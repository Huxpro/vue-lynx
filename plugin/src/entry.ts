// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RsbuildPluginAPI } from '@rsbuild/core';

import { RuntimeWrapperWebpackPlugin } from '@lynx-js/runtime-wrapper-webpack-plugin';
import {
  LynxEncodePlugin,
  LynxTemplatePlugin,
  WebEncodePlugin,
} from '@lynx-js/template-webpack-plugin';

import { LAYERS } from './layers.js';

const PLUGIN_TEMPLATE = 'lynx:vue-template';
const PLUGIN_RUNTIME_WRAPPER = 'lynx:vue-runtime-wrapper';
const PLUGIN_ENCODE = 'lynx:vue-encode';
const PLUGIN_MARK_MAIN_THREAD = 'lynx:vue-mark-main-thread';
// worklet-runtime is now bundled directly into main-thread.js (no separate chunk).
const PLUGIN_WEB_ENCODE = 'lynx:vue-web-encode';

/** Minimal typing for a webpack Chunk (avoids importing @rspack/core). */
interface WebpackChunk {
  getEntryOptions(): { layer?: string } | undefined;
}

/** Minimal typing for the webpack Compilation object (avoids importing @rspack/core). */
interface WebpackCompilation {
  hooks: {
    processAssets: {
      tap(
        options: { name: string; stage: number },
        callback: () => void,
      ): void;
    };
    additionalTreeRuntimeRequirements: {
      tap(
        name: string,
        callback: (chunk: WebpackChunk, set: Set<string>) => void,
      ): void;
    };
  };
  getAsset(
    filename: string,
  ): { source: unknown; info: Record<string, unknown> } | undefined;
  updateAsset(
    filename: string,
    source: unknown,
    info: Record<string, unknown>,
  ): void;
}

/** Minimal typing for the webpack Compiler object (avoids importing @rspack/core). */
interface WebpackCompiler {
  webpack: {
    Compilation: {
      PROCESS_ASSETS_STAGE_ADDITIONAL: number;
      PROCESS_ASSETS_STAGE_PRE_PROCESS: number;
    };
    RuntimeGlobals: { startup: string; require: string };
    sources: { RawSource: new(source: string) => unknown };
  };
  hooks: {
    thisCompilation: {
      tap(
        name: string,
        callback: (compilation: WebpackCompilation) => void,
      ): void;
    };
  };
}

/**
 * VueMarkMainThreadPlugin does two things:
 *
 * 1. Forces webpack to generate startup code for MT entry chunks.
 *    WHY: rspeedy sets `chunkLoading: 'lynx'` globally. The Lynx
 *    `StartupChunkDependenciesPlugin` only adds `RuntimeGlobals.startup` when
 *    `hasChunkEntryDependentChunks(chunk)` is true. For MT entries without
 *    async chunk dependencies this is false, so webpack never generates the
 *    `__webpack_require__(entryModuleId)` startup call. Module factories
 *    (including entry-main.ts which sets globalThis.renderPage etc.) never
 *    execute. We fix this by explicitly requesting `RuntimeGlobals.startup`
 *    for any chunk whose entry layer is MAIN_THREAD.
 *
 * 2. Marks webpack-generated main-thread assets with `lynx:main-thread: true`
 *    so that LynxTemplatePlugin routes them to lepusCode.root (Lepus bytecode).
 */
class VueMarkMainThreadPlugin {
  constructor(private readonly mainThreadFilenames: string[]) {}

  apply(compiler: WebpackCompiler): void {
    const { RuntimeGlobals } = compiler.webpack;

    compiler.hooks.thisCompilation.tap(
      PLUGIN_MARK_MAIN_THREAD,
      (compilation) => {
        // Force startup code generation for MT entry chunks so that
        // entry module factories actually execute.
        // We also request RuntimeGlobals.require so that webpack includes
        // the __webpack_require__ runtime definition. Without it, rspack
        // may optimize away the runtime when no modules reference
        // publicPath, leaving bare __webpack_require__ references in the
        // generated startup code.
        compilation.hooks.additionalTreeRuntimeRequirements.tap(
          PLUGIN_MARK_MAIN_THREAD,
          (chunk, set) => {
            const entryOptions = chunk.getEntryOptions();
            if (entryOptions?.layer === LAYERS.MAIN_THREAD) {
              set.add(RuntimeGlobals.startup);
              set.add(RuntimeGlobals.require);
            }
          },
        );

        // Mark MT assets with lynx:main-thread: true for LynxTemplatePlugin.
        compilation.hooks.processAssets.tap(
          {
            name: PLUGIN_MARK_MAIN_THREAD,
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          },
          () => {
            for (const filename of this.mainThreadFilenames) {
              const asset = compilation.getAsset(filename);
              if (asset) {
                compilation.updateAsset(
                  filename,
                  asset.source,
                  {
                    ...asset.info,
                    'lynx:main-thread': true,
                  },
                );
              }
            }
          },
        );
      },
    );
  }
}


const PLUGIN_CSS_CONFIG = 'lynx:vue-css-config';

/**
 * VueCSSConfigPlugin injects Lynx engine compiler options (like
 * enableCSSInlineVariables) into the encoded template via the
 * LynxTemplatePlugin beforeEncode hook.
 */
class VueCSSConfigPlugin {
  constructor(
    private readonly compilerOptions: Record<string, unknown>,
  ) {}

  apply(compiler: WebpackCompiler): void {
    compiler.hooks.thisCompilation.tap(
      PLUGIN_CSS_CONFIG,
      (compilation) => {
        const hooks = LynxTemplatePlugin.getLynxTemplatePluginHooks(
          // @ts-expect-error Rspack x Webpack compilation type mismatch
          compilation,
        ) as {
          beforeEncode: {
            tap(
              name: string,
              fn: (args: Record<string, unknown>) => Record<string, unknown>,
            ): void;
          };
        };
        hooks.beforeEncode.tap(PLUGIN_CSS_CONFIG, (args) => {
          const encodeData = args['encodeData'] as {
            compilerOptions: Record<string, unknown>;
          };
          Object.assign(encodeData.compilerOptions, this.compilerOptions);
          return args;
        });
      },
    );
  }
}

const DEFAULT_INTERMEDIATE = '.rspeedy';

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// vue-lynx package root — the plugin lives at <pkgRoot>/plugin/dist/,
// so we resolve two levels up from _dirname. This avoids relying on
// a self-referencing node_modules symlink (pnpm doesn't create one
// for the workspace root package).
const vueLynxRoot = path.resolve(_dirname, '../..');

export interface ApplyEntryOptions {
  enableCSSSelector?: boolean;
  enableCSSInheritance?: boolean;
  customCSSInheritanceList?: string[];
  enableCSSInlineVariables?: boolean;
  debugInfoOutside?: boolean;
}

export function applyEntry(
  api: RsbuildPluginAPI,
  opts: ApplyEntryOptions = {},
): void {
  // ------------------------------------------------------------------
  // Bidirectional plugin communication (matching pluginReactLynx pattern)
  // ------------------------------------------------------------------

  // Expose LynxTemplatePlugin hooks so pluginLynxConfig and other plugins
  // can interact with the Lynx template pipeline.
  const sLynxTemplatePlugin = Symbol.for('LynxTemplatePlugin');
  api.expose(sLynxTemplatePlugin, {
    LynxTemplatePlugin: {
      getLynxTemplatePluginHooks:
        LynxTemplatePlugin.getLynxTemplatePluginHooks.bind(
          LynxTemplatePlugin,
        ),
    },
  });

  // Read Lynx engine config from pluginLynxConfig if present.
  // pluginLynxConfig exposes config via Symbol.for('lynx.config'), and we
  // merge matching keys into our resolved options (lynx.config takes priority).
  const sLynxConfig = Symbol.for('lynx.config');
  const exposedConfig = api.useExposed(sLynxConfig) as
    | { config: Record<string, unknown> }
    | undefined;
  if (exposedConfig) {
    const configKeys: Array<keyof ApplyEntryOptions> = [
      'enableCSSSelector',
      'enableCSSInheritance',
      'customCSSInheritanceList',
      'enableCSSInlineVariables',
    ];
    for (const key of configKeys) {
      if (Object.hasOwn(exposedConfig.config, key)) {
        (opts as Record<string, unknown>)[key] = exposedConfig.config[key];
      }
    }
  }

  // Default to all-in-one chunk splitting to avoid async chunks that break
  // Lynx's single-file bundle requirement (same as React plugin behaviour).
  api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
    const userConfig = api.getRsbuildConfig('original');
    if (!userConfig.performance?.chunkSplit?.strategy) {
      return mergeRsbuildConfig(config, {
        performance: { chunkSplit: { strategy: 'all-in-one' } },
      });
    }
    return config;
  });

  // Worklet loader (BG layer): runs SWC JS-target transform on BG-layer
  // .js/.ts/.vue files to replace 'main thread' functions with context objects.
  api.modifyBundlerChain((chain, { environment }) => {
    const isLynx = environment.name === 'lynx'
      || environment.name.startsWith('lynx-');
    const isWeb = environment.name === 'web'
      || environment.name.startsWith('web-');
    if (!isLynx && !isWeb) return;

    chain.module
      .rule('vue:worklet')
      .issuerLayer(LAYERS.BACKGROUND)
      .test(/\.(?:[cm]?[jt]sx?|vue)$/)
      .exclude.add(/node_modules/).end()
      .use('worklet-loader')
      .loader(path.resolve(_dirname, './loaders/worklet-loader'))
      .end();
  });

  // MT-layer loaders: process user code to extract LEPUS worklet registrations.
  // Vue SFC files → extract <script> content → LEPUS transform.
  // JS/TS files → LEPUS transform directly.
  //
  // IMPORTANT: The bootstrap packages (vue-lynx/main-thread and its deps)
  // must be excluded — they set up globalThis.renderPage/processData/etc. and
  // must execute as-is. In pnpm workspaces, these resolve to real paths under
  // packages/vue/ (not node_modules), so we exclude them explicitly.
  api.modifyBundlerChain((chain, { environment }) => {
    const isLynx = environment.name === 'lynx'
      || environment.name.startsWith('lynx-');
    const isWeb = environment.name === 'web'
      || environment.name.startsWith('web-');
    if (!isLynx && !isWeb) return;

    // Resolve bootstrap package directories to exclude from MT loaders.
    // entry-main.ts imports from vue-lynx/main-thread (same package)
    // and vue-lynx/internal/ops (ops enum). Both must pass through as-is.
    // These are sibling directories within the vue-lynx package root.
    const pkgRoot = vueLynxRoot;
    const mainThreadPkgDir = path.resolve(pkgRoot, 'main-thread');
    const vueInternalPkgDir: string | undefined = path.resolve(pkgRoot, 'internal');

    // Vue SFC on MT: vue-loader processes .vue on all layers (no issuerLayer
    // constraint). This enforce:'post' rule runs worklet-loader-mt AFTER
    // vue-loader, so it sees vue-loader's connector output (imports to
    // template/script/style sub-modules). extractLocalImports filters out
    // template/style imports, keeping only the script sub-module.
    // The script sub-module then matches the vue:worklet-mt rule below
    // (via .ts match resource extension), ensuring both BG and MT worklet
    // transforms see the same @vue/compiler-sfc compiled script content,
    // producing matching _wkltId hashes.
    chain.module
      .rule('vue:mt-sfc')
      .enforce('post')
      .issuerLayer(LAYERS.MAIN_THREAD)
      .test(/\.vue$/)
      .use('worklet-loader-mt')
      .loader(path.resolve(_dirname, './loaders/worklet-loader-mt'))
      .end();

    // JS/TS on MT: LEPUS worklet transform (extract registerWorkletInternal calls).
    // Shared-runtime modules (imported with `{ runtime: 'shared' }`) are detected
    // inside the loader itself and passed through unchanged — see worklet-loader-mt.
    const workletMtExclude = chain.module
      .rule('vue:worklet-mt')
      .issuerLayer(LAYERS.MAIN_THREAD)
      .test(/\.[cm]?[jt]sx?$/)
      .exclude
      .add(/node_modules/)
      .add(mainThreadPkgDir);
    if (vueInternalPkgDir) {
      workletMtExclude.add(vueInternalPkgDir);
    }
    workletMtExclude.end()
      .use('worklet-loader-mt')
      .loader(path.resolve(_dirname, './loaders/worklet-loader-mt'))
      .end();
  });

  api.modifyBundlerChain((chain, { environment, isDev, isProd }) => {
    const isRspeedy = api.context.callerName === 'rspeedy';
    if (!isRspeedy) return;

    const isLynx = environment.name === 'lynx'
      || environment.name.startsWith('lynx-');
    const isWeb = environment.name === 'web'
      || environment.name.startsWith('web-');

    // HMR / Live Reload flags (same logic as React plugin)
    const { hmr, liveReload } = environment.config.dev ?? {};
    const enabledHMR = isDev && !isWeb && hmr !== false;
    const enabledLiveReload = isDev && !isWeb && liveReload !== false;

    const entries = chain.entryPoints.entries() ?? {};

    chain.entryPoints.clear();

    // Collect all main-thread filenames to mark with lynx:main-thread
    const mainThreadFilenames: string[] = [];

    // Resolve worklet-runtime from @lynx-js/react (reuse existing impl).
    // Bundled directly into main-thread.js as an entry import.
    const workletRuntimePath = require.resolve(
      '@lynx-js/react/worklet-runtime',
    );

    for (const [entryName, entryPoint] of Object.entries(entries)) {
      // Collect user imports from the original entry
      const imports: string[] = [];
      for (const val of entryPoint.values()) {
        if (typeof val === 'string') {
          imports.push(val);
        } else if (typeof val === 'object' && val !== null && 'import' in val) {
          const imp = (val as { import?: string | string[] }).import;
          if (Array.isArray(imp)) imports.push(...imp);
          else if (imp) imports.push(imp);
        }
      }

      // ----------------------------------------------------------------
      // Filenames
      // ----------------------------------------------------------------
      const intermediate = isLynx ? DEFAULT_INTERMEDIATE : '';
      const mainThreadEntry = `${entryName}__main-thread`;
      const mainThreadName = path.posix.join(
        intermediate,
        `${entryName}/main-thread.js`,
      );
      const backgroundName = path.posix.join(
        intermediate,
        `${entryName}/background${isProd ? '.[contenthash:8]' : ''}.js`,
      );

      if (isLynx || isWeb) {
        mainThreadFilenames.push(mainThreadName);
      }

      // ----------------------------------------------------------------
      // Main Thread bundle – PAPI bootstrap + user code (worklet registrations)
      // ----------------------------------------------------------------
      // Both BG and MT layers import the same user code. On the MT layer,
      // vue-sfc-script-extractor + worklet-loader-mt strip everything except
      // registerWorkletInternal() calls. webpack's dependency graph provides
      // natural per-entry isolation (each entry sees only its own worklets).
      chain
        .entry(mainThreadEntry)
        .add({
          layer: LAYERS.MAIN_THREAD,
          import: [path.resolve(vueLynxRoot, 'main-thread/dist/entry-main.js'), workletRuntimePath, ...imports],
          filename: mainThreadName,
        })
        .when(enabledHMR, entry => {
          entry.prepend({
            layer: LAYERS.MAIN_THREAD,
            import: require.resolve(
              '@lynx-js/css-extract-webpack-plugin/runtime/hotModuleReplacement.lepus.cjs',
            ),
          });
        })
        .end();

      // ----------------------------------------------------------------
      // Background bundle – Vue runtime + user app
      // ----------------------------------------------------------------
      chain
        .entry(entryName)
        .add({
          layer: LAYERS.BACKGROUND,
          import: imports,
          filename: backgroundName,
        })
        .prepend({
          layer: LAYERS.BACKGROUND,
          import: path.resolve(vueLynxRoot, 'runtime/dist/entry-background.js'),
        })
        .when(enabledHMR, entry => {
          entry.prepend({
            layer: LAYERS.BACKGROUND,
            import: '@rspack/core/hot/dev-server',
          });
        })
        .when(enabledHMR || enabledLiveReload, entry => {
          entry.prepend({
            layer: LAYERS.BACKGROUND,
            import: '@lynx-js/webpack-dev-transport/client',
          });
        })
        .end();

      // ----------------------------------------------------------------
      // LynxTemplatePlugin – packages both bundles into .lynx.bundle
      // ----------------------------------------------------------------
      if (isLynx || isWeb) {
        const templateFilename = (
          typeof environment.config.output.filename === 'object'
            ? (environment.config.output.filename as { bundle?: string })
              .bundle
            : environment.config.output.filename
        ) ?? '[name].[platform].bundle';

        chain
          .plugin(`${PLUGIN_TEMPLATE}-${entryName}`)
          .use(LynxTemplatePlugin, [
            {
              // Spread defaults first to satisfy all required fields
              ...LynxTemplatePlugin.defaultOptions,
              dsl: 'react_nodiff',
              chunks: [mainThreadEntry, entryName],
              filename: templateFilename
                .replaceAll('[name]', entryName)
                .replaceAll('[platform]', environment.name),
              intermediate: path.posix.join(intermediate, entryName),
              debugInfoOutside: opts.debugInfoOutside ?? true,
              enableCSSSelector: opts.enableCSSSelector ?? true,
              enableCSSInvalidation: opts.enableCSSSelector ?? true,
              enableCSSInheritance: opts.enableCSSInheritance ?? false,
              customCSSInheritanceList: opts.customCSSInheritanceList,
              enableRemoveCSSScope: true,
              enableNewGesture: false,
              removeDescendantSelectorScope: true,
              cssPlugins: [],
            },
          ])
          .end();
      }
    }

    // ------------------------------------------------------------------
    // VueMarkMainThreadPlugin – mark MT assets with lynx:main-thread: true
    // so LynxTemplatePlugin routes them to lepusCode.root (Lepus bytecode).
    // ------------------------------------------------------------------
    if ((isLynx || isWeb) && mainThreadFilenames.length > 0) {
      chain
        .plugin(PLUGIN_MARK_MAIN_THREAD)
        .use(VueMarkMainThreadPlugin, [mainThreadFilenames])
        .end();
    }

    // ------------------------------------------------------------------
    // VueCSSConfigPlugin – inject engine compiler options (e.g.
    // enableCSSInlineVariables) that are not LynxTemplatePlugin options
    // but need to be set in the encoded template's compilerOptions.
    // ------------------------------------------------------------------
    if (isLynx) {
      const cssConfigOptions: Record<string, unknown> = {};
      if (opts.enableCSSInlineVariables) {
        cssConfigOptions['enableCSSInlineVariables'] = true;
      }
      if (Object.keys(cssConfigOptions).length > 0) {
        chain
          .plugin(PLUGIN_CSS_CONFIG)
          .use(VueCSSConfigPlugin, [cssConfigOptions])
          .end();
      }
    }

    // ------------------------------------------------------------------
    // RuntimeWrapperWebpackPlugin – wrap background.js, not main-thread.js
    // ------------------------------------------------------------------
    if (isLynx) {
      chain
        .plugin(PLUGIN_RUNTIME_WRAPPER)
        .use(RuntimeWrapperWebpackPlugin, [
          {
            // Exclude main-thread.js (and main-thread.[hash].js) from wrapping
            test: /^(?!.*main-thread(?:\.[A-Fa-f0-9]*)?\.js$).*\.js$/,
          },
        ])
        .end()
        .plugin(PLUGIN_ENCODE)
        .use(LynxEncodePlugin, [{}])
        .end();
    }

    if (isWeb) {
      chain
        .plugin(PLUGIN_WEB_ENCODE)
        .use(WebEncodePlugin, [])
        .end();
    }

    // Disable IIFE wrapping – Lynx handles module scoping itself
    chain.output.set('iife', false);
  });
}
