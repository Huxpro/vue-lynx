// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Webpack loader for the Main Thread (LEPUS) layer.
 *
 * Applied to .js/.ts files when imported from the MT entry.
 * For each file:
 *  1. Extract local (relative-path) imports to preserve webpack dep graph
 *  2. Quick-check for 'main thread' directive — skip LEPUS transform if absent
 *  3. SWC with target='LEPUS' → produces registerWorkletInternal calls
 *  4. Extract only registerWorkletInternal(...) calls
 *  5. Return local imports + extracted registrations as module content
 *
 * Files without 'main thread' directives return only their local imports.
 * This preserves the dependency chain so webpack can reach files that DO
 * contain worklet registrations (e.g. index.ts → App.vue).
 *
 * Vue script sub-modules (?vue&type=script) require special handling:
 * VueLoaderPlugin clones rules for ?vue sub-modules. With
 * experimentalInlineMatchResource, rspack creates a proxy module that
 * re-exports from the inline module (`export { default } from "..."`)
 * even though the .vue connector on MT is converted to a side-effect
 * import. The proxy's re-export must be satisfiable, so we emit a dummy
 * `export default {}` alongside registrations.
 */

import type { Rspack } from '@rsbuild/core';

import { transformReactLynxSync } from '@lynx-js/react/transform';

import {
  extractLocalImports,
  extractRegistrations,
  extractSharedImports,
  extractTemplateRegistrations,
  stripSharedImportAttributes,
  stripStyleImports,
} from './worklet-utils.js';

interface WorkletLoaderMtOptions {
  /**
   * IFR mode: keep the full module code on the MT layer (the Vue app runs
   * on the main thread for the first frame) instead of stripping everything
   * except worklet registrations. Worklet functions are still transformed
   * by the LEPUS pass — it rewrites them in place and appends the
   * registerWorkletInternal() calls, leaving the rest of the module intact.
   */
  ifr?: boolean;
  /**
   * Element templates: additionally preserve the compiler-hoisted
   * `_registerElementTemplate(...)` statements (and the template sub-module
   * dependency edges they live in) so the interpreter-only main thread can
   * resolve template create() functions. No-op when the app was compiled
   * without the element-template transform.
   */
  elementTemplates?: boolean;
}

export default function workletLoaderMT(
  this: Rspack.LoaderContext,
  source: string,
): string {
  this.cacheable(true);

  const options = (this.getOptions?.() ?? {}) as WorkletLoaderMtOptions;
  if (options.ifr === true) {
    return ifrTransform(this, source);
  }

  // Vue script sub-modules: the inline match resource proxy re-exports
  // `export { default } from "...inline..."`. If we strip exports entirely,
  // the proxy fails with ESModulesLinkingError. Instead, emit local imports
  // + registrations + a dummy default export to satisfy the proxy. The
  // connector's side-effect import means the proxy's exports are unused
  // and will be tree-shaken.
  const keepTpl = options.elementTemplates === true;

  if (
    this.resourceQuery?.includes('vue')
    && this.resourceQuery?.includes('type=script')
  ) {
    const localImports = extractLocalImports(source, keepTpl);
    // Script-setup SFCs inline the compiled template into the script module —
    // the hoisted element-template registrations live here.
    const tplRegistrations = keepTpl
      ? extractTemplateRegistrations(source)
      : '';

    if (
      !source.includes('\'main thread\'') && !source.includes('"main thread"')
    ) {
      return [localImports, tplRegistrations, 'export default {};']
        .filter(Boolean)
        .join('\n');
    }

    const resourcePath = this.resourcePath;
    const lepusResult = transformReactLynxSync(source, {
      pluginName: 'vue:worklet-mt',
      filename: resourcePath,
      sourcemap: false,
      cssScope: false,
      shake: false,
      compat: false,
      refresh: false,
      defineDCE: false,
      directiveDCE: false,
      worklet: {
        target: 'LEPUS',
        filename: resourcePath,
        runtimePkg: 'vue-lynx',
      },
    });

    if (lepusResult.errors.length > 0) {
      for (const err of lepusResult.errors) {
        this.emitError(
          new Error(`[worklet-loader-mt] LEPUS transform: ${err.text}`),
        );
      }
      return [localImports, tplRegistrations, 'export default {};']
        .filter(Boolean)
        .join('\n');
    }

    const registrations = extractRegistrations(lepusResult.code);
    const sharedImports = extractSharedImports(lepusResult.code);
    const parts = [
      sharedImports,
      localImports,
      registrations,
      tplRegistrations,
      'export default {};',
    ].filter(Boolean);
    return parts.join('\n');
  }

  // Regular .js/.ts files (not vue sub-modules):
  // Strip everything except local imports, shared imports, and registrations.

  // Preserve local (relative-path) imports so webpack follows the dependency
  // graph to sub-modules that may contain worklet registrations.
  const localImports = extractLocalImports(source, keepTpl);

  // Compiled template sub-modules (non-script-setup SFCs) carry the hoisted
  // element-template registrations.
  const tplRegistrations = keepTpl ? extractTemplateRegistrations(source) : '';

  // Quick check: skip LEPUS transform for files without 'main thread' directive
  // (but still extract shared imports from source since they don't need LEPUS)
  if (
    !source.includes('\'main thread\'') && !source.includes('"main thread"')
  ) {
    const sharedImports = extractSharedImports(source);
    return [sharedImports, localImports, tplRegistrations]
      .filter(Boolean)
      .join('\n');
  }

  const resourcePath = this.resourcePath;
  const filename = resourcePath;

  const lepusResult = transformReactLynxSync(source, {
    pluginName: 'vue:worklet-mt',
    filename,
    sourcemap: false,
    cssScope: false,
    shake: false,
    compat: false,
    refresh: false,
    defineDCE: false,
    directiveDCE: false,
    worklet: {
      target: 'LEPUS',
      filename,
      runtimePkg: 'vue-lynx',
    },
  });

  if (lepusResult.errors.length > 0) {
    for (const err of lepusResult.errors) {
      this.emitError(
        new Error(`[worklet-loader-mt] LEPUS transform: ${err.text}`),
      );
    }
    return [localImports, tplRegistrations].filter(Boolean).join('\n');
  }

  // Extract shared imports from the LEPUS output (SWC preserves them)
  const sharedImports = extractSharedImports(lepusResult.code);

  // Return shared imports + local imports (for dep graph) + extracted registrations
  const registrations = extractRegistrations(lepusResult.code);
  const parts = [sharedImports, localImports, registrations, tplRegistrations]
    .filter(Boolean);
  return parts.join('\n');
}

/**
 * IFR mode: the main-thread bundle carries the full app, so modules pass
 * through (nearly) intact.
 *
 *  - `.vue` connector: kept, minus style sub-module imports (CSS is
 *    extracted from the background layer; doing it again would duplicate it).
 *  - Files with `'main thread'` directives (script sub-modules or plain
 *    js/ts): full LEPUS transform output — worklet expressions become
 *    `{ _wkltId }` contexts in place and `registerWorkletInternal()` calls
 *    are appended, everything else is preserved.
 *  - Everything else: passed through unchanged.
 *
 * `with { runtime: 'shared' }` import attributes are stripped in all cases —
 * the shared-runtime escape hatch exists to bypass the *stripping* loaders,
 * which IFR mode doesn't do; the plain import must not reach the parser
 * with a non-standard attribute.
 */
function ifrTransform(
  ctx: Rspack.LoaderContext,
  source: string,
): string {
  const isVueSubModule = ctx.resourceQuery?.includes('vue')
    && ctx.resourceQuery?.includes('type=');

  // `.vue` connector (no sub-module query): script + template imports pass
  // through so the MT bundle can render the component; style imports are
  // dropped.
  if (ctx.resourcePath.endsWith('.vue') && !isVueSubModule) {
    return stripStyleImports(source);
  }

  if (
    !source.includes('\'main thread\'') && !source.includes('"main thread"')
  ) {
    return stripSharedImportAttributes(source);
  }

  // Transform the ORIGINAL source (not a pre-processed copy) so the content
  // hash in _wkltId matches the BG layer's JS-target transform of the same
  // content.
  const resourcePath = ctx.resourcePath;
  const lepusResult = transformReactLynxSync(source, {
    pluginName: 'vue:worklet-mt-ifr',
    filename: resourcePath,
    sourcemap: false,
    cssScope: false,
    shake: false,
    compat: false,
    refresh: false,
    defineDCE: false,
    directiveDCE: false,
    worklet: {
      target: 'LEPUS',
      filename: resourcePath,
      runtimePkg: 'vue-lynx',
    },
  });

  if (lepusResult.errors.length > 0) {
    for (const err of lepusResult.errors) {
      ctx.emitError(
        new Error(`[worklet-loader-mt] IFR LEPUS transform: ${err.text}`),
      );
    }
    return stripSharedImportAttributes(source);
  }

  return stripSharedImportAttributes(lepusResult.code);
}
