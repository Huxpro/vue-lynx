import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Dialog from '../index.vue';

describe('Dialog', () => {
  it('should render when show is true with title and message', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: true,
            title: 'Test Title',
            message: 'Test Message',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Test Title',
    );
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Test Message',
    );
    expect(hasTitle).toBe(true);
    expect(hasMessage).toBe(true);
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Dialog, {
            show: false,
            title: 'Hidden Title',
            message: 'Hidden Message',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some(
      (t) => t.textContent === 'Hidden Title',
    );
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Hidden Message',
    );
    expect(hasTitle).toBe(false);
    expect(hasMessage).toBe(false);
  });
});
