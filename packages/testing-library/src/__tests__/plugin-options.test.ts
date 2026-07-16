import { describe, expect, it } from 'vitest';

import { pluginVueLynx } from '../../../vue-lynx/plugin/src/index.js';

interface VueLoaderOptions {
  compilerOptions?: {
    nodeTransforms?: unknown[];
  };
}

function elementTemplatesEnabled(
  options: Parameters<typeof pluginVueLynx>[0],
): boolean {
  const [vuePlugin] = pluginVueLynx(options);
  const bundlerCallbacks: Array<(chain: unknown, context: unknown) => void> = [];

  const setup = vuePlugin.setup as (api: unknown) => void;
  setup({
    context: { callerName: 'rstest' },
    modifyEnvironmentConfig() {},
    modifyBundlerChain(callback: (chain: unknown, context: unknown) => void) {
      bundlerCallbacks.push(callback);
    },
  });

  let loaderOptions: VueLoaderOptions | undefined;
  const vueUse = {
    loader() {
      return vueUse;
    },
    options(options: VueLoaderOptions) {
      loaderOptions = options;
      return vueUse;
    },
  };
  const vueRule = {
    test() {
      return vueRule;
    },
    use() {
      return vueUse;
    },
  };
  const cssRule = {
    test() {
      return cssRule;
    },
  };
  const pluginUse = {
    use() {
      return pluginUse;
    },
  };
  const pluginBefore = {
    before() {
      return pluginUse;
    },
  };
  const chain = {
    resolve: {
      extensions: {
        add() {},
      },
    },
    module: {
      rule(name: string) {
        return name === 'vue' ? vueRule : cssRule;
      },
    },
    plugin() {
      return pluginBefore;
    },
  };

  bundlerCallbacks[0]?.(chain, {
    CHAIN_ID: {
      RULE: { VUE: 'vue', CSS: 'css' },
      USE: { VUE: 'vue-loader' },
      PLUGIN: {
        VUE_LOADER_PLUGIN: 'vue-loader-plugin',
        REACT_FAST_REFRESH: 'react-fast-refresh',
      },
    },
  });

  return Boolean(loaderOptions?.compilerOptions?.nodeTransforms?.length);
}

describe('pluginVueLynx optimization defaults', () => {
  it('keeps element templates off when IFR is off', () => {
    expect(elementTemplatesEnabled({})).toBe(false);
  });

  it('enables element templates by default with IFR', () => {
    expect(elementTemplatesEnabled({ enableIFR: true })).toBe(true);
  });

  it('honors the element templates opt-out with IFR', () => {
    expect(
      elementTemplatesEnabled({
        enableIFR: true,
        enableElementTemplates: false,
      }),
    ).toBe(false);
  });

  it('allows element templates without IFR', () => {
    expect(elementTemplatesEnabled({ enableElementTemplates: true })).toBe(
      true,
    );
  });
});
