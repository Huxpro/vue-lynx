import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Toast from '../index.vue';

describe('Toast', () => {
  it('should render when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'Hello' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Hello',
    );
    expect(hasMessage).toBe(true);
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: false, message: 'Hidden' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Hidden',
    );
    expect(hasMessage).toBe(false);
  });

  it('should render success icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'success', message: 'Done' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });
});
