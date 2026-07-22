// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Annotate vapor SFC *script* modules with `__vlxAddressing` after
 * compileScript (prod `inlineTemplate` path).
 *
 * Dev builds already stamp via vapor-template-loader on the separate
 * `?vue&type=template` request. Production inlines the template into the
 * script, so that loader never runs — without this pass, sparse A2 never
 * activates in probe/benchmark bundles (#301).
 *
 * Idempotent: skips when `__vlxAddressing` is already present.
 */

import { createRequire } from 'node:module';
import path from 'node:path';

import { analyzeAndAnnotateVaporCode } from '../compiler/vapor-addressing.js';

const require = createRequire(import.meta.url);

interface LoaderContext {
  resourcePath: string;
  resourceQuery: string;
  async(): (
    err: Error | null,
    content?: string | Buffer,
    sourceMap?: unknown,
  ) => void;
  getOptions(): { enabled?: boolean; autoPixelUnit?: boolean };
  addDependency(file: string): void;
}

interface VueLoaderInternals {
  getDescriptor: (
    filename: string,
    compilerOptions?: unknown,
  ) => {
    vapor?: boolean;
    template?: { content?: string } | null;
  };
  resolveScript: (
    descriptor: unknown,
    scopeId: unknown,
    options: unknown,
    ctx: unknown,
  ) => { bindings?: unknown } | null;
  getOptions: (ctx: unknown) => Record<string, unknown> | undefined;
}

let _internals: VueLoaderInternals | undefined;

function loadInternals(): VueLoaderInternals {
  if (_internals) return _internals;
  const pluginVueDir = path.dirname(require.resolve('@rsbuild/plugin-vue'));
  const resolveSub = (sub: string): string =>
    require.resolve(`rspack-vue-loader/dist/${sub}`, { paths: [pluginVueDir] });
  /* eslint-disable @typescript-eslint/no-var-requires */
  const descriptorCache = require(resolveSub('descriptorCache'));
  const resolveScriptMod = require(resolveSub('resolveScript'));
  const util = require(resolveSub('util'));
  /* eslint-enable @typescript-eslint/no-var-requires */
  _internals = {
    getDescriptor: descriptorCache.getDescriptor,
    resolveScript: resolveScriptMod.resolveScript,
    getOptions: util.getOptions,
  };
  return _internals;
}

export default function vaporAddressingScriptLoader(
  this: LoaderContext,
  source: string | Buffer,
): void {
  const callback = this.async();
  const code = typeof source === 'string' ? source : source.toString('utf8');
  const opts = this.getOptions?.() ?? {};
  if (opts.enabled === false) {
    callback(null, code);
    return;
  }
  // Already stamped (dev template-loader path) or not a vapor template factory.
  if (code.includes('__vlxAddressing') || !/\b_?template\s*\(/.test(code)) {
    callback(null, code);
    return;
  }

  try {
    const { getDescriptor, resolveScript, getOptions } = loadInternals();
    const filename = this.resourcePath;
    this.addDependency(filename);
    const descriptor = getDescriptor(filename);
    if (!descriptor?.vapor || !descriptor.template?.content) {
      callback(null, code);
      return;
    }
    const vueOpts = getOptions(this) ?? {};
    const script = resolveScript(descriptor, undefined, vueOpts, this);
    const annotated = analyzeAndAnnotateVaporCode(
      descriptor.template.content,
      code,
      {
        bindingMetadata: script?.bindings as
          | import('@vue/compiler-dom').BindingMetadata
          | undefined,
        isNativeTag: () => true,
        autoPixelUnit: opts.autoPixelUnit,
      },
    ).code;
    callback(null, annotated);
  } catch {
    callback(null, code);
  }
}
