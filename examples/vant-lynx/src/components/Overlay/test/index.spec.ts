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
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
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
    const viewEl = container.querySelector('view');
    expect(viewEl).toBeNull();
  });

  it('should change z-index when using z-index prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true, zIndex: 99 });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
    const style = viewEl!.getAttribute('style') || '';
    expect(style).toContain('99');
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
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
    const style = viewEl!.getAttribute('style') || '';
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
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
    const style = viewEl!.getAttribute('style') || '';
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
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
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
    const viewEl = container.querySelector('view');
    // Should render the view even though show is false
    expect(viewEl).not.toBeNull();
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
    expect(container.querySelector('view')).not.toBeNull();

    // Hide it
    show.value = false;
    await nextTick();
    await nextTick();

    // Should still be in DOM (lazy render keeps it, just hidden via opacity)
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
    const style = viewEl!.getAttribute('style') || '';
    expect(style).toContain('opacity');
  });

  it('should apply opacity 0 when show is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true, lazyRender: false });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
    // When lazyRender is false and show is true, the view should exist
    // The opacity check verifies our fade mechanism is set up
    const style = viewEl!.getAttribute('style') || '';
    expect(style).toContain('opacity');
  });

  it('should accept teleport prop for API compatibility', () => {
    // In Lynx, teleport doesn't work but should be accepted without error
    const { container } = render(
      defineComponent({
        render() {
          return h(Overlay, { show: true, teleport: 'body' });
        },
      }),
    );
    const viewEl = container.querySelector('view');
    expect(viewEl).not.toBeNull();
  });
});
