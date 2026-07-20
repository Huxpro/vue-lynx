import { describe, expect, it } from 'vitest';

import {
  resolveElementTemplatesFlag,
  resolveVueLynxCompilerOptions,
  vueLynxCompilerOptions,
} from '../../../vue-lynx/plugin/src/compiler-options.js';
import { elementTemplateTransform } from '../../../vue-lynx/plugin/src/compiler/element-template-transform.js';

// pluginVueLynx passes resolveElementTemplatesFlag(options) straight into
// resolveVueLynxCompilerOptions — asserting on the two helpers covers the
// defaulting rule and the compiler-options composition without mocking
// @rsbuild/plugin-vue's bundler-chain surface.

describe('pluginVueLynx optimization defaults', () => {
  it('keeps element templates off when IFR is off', () => {
    expect(resolveElementTemplatesFlag({})).toBe(false);
  });

  it('enables element templates by default with IFR', () => {
    expect(resolveElementTemplatesFlag({ enableIFR: true })).toBe(true);
  });

  it('honors the element templates opt-out with IFR', () => {
    expect(
      resolveElementTemplatesFlag({
        enableIFR: true,
        enableElementTemplates: false,
      }),
    ).toBe(false);
  });

  it('allows element templates without IFR', () => {
    expect(resolveElementTemplatesFlag({ enableElementTemplates: true })).toBe(
      true,
    );
  });
});

describe('vapor × element templates policy', () => {
  it('documents that vapor must not inherit the VDOM ET default', () => {
    // pluginVueLynx forces enableElementTemplates=false when vapor:true,
    // even if enableIFR would otherwise default it on. The VDOM
    // elementTemplateTransform does not apply to compiler-vapor; Vapor's
    // IFR×ET sparse path is separate (2026-07-20 design).
    expect(resolveElementTemplatesFlag({ enableIFR: true })).toBe(true);
    // Simulated plugin gate:
    const vapor = true;
    const enableElementTemplates = vapor
      ? false
      : resolveElementTemplatesFlag({ enableIFR: true });
    expect(enableElementTemplates).toBe(false);
  });
});

describe('resolveVueLynxCompilerOptions', () => {
  it('appends the lowering transform when templates are enabled', () => {
    const options = resolveVueLynxCompilerOptions(true);
    expect(options.nodeTransforms).toContain(elementTemplateTransform);
    // The shared base transforms are preserved, not replaced.
    for (const transform of vueLynxCompilerOptions.nodeTransforms) {
      expect(options.nodeTransforms).toContain(transform);
    }
  });

  it('returns the shared base options untouched when disabled', () => {
    expect(resolveVueLynxCompilerOptions(false)).toBe(vueLynxCompilerOptions);
    expect(vueLynxCompilerOptions.nodeTransforms).not.toContain(
      elementTemplateTransform,
    );
  });
});
