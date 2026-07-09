// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Swaps rspack-vue-loader's templateLoader for vue-lynx's vapor-aware fork
 * (see loaders/vapor-template-loader.ts).
 *
 * VueLoaderPlugin registers the template rule while plugins are being
 * applied, so we rewrite `compiler.options.module.rules` in the
 * `afterEnvironment` hook — which fires after every plugin's `apply()` has
 * run and before the normal module factory reads the rules.
 */

interface RuleLike {
  loader?: string;
  oneOf?: RuleLike[];
  rules?: RuleLike[];
}

interface CompilerLike {
  options: { module?: { rules?: unknown[] } };
  hooks: {
    afterEnvironment: { tap(name: string, fn: () => void): void };
  };
}

const UPSTREAM_TEMPLATE_LOADER_RE = /rspack-vue-loader[\\/]dist[\\/]templateLoader(?:\.js)?$/;

export class VueLynxVaporTemplatePlugin {
  private readonly loaderPath: string;

  constructor(loaderPath: string) {
    this.loaderPath = loaderPath;
  }

  apply(compiler: CompilerLike): void {
    compiler.hooks.afterEnvironment.tap('VueLynxVaporTemplatePlugin', () => {
      const rules = compiler.options.module?.rules;
      if (rules) this.swap(rules as RuleLike[]);
    });
  }

  private swap(rules: RuleLike[]): boolean {
    let swapped = false;
    for (const rule of rules) {
      if (!rule || typeof rule !== 'object') continue;
      if (
        typeof rule.loader === 'string'
        && UPSTREAM_TEMPLATE_LOADER_RE.test(rule.loader)
      ) {
        rule.loader = this.loaderPath;
        swapped = true;
      }
      if (rule.oneOf) swapped = this.swap(rule.oneOf) || swapped;
      if (rule.rules) swapped = this.swap(rule.rules) || swapped;
    }
    return swapped;
  }
}
