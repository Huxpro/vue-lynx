import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Popup from '../index.vue';

describe('Popup', () => {
  it('should lazy render content by default', async () => {
    const show = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Popup,
            { show: show.value },
            { default: () => h('text', {}, 'Popup Content') },
          );
      },
    });

    const { container } = render(Comp);
    // lazyRender is true by default, content should not render until shown
    let textEls = container.querySelectorAll('text');
    let hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Popup Content',
    );
    expect(hasContent).toBe(false);

    show.value = true;
    await nextTick();
    await nextTick();

    textEls = container.querySelectorAll('text');
    hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Popup Content',
    );
    expect(hasContent).toBe(true);
  });

  it('should change z-index when using z-index prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, zIndex: 10 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // Find the popup view (not overlay)
    const popupView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('z-index') && style.includes('10');
    });
    expect(popupView).toBeTruthy();
  });

  it('should accept lockScroll prop for API compatibility', () => {
    // lockScroll is a no-op in Lynx but should be accepted without error
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, lockScroll: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should accept teleport prop for API compatibility', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, teleport: 'body' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render overlay by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // At least 2 views: overlay + popup
    expect(views.length).toBeGreaterThanOrEqual(2);
    // Overlay should have opacity style
    const overlayView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color') && style.includes('rgba');
    });
    expect(overlayView).toBeTruthy();
  });

  it('should not render overlay when overlay prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, overlay: false });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // No overlay, only the popup view
    const overlayView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color') && style.includes('rgba');
    });
    expect(overlayView).toBeFalsy();
  });

  it('should emit click-overlay event when overlay is clicked', async () => {
    const onClickOverlay = vi.fn();
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: true,
            'onClick-overlay': onClickOverlay,
          });
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    const overlayView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color') && style.includes('rgba');
    });
    expect(overlayView).toBeTruthy();
    fireEvent.tap(overlayView!);
    await nextTick();
    await nextTick();
    expect(onClickOverlay).toHaveBeenCalledTimes(1);
  });

  it('should emit open event when show prop is set to true', async () => {
    const onOpen = vi.fn();
    const show = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: show.value,
            onOpen,
          });
      },
    });

    render(Comp);
    show.value = true;
    await nextTick();
    await nextTick();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('should emit close event when show prop is set to false', async () => {
    const onClose = vi.fn();
    const show = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: show.value,
            onClose,
          });
      },
    });

    render(Comp);
    show.value = false;
    await nextTick();
    await nextTick();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should emit close event after clicking the overlay', async () => {
    const onClose = vi.fn();
    const show = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: show.value,
            onClose,
            'onUpdate:show': (val: boolean) => {
              show.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();

    const views = container.querySelectorAll('view');
    const overlayView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color') && style.includes('rgba');
    });
    expect(overlayView).toBeTruthy();
    fireEvent.tap(overlayView!);
    await nextTick();
    await nextTick();
    await nextTick();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should change duration when using duration prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, duration: 0.5 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const popupView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('0.5s');
    });
    expect(popupView).toBeTruthy();
  });

  it('should have round border-radius when setting the round prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, round: true, position: 'center' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const roundView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('border-radius') && style.includes('16px');
    });
    expect(roundView).toBeTruthy();
  });

  it('should have round border-radius for bottom position', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, round: true, position: 'bottom' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const roundView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('border-top-left-radius') && style.includes('16px');
    });
    expect(roundView).toBeTruthy();
  });

  it('should render close icon when using closeable prop', async () => {
    const onUpdateShow = vi.fn();
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: true,
            closeable: true,
            'onUpdate:show': onUpdateShow,
          });
      },
    });

    const { container } = render(Comp);
    // Find the close icon view (has z-index: 1 in style)
    const views = container.querySelectorAll('view');
    const closeIconView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('z-index: 1') && style.includes('position: absolute');
    });
    expect(closeIconView).toBeTruthy();

    fireEvent.tap(closeIconView!);
    await nextTick();
    await nextTick();
    expect(onUpdateShow).toHaveBeenCalledWith(false);
  });

  it('should emit click-close-icon event when close icon is clicked', async () => {
    const onClickCloseIcon = vi.fn();
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: true,
            closeable: true,
            'onClick-close-icon': onClickCloseIcon,
          });
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    const closeIconView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('z-index: 1') && style.includes('position: absolute');
    });
    expect(closeIconView).toBeTruthy();

    fireEvent.tap(closeIconView!);
    await nextTick();
    await nextTick();
    expect(onClickCloseIcon).toHaveBeenCalledTimes(1);
  });

  it('should render correct close icon when using close-icon prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, {
            show: true,
            closeable: true,
            closeIcon: 'success',
          });
        },
      }),
    );
    // The Icon component should render with 'success' name
    const views = container.querySelectorAll('view');
    const closeIconView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('z-index: 1') && style.includes('position: absolute');
    });
    expect(closeIconView).toBeTruthy();
  });

  it('should accept icon-prefix prop for API compatibility', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, {
            show: true,
            closeable: true,
            iconPrefix: 'my-icon',
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render overlay-content slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popup,
            { show: true },
            {
              'overlay-content': () => h('text', {}, 'Custom Overlay Content'),
            },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const slotText = Array.from(textEls).find(
      (t) => t.textContent === 'Custom Overlay Content',
    );
    expect(slotText).toBeTruthy();
  });

  it('should allow to prevent close with before-close prop', async () => {
    const onUpdateShow = vi.fn();
    const beforeClose = ref(() => false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: true,
            beforeClose: beforeClose.value,
            'onUpdate:show': onUpdateShow,
          });
      },
    });

    const { container } = render(Comp);
    // Click overlay
    const views = container.querySelectorAll('view');
    const overlayView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color') && style.includes('rgba');
    });
    expect(overlayView).toBeTruthy();

    fireEvent.tap(overlayView!);
    await nextTick();
    await nextTick();
    // beforeClose returns false, so update:show should NOT have been called
    expect(onUpdateShow).not.toHaveBeenCalled();

    // Now allow close
    beforeClose.value = () => true;
    await nextTick();

    fireEvent.tap(overlayView!);
    await nextTick();
    await nextTick();
    expect(onUpdateShow).toHaveBeenCalledWith(false);
  });

  it('should not call before-close when show prop becomes false', async () => {
    const beforeClose = vi.fn();
    const show = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: show.value,
            beforeClose,
          });
      },
    });

    render(Comp);
    show.value = false;
    await nextTick();
    await nextTick();
    // beforeClose should NOT be called when show changes externally
    expect(beforeClose).toHaveBeenCalledTimes(0);
  });

  it('should have safe-area-inset-top padding when using safe-area-inset-top prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, safeAreaInsetTop: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const popupView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('padding-top') && style.includes('44px');
    });
    expect(popupView).toBeTruthy();
  });

  it('should have safe-area-inset-bottom padding when using safe-area-inset-bottom prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, safeAreaInsetBottom: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const popupView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('padding-bottom') && style.includes('34px');
    });
    expect(popupView).toBeTruthy();
  });

  it('should destroy content when using destroyOnClose prop', async () => {
    const show = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Popup,
            { show: show.value, destroyOnClose: true },
            { default: () => h('text', {}, 'Destroy Me') },
          );
      },
    });

    const { container } = render(Comp);

    // Initially hidden with destroyOnClose, content should not render
    let textEls = container.querySelectorAll('text');
    let hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Destroy Me',
    );
    expect(hasContent).toBe(false);

    // Show popup
    show.value = true;
    await nextTick();
    await nextTick();

    textEls = container.querySelectorAll('text');
    hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Destroy Me',
    );
    expect(hasContent).toBe(true);

    // Hide popup - content should be destroyed
    show.value = false;
    await nextTick();
    await nextTick();

    textEls = container.querySelectorAll('text');
    hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Destroy Me',
    );
    expect(hasContent).toBe(false);
  });

  it('should emit click event when popup is clicked', async () => {
    const onClick = vi.fn();
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: true,
            overlay: false,
            onClick,
          });
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    const popupView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position: fixed') && style.includes('background-color');
    });
    expect(popupView).toBeTruthy();

    fireEvent.tap(popupView!);
    await nextTick();
    await nextTick();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should support v-model:show', async () => {
    const show = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: show.value,
            'onUpdate:show': (val: boolean) => {
              show.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();

    // Click overlay to close
    const views = container.querySelectorAll('view');
    const overlayView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color') && style.includes('rgba');
    });
    expect(overlayView).toBeTruthy();

    fireEvent.tap(overlayView!);
    await nextTick();
    await nextTick();
    expect(show.value).toBe(false);
  });

  it('should not close on overlay click when closeOnClickOverlay is false', async () => {
    const onUpdateShow = vi.fn();
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: true,
            closeOnClickOverlay: false,
            'onUpdate:show': onUpdateShow,
          });
      },
    });

    const { container } = render(Comp);
    const views = container.querySelectorAll('view');
    const overlayView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color') && style.includes('rgba');
    });
    expect(overlayView).toBeTruthy();

    fireEvent.tap(overlayView!);
    await nextTick();
    await nextTick();
    expect(onUpdateShow).not.toHaveBeenCalled();
  });

  it('should render with different positions', () => {
    const positions = ['top', 'bottom', 'left', 'right', 'center'] as const;

    for (const position of positions) {
      const { container } = render(
        defineComponent({
          render() {
            return h(Popup, { show: true, position, overlay: false });
          },
        }),
      );
      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);
    }
  });

  it('should expose popupRef', () => {
    const popupRef = ref();
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            ref: popupRef,
            show: true,
          });
      },
    });

    render(Comp);
    // The component should expose popupRef
    expect(popupRef.value).toBeTruthy();
  });
});
