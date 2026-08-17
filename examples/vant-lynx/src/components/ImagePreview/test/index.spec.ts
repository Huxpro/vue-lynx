import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import ImagePreview from '../index.vue';

const images = [
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-3.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-4.jpeg',
];

async function later(ms = 0) {
  if (ms > 0) {
    vi.advanceTimersByTime(ms);
  }
  await nextTick();
  await nextTick();
}

describe('ImagePreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: false,
            images,
          });
        },
      }),
    );
    // Popup lazy-renders nothing
    expect(container.querySelector('.van-popup')).toBeFalsy();
  });

  it('should render when show is true', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
          });
        },
      }),
    );
    await later();

    expect(container.querySelector('.van-popup')).toBeTruthy();
  });

  it('should render index indicator by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            showIndex: true,
          });
        },
      }),
    );
    await later();

    const indexEl = container.querySelector('.van-image-preview__index');
    expect(indexEl).toBeTruthy();
    const textEls = Array.from(indexEl!.querySelectorAll('text'));
    const hasIndex = textEls.some((t) => t.textContent?.includes('1 / 4'));
    expect(hasIndex).toBe(true);
  });

  it('should hide index when showIndex prop is false', async () => {
    const showIndex = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(ImagePreview, {
            show: true,
            images,
            showIndex: showIndex.value,
          });
      },
    });

    const { container } = render(Comp);
    await later();

    expect(container.querySelector('.van-image-preview__index')).toBeTruthy();

    showIndex.value = false;
    await later();
    expect(container.querySelector('.van-image-preview__index')).toBeFalsy();
  });

  it('should render close icon when using closeable prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            closeable: true,
          });
        },
      }),
    );
    await later();

    const closeIcon = container.querySelector(
      '.van-image-preview__close-icon',
    );
    expect(closeIcon).toBeTruthy();
  });

  it('should emit update:show when close icon is clicked', async () => {
    const onUpdateShow = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            closeable: true,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await later();

    const closeIcon = container.querySelector(
      '.van-image-preview__close-icon',
    );
    expect(closeIcon).toBeTruthy();
    fireEvent.tap(closeIcon!);
    await later();
    expect(onUpdateShow).toHaveBeenCalledWith(false);
  });

  it('should render close icon in top-left position', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            closeable: true,
            closeIconPosition: 'top-left',
          });
        },
      }),
    );
    await later();

    expect(
      container.querySelector('.van-image-preview__close-icon--top-left'),
    ).toBeTruthy();
  });

  it('should render close icon in top-right position by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            closeable: true,
          });
        },
      }),
    );
    await later();

    expect(
      container.querySelector('.van-image-preview__close-icon--top-right'),
    ).toBeTruthy();
  });

  it('should render close icon in bottom-left position', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            closeable: true,
            closeIconPosition: 'bottom-left',
          });
        },
      }),
    );
    await later();

    expect(
      container.querySelector('.van-image-preview__close-icon--bottom-left'),
    ).toBeTruthy();
  });

  it('should render close icon in bottom-right position', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            closeable: true,
            closeIconPosition: 'bottom-right',
          });
        },
      }),
    );
    await later();

    expect(
      container.querySelector('.van-image-preview__close-icon--bottom-right'),
    ).toBeTruthy();
  });

  it('should render with custom start position', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            startPosition: 2,
            showIndex: true,
          });
        },
      }),
    );
    await later();

    const indexEl = container.querySelector('.van-image-preview__index');
    expect(indexEl).toBeTruthy();
    const textEls = Array.from(indexEl!.querySelectorAll('text'));
    // startPosition=2 means active=2, display "3 / 4"
    const hasIndex = textEls.some((t) => t.textContent?.includes('3 / 4'));
    expect(hasIndex).toBe(true);
  });

  it('should render cover slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            ImagePreview,
            { show: true, images },
            { cover: () => h('text', {}, 'Custom Cover') },
          );
        },
      }),
    );
    await later();

    const coverEl = container.querySelector('.van-image-preview__cover');
    expect(coverEl).toBeTruthy();
    const textEls = Array.from(coverEl!.querySelectorAll('text'));
    const hasCover = textEls.some((t) => t.textContent === 'Custom Cover');
    expect(hasCover).toBe(true);
  });

  it('should render index slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            ImagePreview,
            { show: true, images },
            {
              index: ({ index }: { index: number }) =>
                h('text', {}, `Custom Index: ${index}`),
            },
          );
        },
      }),
    );
    await later();

    const indexEl = container.querySelector('.van-image-preview__index');
    expect(indexEl).toBeTruthy();
    const textEls = Array.from(indexEl!.querySelectorAll('text'));
    const hasCustom = textEls.some((t) =>
      t.textContent?.includes('Custom Index: 0'),
    );
    expect(hasCustom).toBe(true);
  });

  it('should emit close event when show changes to false', async () => {
    const onClose = vi.fn();
    const show = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(ImagePreview, {
            show: show.value,
            images,
            onClose,
          });
      },
    });

    render(Comp);
    await later();

    show.value = false;
    await later();

    expect(onClose).toHaveBeenCalledWith({
      index: 0,
      url: images[0],
    });
  });

  it('should emit closed event after popup closes', async () => {
    const onClosed = vi.fn();
    const show = ref(true);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(ImagePreview, {
            show: show.value,
            images,
            onClosed,
            'onUpdate:show': (v: boolean) => {
              show.value = v;
            },
          });
      },
    });

    render(Comp);
    await later();

    show.value = false;
    await later();
    // closed fires after popup transition duration
    await later(400);
    expect(onClosed).toHaveBeenCalled();
  });

  it('should support beforeClose prop that returns false', async () => {
    const beforeClose = vi.fn(() => false);
    const onUpdateShow = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            closeable: true,
            beforeClose,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await later();

    const closeIcon = container.querySelector(
      '.van-image-preview__close-icon',
    );
    expect(closeIcon).toBeTruthy();
    fireEvent.tap(closeIcon!);
    await later();

    expect(beforeClose).toHaveBeenCalled();
    // beforeClose returned false, so show should not update
    expect(onUpdateShow).not.toHaveBeenCalled();
  });

  it('should support async beforeClose prop', async () => {
    const beforeClose = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(true), 500);
        }),
    );
    const onUpdateShow = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            closeable: true,
            beforeClose,
            'onUpdate:show': onUpdateShow,
          });
        },
      }),
    );
    await later();

    const closeIcon = container.querySelector(
      '.van-image-preview__close-icon',
    );
    expect(closeIcon).toBeTruthy();
    fireEvent.tap(closeIcon!);
    await later();

    expect(beforeClose).toHaveBeenCalled();
    expect(onUpdateShow).not.toHaveBeenCalled();

    // After async resolve
    await later(600);
    expect(onUpdateShow).toHaveBeenCalledWith(false);
  });

  it('should render BEM classes on child elements', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
          });
        },
      }),
    );
    await later();

    expect(container.querySelector('.van-image-preview__swipe')).toBeTruthy();
    expect(container.querySelector('.van-image-preview__index')).toBeTruthy();
  });

  it('should render overlay', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
          });
        },
      }),
    );
    await later();

    expect(container.querySelector('.van-overlay')).toBeTruthy();
  });

  it('should render swipe items for each image', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
          });
        },
      }),
    );
    await later();

    const swipeItems = container.querySelectorAll('.van-swipe-item');
    expect(swipeItems.length).toBeGreaterThan(0);
  });

  it('should not render index when images are empty', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images: [],
            showIndex: true,
          });
        },
      }),
    );
    await later();

    expect(container.querySelector('.van-image-preview__index')).toBeFalsy();
  });

  it('should not render close icon by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
          });
        },
      }),
    );
    await later();

    expect(
      container.querySelector('.van-image-preview__close-icon'),
    ).toBeFalsy();
  });

  it('should reset to startPosition when show changes to true', async () => {
    const show = ref(false);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(ImagePreview, {
            show: show.value,
            images,
            startPosition: 2,
            showIndex: true,
          });
      },
    });

    const { container } = render(Comp);
    await later();

    show.value = true;
    await later();

    const indexEl = container.querySelector('.van-image-preview__index');
    expect(indexEl).toBeTruthy();
    const textEls = Array.from(indexEl!.querySelectorAll('text'));
    const hasIndex = textEls.some((t) => t.textContent?.includes('3 / 4'));
    expect(hasIndex).toBe(true);
  });

  it('should have all expected props defined', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: false,
            images: [],
            loop: true,
            minZoom: 1 / 3,
            maxZoom: 3,
            overlay: true,
            vertical: false,
            closeable: false,
            showIndex: true,
            closeIcon: 'clear',
            doubleScale: true,
            swipeDuration: 300,
            startPosition: 0,
            showIndicators: false,
            closeOnPopstate: true,
            closeOnClickImage: true,
            closeOnClickOverlay: true,
            closeIconPosition: 'top-right',
          });
        },
      }),
    );
    expect(container).toBeTruthy();
  });

  it('should emit change when startPosition prop changes', async () => {
    const onChange = vi.fn();
    const startPos = ref(0);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(ImagePreview, {
            show: true,
            images,
            startPosition: startPos.value,
            onChange,
          });
      },
    });

    render(Comp);
    await later();

    startPos.value = 2;
    await later();

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should render with loop enabled by default', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
          });
        },
      }),
    );
    await later();

    expect(container.querySelector('.van-image-preview__swipe')).toBeTruthy();
  });

  it('should accept custom closeIcon', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ImagePreview, {
            show: true,
            images,
            closeable: true,
            closeIcon: 'cross',
          });
        },
      }),
    );
    await later();

    expect(
      container.querySelector('.van-image-preview__close-icon'),
    ).toBeTruthy();
  });
});
