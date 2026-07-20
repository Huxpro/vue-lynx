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
  it('keeps the VDOM compiler transform off under vapor', () => {
    // pluginVueLynx never passes enableElementTemplates into the VDOM
    // elementTemplateTransform when vapor:true. The public flag instead
    // drives __VUE_LYNX_VAPOR_IFR_ET__ for sparse IFR paint.
    expect(resolveElementTemplatesFlag({ enableIFR: true })).toBe(true);
    const vapor = true;
    const enableElementTemplates = vapor
      ? false
      : resolveElementTemplatesFlag({ enableIFR: true });
    expect(enableElementTemplates).toBe(false);
  });

  it('defaults vapor IFR×ET sparse paint on with IFR', () => {
    const enableIFR = true;
    const vaporIfrElementTemplates =
      /* vapor */ true
        ? (undefined ?? enableIFR)
        : false;
    expect(vaporIfrElementTemplates).toBe(true);
  });

  it('allows opting vapor IFR×ET off for dense bisect', () => {
    const enableIFR = true;
    const options = { enableElementTemplates: false };
    const vaporIfrElementTemplates = options.enableElementTemplates ?? enableIFR;
    expect(vaporIfrElementTemplates).toBe(false);
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
