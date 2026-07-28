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

import type { ResolveImport } from './worklet-utils.js';
import {
  extractLocalImports,
  extractRegistrations,
  extractSharedImports,
  extractTemplateRegistrations,
  hasMainThreadDirective,
  stripSharedImportAttributes,
  stripStyleImports,
} from './worklet-utils.js';
import { emitVaporBundleRegistrations } from './vapor-bundle-registrations.js';
import type { VaporBundleEmitOptions } from './vapor-bundle-registrations.js';

export interface WorkletLoaderMTOptions {
  /**
   * Allowlist of bare-import specifiers whose `'main thread'` worklets must
   * be followed into the MT module graph even though they resolve into
   * `node_modules`. Imports resolving to project/aliased source (outside
   * `node_modules`) are always followed and do not need to be listed.
   */
  includeWorkletPackages?: ReadonlyArray<string | RegExp>;
  /** Keep complete application modules so Vapor can render the IFR frame. */
  ifr?: boolean;
  /**
   * Element templates: additionally preserve compiler-hoisted registration
   * statements and template submodule dependency edges.
   */
  elementTemplates?: boolean;
  /** Use the pure Vapor runtime entry for generated worklet imports. */
  vapor?: boolean;
  /**
   * Vapor build-time-parse registrations baked into the MT bundle
   * (#337 `+b:c` / #338 `+b!`): emitted for vapor SFC script sub-modules.
   */
  vaporBundle?: VaporBundleEmitOptions;
}

export default function workletLoaderMT(
  this: Rspack.LoaderContext<WorkletLoaderMTOptions>,
  source: string,
): void {
  // Resolution requires an async loader (`this.async()`); the loader output
  // stays a pure function of (source, resolve config), so caching is sound.
  this.cacheable(true);
  const callback = this.async();

  const options = this.getOptions?.() ?? {};

  // Resolve specifiers exactly as the importing module would (honours the
  // bundler's alias + tsconfig `paths`). Unresolvable specifiers resolve to
  // `null` so the caller can skip them instead of failing the build.
  // `getResolve` returns a union (callback form | promise form); select the
  // promise form so we can await it.
  const resolver = this.getResolve({}) as (
    context: string,
    request: string,
  ) => Promise<string | false | undefined>;
  const context = this.context ?? this.rootContext;
  const resolveImport: ResolveImport = async (specifier) => {
    try {
      return (await resolver(context, specifier)) || null;
    } catch {
      return null;
    }
  };

  transformModule(this, source, resolveImport, options).then(
    (result) => callback(null, result),
    (err) => callback(err instanceof Error ? err : new Error(String(err))),
  );
}

async function transformModule(
  ctx: Rspack.LoaderContext<WorkletLoaderMTOptions>,
  source: string,
  resolveImport: ResolveImport,
  options: WorkletLoaderMTOptions,
): Promise<string> {
  if (options.ifr === true) {
    return ifrTransform(ctx, source, options.vapor === true, options);
  }

  const keepTpl = options.elementTemplates === true;
  const tplRegistrations = keepTpl
    ? extractTemplateRegistrations(source)
    : '';
  const includeWorkletPackages = options.includeWorkletPackages ?? [];
  // Vue script sub-modules: the inline match resource proxy re-exports
  // `export { default } from "...inline..."`. If we strip exports entirely,
  // the proxy fails with ESModulesLinkingError. Instead, emit local imports
  // + registrations + a dummy default export to satisfy the proxy. The
  // connector's side-effect import means the proxy's exports are unused
  // and will be tree-shaken.
  if (
    ctx.resourceQuery?.includes('vue')
    && ctx.resourceQuery?.includes('type=script')
  ) {
    const localImports = await extractLocalImports(
      source,
      resolveImport,
      includeWorkletPackages,
      keepTpl,
    );

    // Vapor bundle-delivery / code-staging registrations (#337/#338) —
    // derived from the SFC descriptor, appended to the stripped module so
    // they evaluate at MT bundle-evaluation time (after entry-main installs
    // the registry globals).
    const vaporRegistrations = options.vapor === true && options.vaporBundle
      ? emitVaporBundleRegistrations(ctx, options.vaporBundle)
      : '';

    const scriptStub = () =>
      [localImports, tplRegistrations, vaporRegistrations, 'export default {};']
        .filter(Boolean)
        .join('\n');

    if (!hasMainThreadDirective(source)) {
      return scriptStub();
    }

    const lepusCode = runLepusTransform(ctx, source, options.vapor === true);
    if (lepusCode === null) {
      return scriptStub();
    }

    const registrations = extractRegistrations(lepusCode);
    const sharedImports = extractSharedImports(lepusCode);
    const parts = [
      sharedImports,
      localImports,
      registrations,
      tplRegistrations,
      vaporRegistrations,
      'export default {};',
    ].filter(Boolean);
    return parts.join('\n');
  }

  // Regular .js/.ts files (not vue sub-modules):
  // Strip everything except local imports, shared imports, and registrations.

  // Preserve local imports so webpack follows the dependency graph to
  // sub-modules that may contain worklet registrations.
  const localImports = await extractLocalImports(
    source,
    resolveImport,
    includeWorkletPackages,
    keepTpl,
  );

  // Quick check: skip LEPUS transform for files without 'main thread' directive
  // (but still extract shared imports from source since they don't need LEPUS)
  if (!hasMainThreadDirective(source)) {
    const sharedImports = extractSharedImports(source);
    return [sharedImports, localImports, tplRegistrations]
      .filter(Boolean)
      .join('\n');
  }

  const lepusCode = runLepusTransform(ctx, source, options.vapor === true);
  if (lepusCode === null) {
    return [localImports, tplRegistrations].filter(Boolean).join('\n');
  }

  // Extract shared imports from the LEPUS output (SWC preserves them)
  const sharedImports = extractSharedImports(lepusCode);

  // Return shared imports + local imports (for dep graph) + extracted registrations
  const registrations = extractRegistrations(lepusCode);
  const parts = [sharedImports, localImports, registrations, tplRegistrations]
    .filter(Boolean);
  return parts.join('\n');
}

/**
 * Run the LEPUS worklet transform on a module and surface any transform
 * errors via `ctx.emitError`. Returns the transformed code, or `null` when
 * the transform failed — callers fall back to their own minimal output.
 */
function runLepusTransform(
  ctx: Rspack.LoaderContext<WorkletLoaderMTOptions>,
  source: string,
  vapor: boolean,
): string | null {
  const resourcePath = ctx.resourcePath;
  const result = transformReactLynxSync(source, {
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
      runtimePkg: vapor ? 'vue-lynx/vapor' : 'vue-lynx',
    },
  });

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      ctx.emitError(
        new Error(`[worklet-loader-mt] LEPUS transform: ${err.text}`),
      );
    }
    return null;
  }

  return result.code;
}

/**
 * IFR keeps complete application modules on the Main Thread.
 *
 * Connector modules retain script/template edges and CSS-module bindings but
 * drop ordinary style side effects. Directive-bearing modules are transformed
 * from their original bytes so the LEPUS hash is identical to the BG JS pass.
 */
function ifrTransform(
  ctx: Rspack.LoaderContext<WorkletLoaderMTOptions>,
  source: string,
  vapor: boolean,
  options: WorkletLoaderMTOptions,
): string {
  const isVueSubModule = ctx.resourceQuery?.includes('vue')
    && ctx.resourceQuery.includes('type=');

  // Vapor bundle registrations (#337/#338) ride the kept script sub-module
  // under IFR — the MT evaluates the full app, and the local first-frame
  // applyOps resolves bundle-delivered ids from the same registries.
  const vaporRegistrations = vapor
      && options.vaporBundle
      && ctx.resourceQuery?.includes('vue')
      && ctx.resourceQuery.includes('type=script')
    ? emitVaporBundleRegistrations(ctx, options.vaporBundle)
    : '';
  const withVapor = (code: string): string =>
    vaporRegistrations ? `${code}\n${vaporRegistrations}` : code;

  if (ctx.resourcePath.endsWith('.vue') && !isVueSubModule) {
    return stripSharedImportAttributes(stripStyleImports(source));
  }

  if (!hasMainThreadDirective(source)) {
    return withVapor(stripSharedImportAttributes(source));
  }

  // Use the original source for both transforms. Pre-stripping shared import
  // attributes here would change the transform input and therefore _wkltId.
  const transformed = runLepusTransform(ctx, source, vapor);
  return withVapor(stripSharedImportAttributes(transformed ?? source));
}
