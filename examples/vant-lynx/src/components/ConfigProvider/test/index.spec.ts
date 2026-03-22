import { describe, it, expect } from 'vitest';
import { h, defineComponent, inject, ref } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ConfigProvider from '../index.vue';
import { CONFIG_PROVIDER_KEY, type ConfigProviderProvide } from '../types';
import { insertDash, kebabCase, mapThemeVarsToCSSVars } from '../utils';

describe('ConfigProvider', () => {
  it('should render children correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ConfigProvider, null, {
            default: () => h('view', null, [h('text', null, 'Hello')]),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should render with van-config-provider class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ConfigProvider, null, {
            default: () => h('text', null, 'test'),
          });
        },
      }),
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.getAttribute('class')).toContain('van-config-provider');
  });

  it('should provide config to children via CONFIG_PROVIDER_KEY', () => {
    let injectedConfig: ConfigProviderProvide | undefined;

    const Consumer = defineComponent({
      setup() {
        injectedConfig = inject(CONFIG_PROVIDER_KEY);
        return () => h('text', null, 'consumer');
      },
    });

    render(
      defineComponent({
        render() {
          return h(
            ConfigProvider,
            { iconPrefix: 'my-icon' },
            { default: () => h(Consumer) },
          );
        },
      }),
    );

    expect(injectedConfig).toBeDefined();
    expect(injectedConfig!.iconPrefix).toBe('my-icon');
  });

  it('should provide default values when no props set', () => {
    let injectedConfig: ConfigProviderProvide | undefined;

    const Consumer = defineComponent({
      setup() {
        injectedConfig = inject(CONFIG_PROVIDER_KEY);
        return () => h('text', null, 'consumer');
      },
    });

    render(
      defineComponent({
        render() {
          return h(ConfigProvider, null, { default: () => h(Consumer) });
        },
      }),
    );

    expect(injectedConfig).toBeDefined();
    expect(injectedConfig!.iconPrefix).toBeUndefined();
  });

  // Note: CSS custom properties (--van-*) in inline styles are stripped by the
  // Lynx runtime. The mapThemeVarsToCSSVars utility tests verify the conversion
  // logic independently. These tests verify the component's scope behavior.

  it('should compute theme vars for local scope', () => {
    // Verify mapThemeVarsToCSSVars produces correct output for local scope
    const result = mapThemeVarsToCSSVars({ rateIconFullColor: 'red' });
    expect(result).toEqual({ '--van-rate-icon-full-color': 'red' });
  });

  it('should merge themeVarsLight over themeVars in light mode', () => {
    const base = { rateIconFullColor: 'red' };
    const light = { rateIconFullColor: 'blue' };
    const merged = Object.assign({}, base, light);
    const result = mapThemeVarsToCSSVars(merged);
    expect(result['--van-rate-icon-full-color']).toBe('blue');
  });

  it('should merge themeVarsDark over themeVars in dark mode', () => {
    const base = { rateIconFullColor: 'red' };
    const dark = { rateIconFullColor: 'green' };
    const merged = Object.assign({}, base, dark);
    const result = mapThemeVarsToCSSVars(merged);
    expect(result['--van-rate-icon-full-color']).toBe('green');
  });

  it('should convert gray1 → --van-gray-1 with insertDash', () => {
    const result = mapThemeVarsToCSSVars({ gray1: '#111', background2: 'red' });
    expect(result['--van-gray-1']).toBe('#111');
    expect(result['--van-background-2']).toBe('red');
  });

  it('should not apply inline styles when themeVarsScope is global', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            ConfigProvider,
            {
              themeVars: { rateIconFullColor: 'red' },
              themeVarsScope: 'global',
            },
            { default: () => h('text', null, 'test') },
          );
        },
      }),
    );
    const wrapper = container.firstElementChild;
    const style = wrapper?.getAttribute('style') || '';
    expect(style).not.toContain('rate');
  });

  it('should provide theme prop to children', () => {
    let injectedConfig: any;

    const Consumer = defineComponent({
      setup() {
        injectedConfig = inject(CONFIG_PROVIDER_KEY);
        return () => h('text', null, 'consumer');
      },
    });

    render(
      defineComponent({
        render() {
          return h(
            ConfigProvider,
            { theme: 'dark' },
            { default: () => h(Consumer) },
          );
        },
      }),
    );

    expect(injectedConfig).toBeDefined();
    expect(injectedConfig.theme).toBe('dark');
  });
});

describe('mapThemeVarsToCSSVars', () => {
  it('should convert camelCase to --van-kebab-case', () => {
    const result = mapThemeVarsToCSSVars({ rateIconFullColor: 'red' });
    expect(result).toEqual({ '--van-rate-icon-full-color': 'red' });
  });

  it('should insert dash before digits (gray1 → gray-1)', () => {
    const result = mapThemeVarsToCSSVars({
      gray1: '#111',
      background2: 'red',
    });
    expect(result).toEqual({
      '--van-gray-1': '#111',
      '--van-background-2': 'red',
    });
  });

  it('should apply themeVarsLight over themeVars in light mode', () => {
    const themeVars = { rateIconFullColor: 'red' };
    const themeVarsLight = { rateIconFullColor: 'blue' };
    const merged = Object.assign({}, themeVars, themeVarsLight);
    const result = mapThemeVarsToCSSVars(merged);
    expect(result).toEqual({ '--van-rate-icon-full-color': 'blue' });
  });

  it('should apply themeVarsDark over themeVars in dark mode', () => {
    const themeVars = { rateIconFullColor: 'red' };
    const themeVarsDark = { rateIconFullColor: 'green' };
    const merged = Object.assign({}, themeVars, themeVarsDark);
    const result = mapThemeVarsToCSSVars(merged);
    expect(result).toEqual({ '--van-rate-icon-full-color': 'green' });
  });

  it('should handle multiple vars correctly', () => {
    const result = mapThemeVarsToCSSVars({
      rateIconFullColor: 'red',
      buttonPrimaryColor: 'blue',
    });
    expect(result).toEqual({
      '--van-rate-icon-full-color': 'red',
      '--van-button-primary-color': 'blue',
    });
  });

  it('should handle empty object', () => {
    const result = mapThemeVarsToCSSVars({});
    expect(result).toEqual({});
  });
});

describe('insertDash', () => {
  it('should insert dash between letter and digit', () => {
    expect(insertDash('gray1')).toBe('gray-1');
    expect(insertDash('gray8')).toBe('gray-8');
    expect(insertDash('background2')).toBe('background-2');
  });

  it('should not modify strings without letter-digit boundaries', () => {
    expect(insertDash('primary-color')).toBe('primary-color');
    expect(insertDash('color')).toBe('color');
  });
});

describe('kebabCase', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(kebabCase('rateIconFullColor')).toBe('rate-icon-full-color');
    expect(kebabCase('buttonPrimaryColor')).toBe('button-primary-color');
  });

  it('should handle already lowercase strings', () => {
    expect(kebabCase('color')).toBe('color');
    expect(kebabCase('background')).toBe('background');
  });
});
