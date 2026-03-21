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
    // Should have both icon text and message text
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should render fail icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'fail', message: 'Error' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Error',
    );
    expect(hasMessage).toBe(true);
  });

  it('should render loading type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, type: 'loading', message: 'Loading...' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasMessage = Array.from(textEls).some(
      (t) => t.textContent === 'Loading...',
    );
    expect(hasMessage).toBe(true);
  });

  it('should show overlay when overlay prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'Overlay', overlay: true });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    // Overlay should have a non-transparent background
    expect(style).not.toContain('transparent');
  });

  it('should not show overlay background by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Toast, { show: true, message: 'No Overlay' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    expect(style).toContain('transparent');
  });
});
