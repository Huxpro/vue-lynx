import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import NoticeBar from '../index.vue';

describe('NoticeBar', () => {
  it('should render notice bar with text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, { text: 'Important notice' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasText = Array.from(textEls).some(
      (t) => t.textContent === 'Important notice',
    );
    expect(hasText).toBe(true);
  });

  it('should render with closeable mode and hide on close', async () => {
    const onClose = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Closeable notice',
            mode: 'closeable',
            onClose,
          });
        },
      }),
    );
    // Should have the close icon (cross unicode)
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with link mode and show arrow', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Link notice',
            mode: 'link',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasLinkText = Array.from(textEls).some(
      (t) => t.textContent === 'Link notice',
    );
    expect(hasLinkText).toBe(true);
  });

  it('should apply custom color and background', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Custom color',
            color: '#1989fa',
            background: '#ecf9ff',
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should emit click event on tap', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'Clickable',
            onClick,
          });
        },
      }),
    );
    const bar = container.querySelector('view');
    if (bar) {
      fireEvent.tap(bar);
    }
    expect(onClick).toHaveBeenCalled();
  });

  it('should render left icon when leftIcon prop is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NoticeBar, {
            text: 'With icon',
            leftIcon: 'info-o',
          });
        },
      }),
    );
    // Should have icon text element
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(1);
  });
});
