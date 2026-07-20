// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Vapor-aware replacement for rspack-vue-loader's templateLoader.
 *
 * rspack-vue-loader (17.5.0) predates Vapor mode: its templateLoader calls
 * `compileTemplate` without the `vapor` flag, so in dev builds (where
 * templates compile separately from the script) a `<script setup vapor>`
 * SFC would get a vdom render function attached to a `__vapor: true`
 * component — a broken mix. `compileScript` auto-detects vapor from the
 * descriptor, but `compileTemplate` cannot (it only receives the raw
 * template source).
 *
 * This loader is a faithful fork of the upstream templateLoader body with
 * one change: it passes `vapor: descriptor.vapor` to `compileTemplate`.
 * It reuses rspack-vue-loader's own internal modules (descriptor cache,
 * script resolution cache, compiler instance) so both loaders observe the
 * same shared state. VueLynxVaporTemplatePlugin swaps it into the rule
 * that VueLoaderPlugin registered.
 */

import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Resolve rspack-vue-loader's internals through @rsbuild/plugin-vue so we
// share module state (descriptor cache, resolved-script cache) with the main
// vue loader under pnpm's strict node_modules layout.
// ---------------------------------------------------------------------------

interface VueLoaderInternals {
  qs: typeof import('node:querystring');
  getOptions: (ctx: unknown) => Record<string, unknown> | undefined;
  resolveTemplateTSOptions: (
    descriptor: unknown,
    options: unknown,
  ) => Record<string, unknown> | null;
  getDescriptor: (filename: string, compilerOptions?: unknown) => VaporSfcDescriptor;
  resolveScript: (
    descriptor: unknown,
    scopeId: unknown,
    options: unknown,
    ctx: unknown,
  ) => { bindings?: unknown } | null;
  formatError: (err: unknown, source: string, file: string) => void;
  compileTemplate: (options: Record<string, unknown>) => {
    code: string;
    map?: unknown;
    tips: string[];
    errors?: Array<string | Error>;
  };
}

interface VaporSfcDescriptor {
  vapor?: boolean;
  slotted?: boolean;
  cssVars?: unknown;
  template?: { lang?: string; ast?: unknown } | null;
}

let _internals: VueLoaderInternals | undefined;

// VERSION COUPLING: this fork mirrors rspack-vue-loader's templateLoader body
// and resolves its UNDOCUMENTED dist/ internals by path (loadInternals below).
// It is written against rspack-vue-loader 17.5.x as shipped by
// @rsbuild/plugin-vue ^1.2.6 — bumping @rsbuild/plugin-vue requires re-diffing
// upstream's templateLoader and this file. A rename upstream fails fast here
// (require.resolve throws); the real fix is an upstream `vapor` passthrough
// option, tracked in plans/0709-1.
function loadInternals(): VueLoaderInternals {
  if (_internals) return _internals;

  // Note: @rsbuild/plugin-vue's exports map does not expose './package.json',
  // so resolve the main entry and walk up from its directory.
  const pluginVueDir = path.dirname(require.resolve('@rsbuild/plugin-vue'));
  const resolveSub = (sub: string): string =>
    require.resolve(`rspack-vue-loader/dist/${sub}`, { paths: [pluginVueDir] });

  /* eslint-disable @typescript-eslint/no-var-requires */
  const util = require(resolveSub('util'));
  const descriptorCache = require(resolveSub('descriptorCache'));
  const resolveScriptMod = require(resolveSub('resolveScript'));
  const formatErrorMod = require(resolveSub('formatError'));
  const compilerMod = require(resolveSub('compiler'));
  /* eslint-enable @typescript-eslint/no-var-requires */

  _internals = {
    qs: require('node:querystring'),
    getOptions: util.getOptions,
    resolveTemplateTSOptions: util.resolveTemplateTSOptions,
    getDescriptor: descriptorCache.getDescriptor,
    resolveScript: resolveScriptMod.resolveScript,
    formatError: formatErrorMod.formatError,
    compileTemplate: compilerMod.compiler.compileTemplate,
  };
  return _internals;
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

interface LoaderContext {
  resourcePath: string;
  resourceQuery: string;
  mode?: string;
  target?: string;
  emitWarning(err: Error): void;
  emitError(err: Error | string): void;
  callback(err: null, code: string, map?: unknown): void;
}

export default function vaporTemplateLoader(
  this: LoaderContext,
  source: string | Buffer,
  inMap?: { sourcesContent?: string[] },
): void {
  const {
    qs,
    getOptions,
    resolveTemplateTSOptions,
    getDescriptor,
    resolveScript,
    formatError,
    compileTemplate,
  } = loadInternals();

  const src = String(source);
  // biome-ignore lint/complexity/noUselessThisAlias: mirrors the upstream loader body so the fork stays diffable
  const loaderContext = this;
  const options = (getOptions(loaderContext) || {}) as Record<string, unknown> & {
    isServerBuild?: boolean;
    compiler?: string | object;
    compilerOptions?: Record<string, unknown>;
    transformAssetUrls?: unknown;
  };

  const isServer = options.isServerBuild ?? loaderContext.target === 'node';
  const isProd = loaderContext.mode === 'production'
    || process.env.NODE_ENV === 'production';
  const query = qs.parse(loaderContext.resourceQuery.slice(1));
  const scopeId = query.id;
  const descriptor = getDescriptor(
    loaderContext.resourcePath,
    options.compilerOptions,
  );
  const script = resolveScript(descriptor, query.id, options, loaderContext);

  let templateCompiler: unknown;
  if (typeof options.compiler === 'string') {
    templateCompiler = require(options.compiler);
  } else {
    templateCompiler = options.compiler;
  }

  const compiled = compileTemplate({
    source: src,
    ast: descriptor.template && !descriptor.template.lang
      ? descriptor.template.ast
      : undefined,
    filename: loaderContext.resourcePath,
    inMap,
    id: scopeId,
    scoped: !!query.scoped,
    slotted: descriptor.slotted,
    isProd,
    ssr: isServer,
    ssrCssVars: descriptor.cssVars,
    // The one behavioral difference from upstream: compile Vapor SFC
    // templates with the vapor compiler.
    vapor: !!descriptor.vapor,
    compiler: templateCompiler,
    compilerOptions: {
      ...options.compilerOptions,
      scopeId: query.scoped ? `data-v-${String(scopeId)}` : undefined,
      bindingMetadata: script ? script.bindings : undefined,
      ...resolveTemplateTSOptions(descriptor, options),
    },
    transformAssetUrls: options.transformAssetUrls || true,
  });

  if (compiled.tips.length > 0) {
    for (const tip of compiled.tips) {
      loaderContext.emitWarning(new Error(tip));
    }
  }

  if (compiled.errors && compiled.errors.length > 0) {
    for (const err of compiled.errors) {
      if (typeof err === 'string') {
        loaderContext.emitError(new Error(err));
      } else {
        formatError(
          err,
          inMap?.sourcesContent?.[0] ?? src,
          loaderContext.resourcePath,
        );
        loaderContext.emitError(err);
      }
    }
  }

  // Build-time structured templates (#234 / IFR×ET): rewrite
  // template("<view…>") → template(<TemplateNode>) so both threads skip
  // the runtime HTML parse. Failures leave the string form intact.
  let code = compiled.code;
  if (descriptor.vapor) {
    try {
      // Lazy require keeps the loader light when vapor is off; the rewrite
      // module pulls in the HTML→TemplateNode parser.
      const { rewriteVaporTemplateCalls } = require(
        '../compiler/vapor-structured-template.js',
      ) as typeof import('../compiler/vapor-structured-template.js');
      code = rewriteVaporTemplateCalls(code).code;
    } catch {
      // Keep the HTML-string form if the rewrite cannot load.
    }
  }

  loaderContext.callback(null, code, compiled.map);
}
