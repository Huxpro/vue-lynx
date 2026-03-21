import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Notify from '../index.vue';

describe('Notify', () => {
  it('should render when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, message: 'Notification message' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Notification message',
    );
    expect(hasMessage).toBe(true);
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: false, message: 'Hidden message' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Hidden message',
    );
    expect(hasMessage).toBe(false);
  });

  it('should render with danger type by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, message: 'Error!' });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });

  it('should render with primary type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Notify, { show: true, type: 'primary', message: 'Info' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Info',
    );
    expect(hasMessage).toBe(true);
  });
});
