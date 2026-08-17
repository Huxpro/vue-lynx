import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ImagePreview from '../index.vue';

describe('ImagePreview', () => {
  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: false,
            images: ['https://example.com/1.jpg'],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // When not shown, minimal DOM
    expect(views.length).toBe(0);
  });

  it('should render when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should show index indicator', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
            showIndex: true,
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const indexText = textEls.find((t) => t.textContent?.includes('1 / 2'));
    expect(indexText).toBeTruthy();
  });

  it('should render close button when closeable', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images: ['https://example.com/1.jpg'],
            closeable: true,
          });
        },
      }),
    );
    // Close button now uses Icon component (renders unicode close char)
    const textEls = Array.from(container.querySelectorAll('text'));
    const closeBtn = textEls.find((t) => {
      const content = t.textContent || '';
      return content === '\u2715' || content === '\u00D7' || content === 'X' || content === '✕';
    });
    expect(closeBtn).toBeTruthy();
  });

  it('should render with custom start position', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images: ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'],
            startPosition: 1,
            showIndex: true,
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const indexText = textEls.find((t) => t.textContent?.includes('2 / 3'));
    expect(indexText).toBeTruthy();
  });
});
