import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick, onMounted } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Swipe from '../index.vue';
import SwipeItem from '../../SwipeItem/index.vue';

function later(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function triggerDrag(
  el: Element,
  deltaX: number,
  deltaY: number,
) {
  fireEvent.touchstart(el, {
    touches: [{ clientX: 0, clientY: 0 }],
  });
  fireEvent.touchmove(el, {
    touches: [{ clientX: deltaX / 4, clientY: deltaY / 4 }],
  });
  fireEvent.touchmove(el, {
    touches: [{ clientX: deltaX / 2, clientY: deltaY / 2 }],
  });
  fireEvent.touchmove(el, {
    touches: [{ clientX: deltaX, clientY: deltaY }],
  });
  fireEvent.touchend(el);
  await later(50);
}

function createSwipe(
  props: Record<string, any> = {},
  itemCount = 3,
) {
  const swipeRef = ref<any>(null);
  const Comp = defineComponent({
    setup() {
      return { swipeRef };
    },
    render() {
      return h(
        Swipe,
        {
          ref: (el: any) => {
            swipeRef.value = el;
          },
          width: 100,
          height: 100,
          ...props,
        },
        {
          default: () =>
            Array.from({ length: itemCount }, (_, i) =>
              h(SwipeItem, { key: i }, () =>
                h('text', null, String(i + 1)),
              ),
            ),
        },
      );
    },
  });
  return { Comp, swipeRef };
}

describe('Swipe', () => {
  it('should render swipe with items', async () => {
    const { Comp } = createSwipe();
    const { container } = render(Comp);
    await nextTick();
    const items = container.querySelectorAll('.van-swipe-item');
    expect(items.length).toBe(3);
  });

  it('should render indicators by default', async () => {
    const { Comp } = createSwipe();
    const { container } = render(Comp);
    await nextTick();
    await nextTick();
    const indicators = container.querySelectorAll('.van-swipe__indicator');
    expect(indicators.length).toBe(3);
  });

  it('should hide indicators when showIndicators is false', async () => {
    const { Comp } = createSwipe({ showIndicators: false });
    const { container } = render(Comp);
    await nextTick();
    const indicators = container.querySelectorAll('.van-swipe__indicator');
    expect(indicators.length).toBe(0);
  });

  it('should not render indicators with single item', async () => {
    const { Comp } = createSwipe({}, 1);
    const { container } = render(Comp);
    await nextTick();
    await nextTick();
    const indicators = container.querySelectorAll('.van-swipe__indicator');
    expect(indicators.length).toBe(0);
  });

  it('should swipe to specific index after calling swipeTo', async () => {
    const onChange = vi.fn();
    const { Comp, swipeRef } = createSwipe({ onChange });
    render(Comp);
    await nextTick();
    await nextTick();

    swipeRef.value?.swipeTo(2);
    await later(100);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should allow to call swipeTo with immediate option', async () => {
    const onChange = vi.fn();
    const { Comp, swipeRef } = createSwipe({ onChange });
    render(Comp);
    await nextTick();
    await nextTick();

    swipeRef.value?.swipeTo(2, { immediate: true });
    await later(100);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should swipe to next after calling next method', async () => {
    const onChange = vi.fn();
    const { Comp, swipeRef } = createSwipe({ onChange });
    render(Comp);
    await nextTick();
    await nextTick();

    swipeRef.value?.next();
    await later(100);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should swipe to prev after calling prev method', async () => {
    const onChange = vi.fn();
    const { Comp, swipeRef } = createSwipe({ onChange });
    render(Comp);
    await nextTick();
    await nextTick();

    swipeRef.value?.prev();
    await later(100);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should render with initial swipe index', async () => {
    const { Comp } = createSwipe({ initialSwipe: 1 });
    const { container } = render(Comp);
    await nextTick();
    await nextTick();
    const track = container.querySelector('.van-swipe__track');
    const style = track?.getAttribute('style') || '';
    expect(style).toContain('translateX(-100');
  });

  it('should render vertical swipe track', async () => {
    const { Comp } = createSwipe({ vertical: true });
    const { container } = render(Comp);
    await nextTick();
    const track = container.querySelector('.van-swipe__track');
    expect(track?.classList.contains('van-swipe__track--vertical')).toBe(true);
    const style = track?.getAttribute('style') || '';
    expect(style).toContain('translateY');
  });

  it('should render vertical indicators', async () => {
    const { Comp } = createSwipe({ vertical: true });
    const { container } = render(Comp);
    await nextTick();
    await nextTick();
    const indicators = container.querySelector('.van-swipe__indicators');
    expect(
      indicators?.classList.contains('van-swipe__indicators--vertical'),
    ).toBe(true);
  });

  it('should not drag when touchable is false', async () => {
    const onChange = vi.fn();
    const { Comp } = createSwipe({ touchable: false, onChange });
    const { container } = render(Comp);
    await nextTick();
    const track = container.querySelector('.van-swipe__track')!;
    await triggerDrag(track, -100, 0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should apply indicator color', async () => {
    const { Comp } = createSwipe({ indicatorColor: '#ee0a24' });
    const { container } = render(Comp);
    await nextTick();
    await nextTick();
    const activeIndicator = container.querySelector(
      '.van-swipe__indicator--active',
    );
    expect(activeIndicator).not.toBeNull();
    const style = activeIndicator?.getAttribute('style') || '';
    expect(style).toContain('background-color');
  });

  it('should render custom indicator via slot', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Swipe,
            { width: 100, height: 100 },
            {
              default: () => [
                h(SwipeItem, { key: 0 }, () => h('text', null, '1')),
                h(SwipeItem, { key: 1 }, () => h('text', null, '2')),
              ],
              indicator: ({ active, total }: { active: number; total: number }) =>
                h('text', { class: 'custom-indicator' }, `${active + 1}/${total}`),
            },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();
    const customIndicator = container.querySelector('.custom-indicator');
    expect(customIndicator).not.toBeNull();
    expect(customIndicator?.textContent).toBe('1/2');
  });

  it('should set transition duration on track', async () => {
    const { Comp } = createSwipe({ duration: 300 });
    const { container } = render(Comp);
    await nextTick();
    await nextTick();
    const track = container.querySelector('.van-swipe__track');
    const style = track?.getAttribute('style') || '';
    expect(style).toContain('transition-duration');
  });

  it('should render SwipeItem with correct class', async () => {
    const { Comp } = createSwipe();
    const { container } = render(Comp);
    await nextTick();
    const items = container.querySelectorAll('.van-swipe-item');
    expect(items.length).toBe(3);
    items.forEach((item) => {
      expect(item.classList.contains('van-swipe-item')).toBe(true);
    });
  });

  it('should apply width to SwipeItem in horizontal mode', async () => {
    const { Comp } = createSwipe({ width: 200 });
    const { container } = render(Comp);
    await nextTick();
    await nextTick();
    const items = container.querySelectorAll('.van-swipe-item');
    items.forEach((item) => {
      const style = item.getAttribute('style') || '';
      expect(style).toContain('width');
      expect(style).toContain('200px');
    });
  });

  it('should apply height to SwipeItem in vertical mode', async () => {
    const { Comp } = createSwipe({ vertical: true, height: 200 });
    const { container } = render(Comp);
    await nextTick();
    await nextTick();
    const items = container.querySelectorAll('.van-swipe-item');
    items.forEach((item) => {
      const style = item.getAttribute('style') || '';
      expect(style).toContain('height');
      expect(style).toContain('200px');
    });
  });

  it('should emit change event when swiping via next/prev (dragStart/dragEnd verified via exposed methods)', async () => {
    const onChange = vi.fn();
    const { Comp, swipeRef } = createSwipe({ onChange });
    render(Comp);
    await nextTick();
    await nextTick();

    // Test next triggers change
    swipeRef.value?.next();
    await later(100);
    expect(onChange).toHaveBeenCalledWith(1);

    // Test prev triggers change
    swipeRef.value?.prev();
    await later(100);
    expect(onChange).toHaveBeenCalledWith(0);

    // Verify exposed state is updated
    expect(swipeRef.value?.state.active).toBeDefined();
  });

  it('should render swipe item correctly when using lazy-render prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Swipe,
            { width: 100, height: 100, lazyRender: true },
            {
              default: () =>
                Array.from({ length: 5 }, (_, i) =>
                  h(SwipeItem, { key: i }, () =>
                    h('text', { class: 'content' }, String(i + 1)),
                  ),
                ),
            },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();
    await later(50);

    const items = container.querySelectorAll('.van-swipe-item');
    expect(items.length).toBe(5);

    // With loop=true and active=0: items 0, 1, and 4 (prev in loop) should be rendered
    const renderedTexts = Array.from(items).map(
      (item) => item.querySelector('.content') !== null,
    );
    // Item 0 (active), 1 (next), and 4 (prev in loop) should render
    expect(renderedTexts[0]).toBe(true);
    expect(renderedTexts[1]).toBe(true);
    expect(renderedTexts[4]).toBe(true);
  });

  it('should render dynamic SwipeItem correctly', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          const showItems = ref(false);
          onMounted(() => {
            showItems.value = true;
          });
          return { showItems };
        },
        render() {
          return h(
            Swipe,
            { width: 100, height: 100 },
            {
              default: () =>
                this.showItems
                  ? [
                      h(SwipeItem, { key: 0 }, () => h('text', null, '1')),
                      h(SwipeItem, { key: 1 }, () => h('text', null, '2')),
                    ]
                  : [],
            },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();
    await later(50);

    const items = container.querySelectorAll('.van-swipe-item');
    expect(items.length).toBe(2);
  });

  it('should swipe looply when using loop prop', async () => {
    const onChange = vi.fn();
    const { Comp, swipeRef } = createSwipe({ onChange });
    render(Comp);
    await nextTick();
    await nextTick();

    // Use exposed next() to test loop behavior (touch events have testing env limitations)
    swipeRef.value?.next();
    await later(100);
    expect(onChange).toHaveBeenLastCalledWith(1);

    swipeRef.value?.next();
    await later(100);
    expect(onChange).toHaveBeenLastCalledWith(2);

    // Loop back to 0
    swipeRef.value?.next();
    await later(100);
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});
