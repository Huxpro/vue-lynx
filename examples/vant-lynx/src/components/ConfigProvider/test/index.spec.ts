import { describe, it, expect } from 'vitest';
import { h, defineComponent, inject } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ConfigProvider from '../index.vue';

describe('ConfigProvider', () => {
  it('should render children', () => {
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

  it('should render with dark theme', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ConfigProvider, { theme: 'dark' }, {
            default: () => h('view', null, [h('text', null, 'Dark')]),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with custom theme vars', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            ConfigProvider,
            { themeVars: { '--van-primary-color': '#ff0000' } },
            { default: () => h('view', null, [h('text', null, 'Custom')]) },
          );
        },
      }),
    );
    expect(container).not.toBeNull();
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should provide context to children', () => {
    let injectedConfig: any = null;

    const Consumer = defineComponent({
      setup() {
        injectedConfig = inject('configProvider');
        return () => h('view', null, [h('text', null, 'consumer')]);
      },
    });

    render(
      defineComponent({
        render() {
          return h(
            ConfigProvider,
            { theme: 'dark', zIndex: 3000 },
            { default: () => h(Consumer) },
          );
        },
      }),
    );

    expect(injectedConfig).not.toBeNull();
    expect(injectedConfig.value.theme).toBe('dark');
    expect(injectedConfig.value.zIndex).toBe(3000);
  });

  it('should provide default context values', () => {
    let injectedConfig: any = null;

    const Consumer = defineComponent({
      setup() {
        injectedConfig = inject('configProvider');
        return () => h('view', null, [h('text', null, 'consumer')]);
      },
    });

    render(
      defineComponent({
        render() {
          return h(ConfigProvider, null, { default: () => h(Consumer) });
        },
      }),
    );

    expect(injectedConfig).not.toBeNull();
    expect(injectedConfig.value.theme).toBe('light');
    expect(injectedConfig.value.zIndex).toBe(2000);
  });
});
