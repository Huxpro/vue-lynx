import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import RollingText from '../index.vue';

const itemWrapperClass = '.van-rolling-text-item__box';
const animateClass = 'van-rolling-text-item__box--animate';

function later(ms = 0) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function mountRollingText(props: Record<string, unknown> = {}) {
  return render(
    defineComponent({
      render() {
        return h(RollingText, { ...props, ref: 'rt' });
      },
    }),
  );
}

describe('RollingText', () => {
  it('should render comp', () => {
    const { container } = mountRollingText({
      startNum: 0,
      targetNum: 123,
    });
    // Should render 3 digit columns (1, 2, 3)
    const items = container.querySelectorAll('.van-rolling-text-item');
    expect(items.length).toBe(3);
    // Each column should have a box with figures
    const boxes = container.querySelectorAll('.van-rolling-text-item__box');
    expect(boxes.length).toBe(3);
  });

  it('should start rolling when auto-start prop is true', () => {
    const { container } = mountRollingText({
      startNum: 0,
      targetNum: 123,
      autoStart: true,
    });
    const box = container.querySelector(itemWrapperClass);
    expect(box).toBeTruthy();
    expect(box!.classList.contains(animateClass)).toBe(true);
  });

  it('should not start rolling when auto-start prop is false', () => {
    const { container } = mountRollingText({
      startNum: 0,
      targetNum: 123,
      autoStart: false,
    });
    const box = container.querySelector(itemWrapperClass);
    expect(box).toBeTruthy();
    expect(box!.classList.contains(animateClass)).toBe(false);
  });

  it('should start rolling after calling the start method', async () => {
    const rtRef = { value: null as any };
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(RollingText, {
              startNum: 0,
              targetNum: 123,
              autoStart: false,
              ref: (el: any) => {
                rtRef.value = el;
              },
            });
        },
      }),
    );
    const box = container.querySelector(itemWrapperClass);
    expect(box!.classList.contains(animateClass)).toBe(false);

    rtRef.value?.start();
    await nextTick();
    const boxAfter = container.querySelector(itemWrapperClass);
    expect(boxAfter!.classList.contains(animateClass)).toBe(true);
  });

  it('should reset the animation after calling the reset method', async () => {
    const rtRef = { value: null as any };
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(RollingText, {
              startNum: 0,
              targetNum: 123,
              autoStart: false,
              ref: (el: any) => {
                rtRef.value = el;
              },
            });
        },
      }),
    );

    rtRef.value?.start();
    await nextTick();
    expect(
      container.querySelector(itemWrapperClass)!.classList.contains(animateClass),
    ).toBe(true);

    rtRef.value?.reset();
    await nextTick();
    expect(
      container.querySelector(itemWrapperClass)!.classList.contains(animateClass),
    ).toBe(false);
  });

  it('should restart rolling after calling the reset method when auto-start prop is true', async () => {
    vi.useFakeTimers();
    const rtRef = { value: null as any };
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(RollingText, {
              startNum: 0,
              targetNum: 123,
              autoStart: true,
              ref: (el: any) => {
                rtRef.value = el;
              },
            });
        },
      }),
    );

    // Initially rolling due to autoStart
    expect(
      container.querySelector(itemWrapperClass)!.classList.contains(animateClass),
    ).toBe(true);

    rtRef.value?.reset();
    await nextTick();
    // After reset, animation is stopped
    expect(
      container.querySelector(itemWrapperClass)!.classList.contains(animateClass),
    ).toBe(false);

    // After setTimeout(0), autoStart restarts animation
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(
      container.querySelector(itemWrapperClass)!.classList.contains(animateClass),
    ).toBe(true);
    vi.useRealTimers();
  });

  it('should render correct number of items for textList mode', () => {
    const { container } = mountRollingText({
      textList: ['aaaaa', 'bbbbb', 'ccccc'],
      autoStart: false,
    });
    // 5 characters per text → 5 columns
    const items = container.querySelectorAll('.van-rolling-text-item');
    expect(items.length).toBe(5);
  });

  it('should render with direction down class', () => {
    const { container } = mountRollingText({
      startNum: 0,
      targetNum: 99,
      direction: 'down',
      autoStart: false,
    });
    const item = container.querySelector('.van-rolling-text-item--down');
    expect(item).toBeTruthy();
  });

  it('should render with direction up class', () => {
    const { container } = mountRollingText({
      startNum: 0,
      targetNum: 99,
      direction: 'up',
      autoStart: false,
    });
    const item = container.querySelector('.van-rolling-text-item--up');
    expect(item).toBeTruthy();
  });

  it('should set custom height', () => {
    const { container } = mountRollingText({
      startNum: 0,
      targetNum: 5,
      height: 60,
      autoStart: false,
    });
    const item = container.querySelector('.van-rolling-text-item');
    expect(item).toBeTruthy();
    // Height is set via inline style
    const style = (item as HTMLElement).style;
    expect(style.height).toBe('60px');
  });
});
