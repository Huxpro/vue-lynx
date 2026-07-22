// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * @packageDocumentation
 *
 * A rsbuild / rspeedy plugin that integrates Vue 3 with Lynx's dual-thread
 * architecture (Background Thread renderer + Main Thread PAPI executor).
 *
 * @example
 * ```ts
 * // lynx.config.ts
 * import { defineConfig } from '@lynx-js/rspeedy'
 * import { pluginVueLynx } from 'vue-lynx/plugin'
 *
 * export default defineConfig({
 *   plugins: [pluginVueLynx()],
 * })
 * ```
 */

import {
  IFR_PAINT_GLOBAL,
  TEMPLATE_STAGING_GLOBAL,
  normalizeIfrPaint,
  normalizeNaming,
  normalizeStaging,
} from 'vue-lynx/internal/matrix';
import {
  VAPOR_DOCUMENT_GLOBAL,
  VAPOR_DOM_CTOR_GLOBALS,
  VAPOR_SPARSE_NAMING_GLOBAL,
  VAPOR_WINDOW_GLOBAL,
} from 'vue-lynx/internal/ops';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RsbuildPlugin } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

import { applyCSS } from './css.js';
import {
  resolveElementTemplatesFlag,
  resolveVueLynxCompilerOptions,
} from './compiler-options.js';
import { applyEntry } from './entry.js';
import { LAYERS } from './layers.js';
import { VueLynxVaporTemplatePlugin } from './plugins/vapor-template-plugin.js';

const require = createRequire(import.meta.url);

const _pluginDirname = path.dirname(fileURLToPath(import.meta.url));
const _vueLynxRoot = path.resolve(_pluginDirname, '../..');

export { LAYERS };

/**
 * Options for {@link pluginVueLynx}.
 * @public
 */
export interface PluginVueLynxOptions {
  /**
   * Whether to enable Vue's Options API support.
   * Disabling it reduces bundle size.
   * @defaultValue true
   */
  optionsApi?: boolean;

  /**
   * Whether to enable Vue devtools in production builds.
   * @defaultValue false
   */
  prodDevtools?: boolean;

  /**
   * Whether to enable CSS selector support in the Lynx template.
   * When enabled, CSS from Vue `<style>` blocks and imported CSS files
   * will be compiled into the Lynx bundle and applied via class selectors.
   * @defaultValue true
   */
  enableCSSSelector?: boolean;

  /**
   * Whether to enable CSS inheritance in the Lynx engine.
   * When enabled, CSS property values (including CSS custom properties /
   * variables) cascade from parent elements to children, matching standard
   * CSS behavior. Required for design-token patterns where CSS variables
   * are set on a parent and consumed by descendants.
   * @defaultValue false
   */
  enableCSSInheritance?: boolean;

  /**
   * A list of additional CSS properties to inherit beyond the engine defaults.
   * Only effective when {@link enableCSSInheritance} is `true`.
   * @defaultValue undefined
   */
  customCSSInheritanceList?: string[];

  /**
   * Whether to enable CSS custom properties (variables) in inline styles.
   * When enabled, setting `--*` properties via `:style` bindings will be
   * recognized by the Lynx engine at runtime.
   * @defaultValue false
   */
  enableCSSInlineVariables?: boolean;

  /**
   * Whether to place debug info outside the template bundle.
   * Reduces template size in dev builds.
   * @defaultValue true
   */
  debugInfoOutside?: boolean;

  /**
   * Whether to automatically append `'px'` to numeric style values
   * (e.g. `fontSize: 24` → `'24px'`). Dimensionless properties like
   * `flex`, `opacity`, and `zIndex` are never converted.
   *
   * This convenience behavior is **deprecated** and will default to
   * `false` in the next major version. Prefer explicit string units
   * (e.g. `fontSize: '24px'`).
   *
   * @defaultValue true
   * @deprecated Will default to `false` in the next major version.
   */
  autoPixelUnit?: boolean;

  /**
   * Whether to enable element templates (compile-time template lowering).
   *
   * Eligible template subtrees — plain elements with compile-time-known
   * structure — are lowered into "element templates": the static skeleton
   * becomes a straight-line element-creation function executed on the main
   * thread via a single `INSTANTIATE_TEMPLATE` op, and interior dynamic
   * parts ("holes") receive deterministic ids updated through the ordinary
   * ops. This removes the per-static-node vdom/ops/interpreter cost on
   * first render and shrinks the cross-thread payload — for both the
   * normal pipeline and IFR (they compose).
   *
   * Structural features (components, v-if/v-for hosts, slots, refs,
   * directives, `<list>`) always stay on the normal vdom path; lowering is
   * purely an optimization and never changes rendering semantics.
   *
   * Defaults to the value of `enableIFR`: enabling IFR also enables element
   * templates unless this option is explicitly set to `false`. It can still
   * be enabled independently when IFR is off.
   *
   * @defaultValue enableIFR
   */
  enableElementTemplates?: boolean;

  /**
   * Axis B — **naming**: which slots of a materialized template subtree
   * receive cross-thread identities (see `vue-lynx/internal/matrix`).
   *
   * - `'block'` — the template block is the naming unit (one base id +
   *   offsets): Vapor `CLONE_TREE` becomes a **Tree-Template** when
   *   `__vlxAddressing` is present, with fail-safe fallback to node naming.
   * - `'node'` — every preorder slot is named independently: the Vapor
   *   **Named Tree** cell, used for A/B measurement in the graph-eng matrix.
   *
   * Legacy spellings `'sparse'` ≡ `'block'`, `'dense'` ≡ `'node'` are
   * accepted. Has no effect on VDOM (Code-Template naming is intrinsically
   * block-unit).
   *
   * @defaultValue 'block'
   */
  templateNaming?: 'node' | 'block' | 'dense' | 'sparse';

  /**
   * Axis A — **staging**: what form the compiled template residual exists
   * in on the main thread (see `vue-lynx/internal/matrix`).
   *
   * - `'ops'` (interp) — per-instruction stream, no template mechanism
   *   (VDOM default without element templates).
   * - `'tree'` (interp) — serialized tree + one generic MT interpreter
   *   (`REGISTER_TREE`/`CLONE_TREE`; Vapor default → Tree-Template).
   * - `'code'` (compiled) — per-template compiled `create()` closure, no
   *   interpreter (`INSTANTIATE_TEMPLATE` → Code-Template). Not
   *   implemented for Vapor (M3a optional) — falls back to `'tree'` with a
   *   warning.
   * - `'native'` (compiled) — host-resident **Engine-Template**: the MT
   *   executor routes instantiation through the `__CreateElementTemplate`
   *   PAPI family when the engine provides it, and falls back to
   *   interpretation (reported N/A/stub) when it does not.
   *
   * Legacy spellings `'opstream'` ≡ `'ops'`, `'data'` ≡ `'tree'`,
   * `'engine'` ≡ `'native'` are accepted. Defaults preserve current
   * behavior: Vapor → `'tree'`; VDOM → `'code'` when element templates are
   * enabled, else `'ops'`.
   *
   * @defaultValue undefined (per-render-model default above)
   */
  templateStaging?:
    | 'ops'
    | 'tree'
    | 'code'
    | 'native'
    | 'opstream'
    | 'data'
    | 'engine';

  /**
   * Axis D — **IFR paint mode**: how the ephemeral first-frame copy
   * materializes templates when {@link enableIFR} is on.
   *
   * - `'plain'` — today's behavior: the recorded op stream paints via the
   *   same staging as the durable tree.
   * - `'code-paint'` (legacy `'disposable-et'`) — first frame paints
   *   through the registered Code-Template `create()` executors
   *   (ephemeral Code-Template).
   * - `'native-paint'` (legacy `'engine-et'`) — first frame routes through
   *   the Engine-Template family when available (N/A/stub fallback
   *   otherwise).
   *
   * @defaultValue 'plain'
   */
  ifrPaint?:
    | 'plain'
    | 'code-paint'
    | 'native-paint'
    | 'disposable-et'
    | 'engine-et';

  /**
   * Whether Vapor `CLONE_TREE` may use sparse A2 naming.
   *
   * @deprecated Use {@link templateNaming} (`false` ≡ `'dense'`). When both
   * are set, `templateNaming` wins.
   * @defaultValue true
   */
  enableSparseNaming?: boolean;

  /**
   * Whether to enable IFR (Instant First-Frame Rendering).
   *
   * When enabled, the main-thread bundle contains the full Vue runtime and
   * app code (instead of only worklet registrations). The first screen is
   * rendered synchronously on the main thread during `loadTemplate` —
   * before any background JavaScript runs — eliminating the blank-frame gap.
   * When the background thread boots, its initial render is hydrated
   * against the main-thread output instead of being re-applied.
   *
   * Constraints (matching ReactLynx IFR):
   * - First-screen render output must be deterministic and thread-agnostic
   *   (no `Math.random()` / `Date.now()` in render, no thread-dependent
   *   branching). Divergence is detected and falls back to a full
   *   background render, losing the IFR benefit for that screen.
   * - Side effects belong in lifecycle hooks (`onMounted`, `watch`
   *   callbacks) — these never run during the main-thread render.
   * - Increases the main-thread bundle size (it now carries the Vue
   *   runtime).
   *
   * @see https://lynxjs.org/guide/interaction/ifr
   * @defaultValue false
   */
  enableIFR?: boolean;

  /**
   * Allowlist of bare-import specifiers whose `'main thread'` worklets
   * should be reached by the MT bundler.
   *
   * The worklet loader follows relative imports (`./foo`, `../bar`) and
   * resolves non-relative imports: path aliases and tsconfig `paths` that
   * point at project source (outside `node_modules`) are followed
   * automatically. Imports resolving INTO `node_modules` are dropped by
   * default — list the package names (or RegExps matching them) here to
   * follow worklets shipped as a published/installed package.
   *
   * Both checkpoints reduce their input to the package root before matching,
   * so a pattern always matches the package name (e.g. `'@my-org/foo'`), never
   * a subpath or the resolved filesystem path:
   *   - strings match the root exactly — `'@vue-lynx/motion-mini'` covers the
   *     package and all its subpath imports, but NOT `'@vue-lynx/motion-mini-x'`;
   *   - a RegExp like `/^@my-org\//` matches whether the package is reached as
   *     an import or carved out of the `node_modules` loader exclude.
   *
   * @example
   * ```ts
   * pluginVueLynx({
   *   includeWorkletPackages: ['@vue-lynx/motion-mini', /^@my-org\/lynx-/],
   * })
   * ```
   *
   * @defaultValue []
   */
  includeWorkletPackages?: ReadonlyArray<string | RegExp>;

  /**
   * Enable Vue Vapor mode support (experimental).
   *
   * Vapor mode is Vue's compilation-based, Virtual-DOM-free rendering mode,
   * available since Vue 3.6 (currently in beta). Components opt in with the
   * `vapor` attribute: `<script setup vapor>`.
   *
   * When enabled:
   * - `'vue'` is aliased to `vue-lynx/vapor` — the pure Vapor entry
   *   (shared runtime-core surface + Vapor helpers, no vdom renderer).
   * - Vapor SFC templates compile through `@vue/compiler-vapor` in both
   *   dev (separate template compilation) and prod (inlined) builds.
   *
   * Pure Vapor apps and pure vdom apps are both supported; mixing vapor and
   * vdom components in one app (`vaporInteropPlugin`) is not supported yet.
   *
   * @defaultValue false
   */
  vapor?: boolean;

}

/**
 * Create rsbuild / rspeedy plugins for Vue-Lynx dual-thread rendering.
 *
 * Returns an array of two plugins:
 * 1. `@rsbuild/plugin-vue` — Vue SFC support (rspack-vue-loader + VueLoaderPlugin)
 * 2. `lynx:vue` — Lynx dual-thread entry splitting, PAPI bootstrap, and CSS handling
 *
 * @public
 */
export function pluginVueLynx(
  options: PluginVueLynxOptions = {},
): RsbuildPlugin[] {
  const {
    optionsApi = true,
    prodDevtools = false,
    enableCSSSelector = true,
    enableCSSInheritance = false,
    customCSSInheritanceList,
    enableCSSInlineVariables = false,
    debugInfoOutside = true,
    autoPixelUnit = true,
    enableIFR = false,
    includeWorkletPackages = [],
    vapor = false,
    enableSparseNaming = true,
    ifrPaint = 'plain',
  } = options;
  const enableElementTemplates = resolveElementTemplatesFlag(options);

  // Naming: templateNaming (node|block, legacy dense|sparse) wins over the
  // deprecated boolean alias.
  const templateNaming = normalizeNaming(
    options.templateNaming
      ?? (enableSparseNaming === false ? 'node' : 'block'),
  );

  // Staging: normalize legacy spellings; default = current product
  // behavior per render model.
  const defaultStaging = vapor ? 'tree' : enableElementTemplates ? 'code' : 'ops';
  let templateStaging = normalizeStaging(
    options.templateStaging ?? defaultStaging,
  );
  if (vapor && templateStaging === 'ops') {
    console.warn(
      '[vue-lynx] templateStaging:\'ops\' is not a Vapor cell '
        + '(template() always registers a tree) — using \'tree\'.',
    );
    templateStaging = 'tree';
  }
  if (vapor && templateStaging === 'code') {
    console.warn(
      '[vue-lynx] templateStaging:\'code\' (Vapor Code-Template, M3a) is '
        + 'not implemented — using \'tree\'. The matrix reports this cell '
        + 'as stub.',
    );
    templateStaging = 'tree';
  }
  if (!vapor && templateStaging === 'tree') {
    console.warn(
      '[vue-lynx] templateStaging:\'tree\' is not a VDOM cell (no '
        + 'CLONE_TREE protocol) — using the default.',
    );
    templateStaging = enableElementTemplates ? 'code' : 'ops';
  }
  // Define VALUES keep the legacy spelling for compatibility with built
  // bundles and runtime checks (both spellings accepted at read sites).
  const stagingDefine = (
    { ops: 'opstream', tree: 'data', code: 'code', native: 'engine' } as const
  )[templateStaging];
  const paintDefine = (
    { plain: 'plain', 'code-paint': 'disposable-et', 'native-paint': 'engine-et' } as const
  )[normalizeIfrPaint(ifrPaint)];

  return [
    // ① Official Vue SFC support (rspack-vue-loader + VueLoaderPlugin)
    pluginVue({
      vueLoaderOptions: {
        experimentalInlineMatchResource: true,
        // Element templates: lower eligible static-structure subtrees into
        // main-thread element templates (single INSTANTIATE op + holes).
        compilerOptions: resolveVueLynxCompilerOptions(
          enableElementTemplates,
        ),
      },
    }),

    // ② Lynx dual-thread adaptation logic
    {
      name: 'lynx:vue',
      // Must run after pluginVue ('rsbuild:vue') so that our modifyBundlerChain
      // can see the CHAIN_ID.RULE.VUE rule created by pluginVue.
      pre: ['lynx:rsbuild:plugin-api', 'lynx:config', 'rsbuild:vue'],

      setup(api) {
        // Detect Tailwind v3 + v4 package mismatch early.
        // @tailwindcss/postcss is the Tailwind v4 PostCSS plugin and is
        // incompatible with @lynx-js/tailwind-preset and
        // rsbuild-plugin-tailwindcss (both require Tailwind v3).
        try {
          require.resolve('@tailwindcss/postcss');
          console.warn(
            '\n\x1b[33m'
            + '[vue-lynx] Warning: detected @tailwindcss/postcss (Tailwind v4 PostCSS plugin).\n'
            + '  This is incompatible with @lynx-js/tailwind-preset and\n'
            + '  rsbuild-plugin-tailwindcss, which require Tailwind v3.\n'
            + '  Remove it and follow the setup guide:\n'
            + '  https://vue.lynxjs.org/guide/tailwindcss.html'
            + '\x1b[0m\n',
          );
        } catch {
          // Not installed — no conflict.
        }

        api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
          // By default, Rsbuild does not compile JavaScript files under
          // node_modules via SWC. Many npm packages ship ES2021+ syntax
          // (e.g. ??=, ||=) which the Lynx JS engine does not support.
          // Match the behavior of pluginReactLynx: compile all JS files
          // (including those in node_modules) unless the user explicitly
          // sets source.include.
          const userConfig = api.getRsbuildConfig('original');
          if (typeof userConfig.source?.include === 'undefined') {
            config = mergeRsbuildConfig(config, {
              source: {
                include: [/\.(?:js|mjs|cjs)$/],
              },
            });
          }

          return mergeRsbuildConfig(config, {
            source: {
              define: {
                __DEV__: 'process.env.NODE_ENV !== \'production\'',
                __VUE_OPTIONS_API__: optionsApi ? 'true' : 'false',
                __VUE_PROD_DEVTOOLS__: prodDevtools ? 'true' : 'false',
                __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
                __VUE_LYNX_AUTO_PIXEL_UNIT__: JSON.stringify(autoPixelUnit),
                [VAPOR_SPARSE_NAMING_GLOBAL]: JSON.stringify(
                  templateNaming === 'block',
                ),
                [TEMPLATE_STAGING_GLOBAL]: JSON.stringify(stagingDefine),
                [IFR_PAINT_GLOBAL]: JSON.stringify(paintDefine),
                // Lynx's runtime wrapper injects `document`/`window` as
                // undefined function parameters that shadow globals inside
                // the Background Thread bundle. @vue/runtime-vapor references
                // them as free identifiers, so in vapor mode rewrite those
                // references to the DOM-shim globals installed by
                // vue-lynx/vapor (see runtime vapor/dom-shim.ts).
                ...(vapor
                  ? {
                    document: `globalThis.${VAPOR_DOCUMENT_GLOBAL}`,
                    window: `globalThis.${VAPOR_WINDOW_GLOBAL}`,
                    // DOM constructors must resolve to the ShadowElement
                    // shims even where host DOM globals exist — the IFR
                    // main-thread chunk runs on the page main thread under
                    // Lynx for Web, and a real `Node` there breaks every
                    // runtime-vapor `instanceof` classification (the first
                    // frame then crashes into fallback).
                    ...Object.fromEntries(
                      Object.entries(VAPOR_DOM_CTOR_GLOBALS).map((
                        [name, key],
                      ) => [name, `globalThis.${key}`]),
                    ),
                  }
                  : {}),
              },
            },
            tools: {
              rspack: {
                output: {
                  iife: false,
                },
              },
              swc: {
                jsc: {
                  // The Lynx JS engine only supports up to ES2019 syntax.
                  // Without this, SWC processes node_modules files (via
                  // source.include) but preserves modern syntax like ?? and
                  // ??= because its default target is too high.
                  // Match rspeedy core's pluginSwc behavior.
                  target: 'es2019',
                },
              },
            },
          });
        });

        api.modifyBundlerChain((chain) => {
          // "vue" → "vue-lynx" ensures template compiler output
          // imports from the same module instance (singleton shared state).
          // With vapor enabled, "vue" resolves to the pure Vapor entry
          // instead, which carries the helper surface compiled vapor
          // components import (and none of the vdom renderer).
          chain.resolve.alias.set(
            'vue',
            vapor ? 'vue-lynx/vapor' : 'vue-lynx',
          );

          if (vapor) {
            // rspack-vue-loader's templateLoader predates Vapor: swap in the
            // vapor-aware fork so dev-mode (non-inlined) template compilation
            // of `<script setup vapor>` SFCs uses @vue/compiler-vapor.
            chain
              .plugin('vue-lynx:vapor-template-loader')
              .use(VueLynxVaporTemplatePlugin, [
                path.resolve(_pluginDirname, './loaders/vapor-template-loader.js'),
              ]);

            // Prod inlineTemplate path never hits the template loader — stamp
            // `__vlxAddressing` on the compiled script so sparse A2 activates
            // in probe/benchmark bundles (#301).
            if (templateNaming === 'block') {
              chain.module
                .rule('vue-lynx:vapor-addressing-script')
                .test(/\.vue$/)
                .resourceQuery(/type=script/)
                .use('vue-lynx:vapor-addressing-script')
                .loader(
                  path.resolve(
                    _pluginDirname,
                    './loaders/vapor-addressing-script-loader.js',
                  ),
                )
                .options({ enabled: true })
                .end();
            }
          }

          // Ensure vue-lynx/internal/ops resolves correctly.
          // main-thread/dist and runtime/dist import this path, but rspack's
          // resolution walks up from those directories to the repo root's
          // node_modules, which may not contain a vue-lynx symlink (pnpm
          // doesn't create self-referencing symlinks for the workspace root).
          chain.resolve.alias.set(
            'vue-lynx/internal/ops',
            path.resolve(_vueLynxRoot, 'internal/dist/ops.js'),
          );
          chain.resolve.alias.set(
            'vue-lynx/internal/matrix',
            path.resolve(_vueLynxRoot, 'internal/dist/matrix.js'),
          );
        });

        // NOTE: vue-loader runs on ALL layers (no issuerLayer constraint).
        // On the MT layer, vue-loader processes .vue files into connector code
        // with sub-module imports. The worklet-loader-mt (enforce: 'post')
        // then filters out template/style imports and only follows the script
        // sub-module, ensuring the LEPUS transform sees the same compiled
        // script content as the BG worklet-loader → matching _wkltId hashes.

        applyCSS(api, {
          enableCSSSelector,
          enableCSSInvalidation: enableCSSSelector,
        });
        applyEntry(api, {
          enableCSSSelector,
          enableCSSInheritance,
          customCSSInheritanceList,
          enableCSSInlineVariables,
          debugInfoOutside,
          enableIFR,
          enableElementTemplates,
          includeWorkletPackages,
          vapor,
        });
      },
    },
  ];
}
