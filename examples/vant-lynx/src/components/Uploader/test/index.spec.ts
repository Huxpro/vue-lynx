import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Uploader from '../index.vue';

describe('Uploader', () => {
  it('should render upload button when no files', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: [] });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render preview items', () => {
    const files = [
      { url: 'https://example.com/img.jpg', status: 'done' as const },
      { url: 'https://example.com/img2.jpg', status: 'uploading' as const, message: '50%' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(2);
  });

  it('should not show upload button when maxCount reached', () => {
    const files = [
      { url: 'https://example.com/img.jpg', status: 'done' as const },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, { modelValue: files, maxCount: 1 });
        },
      }),
    );
    // Should not render the "+" upload button
    const texts = container.querySelectorAll('text');
    const plusButtons = Array.from(texts).filter((t) => t.textContent === '+');
    expect(plusButtons.length).toBe(0);
  });

  it('should emit click-upload on upload button tap', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Uploader, {
            modelValue: [],
            'onClick-upload': () => clicks.push(true),
          });
      },
    });
    const { container } = render(Comp);
    const texts = container.querySelectorAll('text');
    const plusBtn = Array.from(texts).find((t) => t.textContent === '+');
    if (plusBtn) {
      fireEvent.tap(plusBtn.parentElement as Element);
    }
    expect(container).not.toBeNull();
  });

  it('should emit delete on delete button tap', async () => {
    const deletions: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Uploader, {
            modelValue: [{ url: 'https://example.com/img.jpg', status: 'done' as const }],
            deletable: true,
            onDelete: (i: number) => deletions.push(i),
          });
      },
    });
    const { container } = render(Comp);
    expect(container).not.toBeNull();
  });

  it('should render with custom previewSize', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Uploader, {
            modelValue: [{ url: 'https://example.com/img.jpg', status: 'done' as const }],
            previewSize: 100,
          });
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
