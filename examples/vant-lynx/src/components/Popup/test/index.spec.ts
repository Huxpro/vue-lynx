import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Popup from '../index.vue';

describe('Popup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('should change z-index when using z-index prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, zIndex: 10 });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-popup');
    expect(popup).toBeTruthy();
    const style = popup!.getAttribute('style') || '';
    expect(style).toContain('z-index');
  });

  it('should accept lockScroll prop for API compatibility', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, lockScroll: true });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-popup');
    expect(popup).toBeTruthy();
  });

  it('should accept teleport prop for API compatibility', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, teleport: 'body' });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-popup');
    expect(popup).toBeTruthy();
  });

  it('should render overlay by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true });
        },
      }),
    );
    await nextTick();

    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should not render overlay when overlay prop is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, overlay: false });
        },
      }),
    );
    await nextTick();

    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeFalsy();
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
    await nextTick();

    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    fireEvent.tap(overlay!);
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
    await nextTick();
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

    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();
    fireEvent.tap(overlay!);
    await nextTick();
    await nextTick();
    await nextTick();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should change duration when using duration prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, duration: 0.5 });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-popup');
    expect(popup).toBeTruthy();
    const style = popup!.getAttribute('style') || '';
    expect(style).toContain('0.5s');
  });

  it('should have round class when setting the round prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, round: true, position: 'center' });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-popup--round');
    expect(popup).toBeTruthy();
  });

  it('should have round class for bottom position', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, round: true, position: 'bottom' });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-popup--round.van-popup--bottom');
    expect(popup).toBeTruthy();
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
    await nextTick();

    const closeIcon = container.querySelector(
      '.van-popup__close-icon--top-right',
    );
    expect(closeIcon).toBeTruthy();

    fireEvent.tap(closeIcon!);
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
    await nextTick();

    const closeIcon = container.querySelector(
      '.van-popup__close-icon--top-right',
    );
    expect(closeIcon).toBeTruthy();

    fireEvent.tap(closeIcon!);
    await nextTick();
    await nextTick();
    expect(onClickCloseIcon).toHaveBeenCalledTimes(1);
  });

  it('should render correct close icon position when using close-icon-position prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, {
            show: true,
            closeable: true,
            closeIconPosition: 'top-left',
          });
        },
      }),
    );
    await nextTick();

    expect(
      container.querySelector('.van-popup__close-icon--top-left'),
    ).toBeTruthy();
    expect(
      container.querySelector('.van-popup__close-icon--top-right'),
    ).toBeFalsy();
  });

  it('should accept icon-prefix prop for API compatibility', async () => {
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
    await nextTick();

    const closeIcon = container.querySelector(
      '.van-popup__close-icon--top-right',
    );
    expect(closeIcon).toBeTruthy();
  });

  it('should render overlay-content slot correctly', async () => {
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
    await nextTick();

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
    await nextTick();

    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();

    fireEvent.tap(overlay!);
    await nextTick();
    await nextTick();
    expect(onUpdateShow).not.toHaveBeenCalled();

    // Now allow close
    beforeClose.value = () => true;
    await nextTick();

    fireEvent.tap(overlay!);
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
    await nextTick();
    show.value = false;
    await nextTick();
    await nextTick();
    // beforeClose should NOT be called when show changes externally
    expect(beforeClose).toHaveBeenCalledTimes(0);
  });

  it('should have safe-area-inset-top class when using safe-area-inset-top prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, safeAreaInsetTop: true });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-safe-area-top');
    expect(popup).toBeTruthy();
  });

  it('should have safe-area-inset-bottom class when using safe-area-inset-bottom prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, { show: true, safeAreaInsetBottom: true });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-safe-area-bottom');
    expect(popup).toBeTruthy();
  });

  it('should destroy content when using destroyOnClose prop', async () => {
    const show = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Popup,
            { show: show.value, destroyOnClose: true, duration: 0 },
            { default: () => h('text', {}, 'Destroy Me') },
          );
      },
    });

    const { container } = render(Comp);

    // Initially hidden, content should not render (lazyRender)
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

    // Hide popup — content should be destroyed (duration: 0, so immediate)
    show.value = false;
    await nextTick();
    await nextTick();

    textEls = container.querySelectorAll('text');
    hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Destroy Me',
    );
    expect(hasContent).toBe(false);
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

    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();

    fireEvent.tap(overlay!);
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
    await nextTick();

    const overlay = container.querySelector('.van-overlay');
    expect(overlay).toBeTruthy();

    fireEvent.tap(overlay!);
    await nextTick();
    await nextTick();
    expect(onUpdateShow).not.toHaveBeenCalled();
  });

  it('should render with different positions', async () => {
    const positions = ['top', 'bottom', 'left', 'right', 'center'] as const;

    for (const position of positions) {
      const { container } = render(
        defineComponent({
          render() {
            return h(Popup, { show: true, position, overlay: false });
          },
        }),
      );
      await nextTick();

      const popup = container.querySelector(`.van-popup--${position}`);
      expect(popup).toBeTruthy();
    }
  });

  it('should expose popupRef', async () => {
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
    await nextTick();

    expect(popupRef.value).toBeTruthy();
  });

  it('should apply BEM classes correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, {
            show: true,
            position: 'bottom',
            round: true,
            overlay: false,
          });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-popup');
    expect(popup).toBeTruthy();
    expect(popup!.classList.contains('van-popup--bottom')).toBe(true);
    expect(popup!.classList.contains('van-popup--round')).toBe(true);
  });

  it('should use fade animation for center position', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popup, {
            show: true,
            position: 'center',
            overlay: false,
          });
        },
      }),
    );
    await nextTick();

    const popup = container.querySelector('.van-popup--center');
    expect(popup).toBeTruthy();
    const style = popup!.getAttribute('style') || '';
    expect(style).toContain('opacity');
  });

  it('should emit opened after enter animation duration', async () => {
    const onOpened = vi.fn();
    const show = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: show.value,
            onOpened,
          });
      },
    });

    render(Comp);
    show.value = true;
    await nextTick();
    await nextTick();

    // opened fires after default 300ms duration
    expect(onOpened).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onOpened).toHaveBeenCalledTimes(1);
  });

  it('should emit closed after leave animation duration', async () => {
    const onClosed = vi.fn();
    const show = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Popup, {
            show: show.value,
            onClosed,
          });
      },
    });

    render(Comp);
    await nextTick();

    show.value = false;
    await nextTick();
    await nextTick();

    // closed fires after default 300ms duration
    expect(onClosed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});
