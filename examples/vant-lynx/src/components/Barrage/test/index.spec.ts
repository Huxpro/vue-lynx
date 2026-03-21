import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Barrage from '../index.vue';

describe('Barrage', () => {
  it('should render container', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, { modelValue: [] });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with initial messages', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: [
              { text: 'Hello' },
              { text: 'World' },
            ],
            autoPlay: false,
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });

  it('should render with custom rows', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: [],
            rows: 2,
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with custom duration', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: [],
            duration: 2000,
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });

  it('should render slot content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Barrage,
            { modelValue: [] },
            { default: () => h('view', null, [h('text', null, 'Slot Content')]) },
          );
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const labels = Array.from(texts).map((t) => t.textContent);
    expect(labels.some((t) => t?.includes('Slot Content'))).toBe(true);
  });

  it('should render with delay prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: [],
            delay: 500,
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
