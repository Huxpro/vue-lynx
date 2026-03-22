import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Overlay from '../index.vue';

describe('Overlay', () => {
  it('should render when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should not render when show is false (lazy render)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: false });
        },
      }),
    );
    // With lazyRender=true (default), overlay should not render until first shown
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeNull();
  });

  it('should change z-index when using z-index prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true, zIndex: 99 });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    const style = overlay!.getAttribute('style') || '';
    expect(style).toContain('99');
  });

  it('should allow to custom class name with class-name prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true, className: 'foo' });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay!.classList.contains('foo')).toBe(true);
  });

  it('should allow to custom style with custom-style prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, {
            show: true,
            customStyle: { backgroundColor: 'red' },
          });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    const style = overlay!.getAttribute('style') || '';
    expect(style).toContain('red');
  });

  it('should change animation duration when using duration prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true, duration: 1 });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    const style = overlay!.getAttribute('style') || '';
    expect(style).toContain('1s');
  });

  it('should render default slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true }, {
            default: () => h('text', {}, 'Custom Default'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const slotText = Array.from(textEls).find(
      (t) => t.textContent === 'Custom Default',
    );
    expect(slotText).toBeTruthy();
  });

  it('should emit click on tap', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Overlay, {
            show: true,
            onClick: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const overlay = container.querySelector('.van-overlay')!;
    fireEvent.tap(overlay);
    await nextTick();
    await nextTick();
    expect(clicks.length).toBe(1);
  });

  it('should allow to disable lazy-render', () => {
    const { container } = render(
      defineComponent({
        render() {
          // lazyRender=false means overlay should render even when show=false
          return h(Overlay, { show: false, lazyRender: false });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    // Should render the view even though show is false
    expect(overlay).toBeTruthy();
  });

  it('should remain rendered after being shown once (lazy render keeps element)', async () => {
    const show = ref(true);
    const Comp = defineComponent({
      setup() {
        return () => h(Overlay, { show: show.value });
      },
    });

    const { container } = render(Comp);
    // Initially shown
    expect(container.querySelector('.van-overlay')).toBeTruthy();

    // Hide it
    show.value = false;
    await nextTick();
    await nextTick();

    // Should still be in DOM (lazy render keeps it, just hidden via opacity)
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    const style = overlay!.getAttribute('style') || '';
    expect(style).toContain('opacity');
  });

  it('should apply opacity 0 when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: false, lazyRender: false });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    const style = overlay!.getAttribute('style') || '';
    expect(style).toContain('opacity');
  });

  it('should accept teleport prop for API compatibility', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true, teleport: 'body' });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should accept lockScroll prop for API compatibility', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true, lockScroll: false });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should apply van-overlay class from BEM', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true });
        },
      }),
    );
    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay!.classList.contains('van-overlay')).toBe(true);
  });
});
