import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  resolveElementTemplatesFlag,
  resolveVueLynxCompilerOptions,
  vueLynxCompilerOptions,
} from '../../../vue-lynx/plugin/src/compiler-options.js';
import { elementTemplateTransform } from '../../../vue-lynx/plugin/src/compiler/element-template-transform.js';
import { resolveVueAlias } from '../../../vue-lynx/plugin/src/vue-alias.js';

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

describe('resolveVueAlias', () => {
  const vueLynxRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../vue-lynx',
  );
  const exportsMap = (
    JSON.parse(
      readFileSync(path.join(vueLynxRoot, 'package.json'), 'utf8'),
    ) as { exports: Record<string, { import: string }> }
  ).exports;

  // An absolute path (not the bare "vue-lynx" specifier) is what lets the
  // alias resolve from importers that can't see vue-lynx in node_modules,
  // e.g. pnpm strict layouts.
  it('aliases vue to the absolute vdom runtime entry', () => {
    const alias = resolveVueAlias(false);
    expect(path.isAbsolute(alias)).toBe(true);
    expect(alias).toBe(path.resolve(vueLynxRoot, exportsMap['.']!.import));
    expect(alias.endsWith(path.join('runtime', 'dist', 'index.js'))).toBe(
      true,
    );
  });

  it('aliases vue to the absolute vapor entry when vapor is enabled', () => {
    const alias = resolveVueAlias(true);
    expect(path.isAbsolute(alias)).toBe(true);
    expect(alias).toBe(
      path.resolve(vueLynxRoot, exportsMap['./vapor']!.import),
    );
    expect(
      alias.endsWith(path.join('runtime', 'dist', 'vapor-app.js')),
    ).toBe(true);
  });
});
