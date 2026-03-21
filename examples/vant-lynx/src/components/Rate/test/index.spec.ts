import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Rate from '../index.vue';

describe('Rate', () => {
  it('should render stars', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { modelValue: 3 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(5);
  });

  it('should render custom count', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Rate, { modelValue: 2, count: 8 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThanOrEqual(8);
  });
});
