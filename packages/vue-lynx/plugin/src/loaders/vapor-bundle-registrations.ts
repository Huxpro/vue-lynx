// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main-thread bundle registrations for the vapor build-time-parse cells
 * (#337 `+b:c` code staging, #338 `+b!` bundle delivery).
 *
 * For a vapor SFC's `?vue&type=script` sub-module on the MAIN_THREAD layer,
 * this emits registration statements appended to worklet-loader-mt's
 * stripped output (interpreter-only bundles) or to the kept module (IFR):
 *
 *   +b!  → `(globalThis.__vueLynxRegisterVaporStructure || …)(hash, structure)`
 *   +b:c → `(globalThis.__vueLynxRegisterVaporTemplate || …)(codeId,
 *            namedParents, function (P) { …straight-line PAPI… })`
 *
 * The analysis is the SAME `analyzeVaporAddressing` pass that stamps
 * `__vlxAddressing` on the Background factory (shared descriptor + resolved
 * script caches), so the addressed list — and therefore the code id
 * `hash(structure)-hash(addressed)` — cannot drift between the two bundles
 * of one build. Runtime divergence (a template whose runtime parse disagrees
 * with the build parse) is caught by the BG fingerprint fail-safe before any
 * of these registrations are consulted.
 */

import { createRequire } from 'node:module';
import path from 'node:path';

import { analyzeVaporAddressing } from '../compiler/vapor-addressing.js';
import {
  codegenVaporCreate,
  hashVaporStructure,
  templateNodeFromHtml,
} from '../compiler/vapor-template-node.js';
import {
  VAPOR_STRUCTURE_REGISTER_GLOBAL,
  VAPOR_TPL_REGISTER_GLOBAL,
} from 'vue-lynx/internal/ops';

const require = createRequire(import.meta.url);

export interface VaporBundleEmitOptions {
  /** Emit structure registrations (`templateDelivery: 'bundle'`, #338). */
  structures?: boolean;
  /** Emit compiled create() registrations (`templateStaging: 'code'`, #337). */
  codeTemplates?: boolean;
  /** Mirrors the plugin's `autoPixelUnit` define for style-hash parity. */
  autoPixelUnit?: boolean;
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
  /* eslint-enable @typescript-eslint/no-var-requires */
  _internals = {
    getDescriptor: descriptorCache.getDescriptor,
    resolveScript: resolveScriptMod.resolveScript,
  };
  return _internals;
}

/**
 * Compute the `+b:c` template id from the build-parsed structure hash and
 * the addressed naming list. The BG runtime derives the identical id from
 * its stamped metadata (`hash` + validated `addressed`), so both sides key
 * the registry without a second stamp.
 */
export function vaporCodeTemplateId(
  structureHash: string,
  addressed: readonly number[],
): string {
  return `${structureHash}-${hashVaporStructure(addressed.join(','))}`;
}

/**
 * Build the registration statements for one vapor SFC. Returns '' when the
 * file is not a vapor SFC, has no templates, or the analysis fails — those
 * templates simply stay on the wire-delivered data path.
 */
export function emitVaporBundleRegistrations(
  loaderCtx: { resourcePath: string },
  opts: VaporBundleEmitOptions,
): string {
  if (!opts.structures && !opts.codeTemplates) return '';
  try {
    const { getDescriptor, resolveScript } = loadInternals();
    const descriptor = getDescriptor(loaderCtx.resourcePath);
    if (!descriptor?.vapor || !descriptor.template?.content) return '';
    const script = resolveScript(descriptor, undefined, {}, loaderCtx);
    const { templates } = analyzeVaporAddressing(descriptor.template.content, {
      bindingMetadata: script?.bindings as
        | import('@vue/compiler-dom').BindingMetadata
        | undefined,
      isNativeTag: () => true,
      autoPixelUnit: opts.autoPixelUnit,
    });

    const out: string[] = [];
    for (const tpl of templates) {
      const built = templateNodeFromHtml(tpl.content, {
        autoPixelUnit: opts.autoPixelUnit,
      });
      if (!built || built.slotCount !== tpl.slotCount) continue;

      if (opts.structures) {
        out.push(
          `;(globalThis.${VAPOR_STRUCTURE_REGISTER_GLOBAL} || function () {})(`
            + `${JSON.stringify(built.hash)}, `
            + `${JSON.stringify(built.structure)});`,
        );
      }

      if (
        opts.codeTemplates
        && tpl.addressed.length > 0
        && tpl.addressed[0] === 0
      ) {
        const { src, namedParents } = codegenVaporCreate(
          built.structure,
          tpl.addressed,
        );
        const codeId = vaporCodeTemplateId(built.hash, tpl.addressed);
        out.push(
          `;(globalThis.${VAPOR_TPL_REGISTER_GLOBAL} || function () {})(`
            + `${JSON.stringify(codeId)}, `
            + `${JSON.stringify(namedParents)}, ${src});`,
        );
      }
    }
    return out.join('\n');
  } catch {
    // Never break the MT build — unregistered templates keep today's path.
    return '';
  }
}
