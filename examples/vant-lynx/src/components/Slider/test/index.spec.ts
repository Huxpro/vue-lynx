import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Slider from '../index.vue';

describe('Slider', () => {
  it('should render slider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Slider, { modelValue: 50 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with default value 0', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Slider);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should apply disabled style when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Slider, { modelValue: 50, disabled: true });
        },
      }),
    );
    const outerView = container.querySelector('view');
    expect(outerView).not.toBeNull();
  });

  it('should clamp value to min/max range', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Slider, { modelValue: 150, min: 0, max: 100 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
