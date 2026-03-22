import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Barrage from '../index.vue';
import type { BarrageItem, BarrageExpose } from '../types';

const defaultList: BarrageItem[] = [
  { id: 100, text: '轻量' },
  { id: 101, text: '可定制的' },
  { id: 102, text: '移动端' },
  { id: 103, text: 'Vue' },
  { id: 104, text: '组件库' },
  { id: 105, text: 'VantUI' },
  { id: 106, text: '666' },
];

describe('Barrage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render barrage container with BEM class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, { modelValue: [] });
        },
      }),
    );
    await nextTick();
    await nextTick();
    const barrageEl = container.querySelector('.van-barrage');
    expect(barrageEl).not.toBeNull();
  });

  it('should render with initial items when auto play', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: defaultList,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();
    const items = container.querySelectorAll('.van-barrage__item');
    expect(items).toHaveLength(7);
  });

  it('should render slot content', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Barrage,
            { modelValue: [] },
            { default: () => h('view', { class: 'video' }, [h('text', null, 'Video')]) },
          );
        },
      }),
    );
    await nextTick();
    await nextTick();
    const video = container.querySelector('.video');
    expect(video).not.toBeNull();
  });

  it('should apply animation styles to items', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: defaultList,
            duration: 5000,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();
    const item = container.querySelector('.van-barrage__item') as HTMLElement;
    expect(item).not.toBeNull();
    expect(item.style.animationDuration).toBe('5000ms');
  });

  it('should stagger initial items with delay', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: defaultList,
            delay: 200,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();
    const items = container.querySelectorAll('.van-barrage__item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(7);
    // First item has delay 0, second has delay 200, third has delay 400, etc.
    expect(items[0].style.animationDelay).toBe('0ms');
    expect(items[1].style.animationDelay).toBe('200ms');
    expect(items[2].style.animationDelay).toBe('400ms');
  });

  it('should distribute items across rows based on rows prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: defaultList,
            rows: 2,
            top: 10,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();
    const items = container.querySelectorAll('.van-barrage__item') as NodeListOf<HTMLElement>;
    // With 2 rows, items alternate: row 0 (top=10), row 1 (top=36), row 0 (top=10), etc.
    expect(items[0].style.top).toBe('10px');
    expect(items[1].style.top).toBe('36px');
    expect(items[2].style.top).toBe('10px');
  });

  it('should not auto play when autoPlay is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: defaultList,
            autoPlay: false,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();
    const items = container.querySelectorAll('.van-barrage__item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(7);
    // Items should have animationPlayState: 'paused'
    expect(items[0].style.animationPlayState).toBe('paused');
  });

  it('should play and pause via exposed methods', async () => {
    const barrageRef = ref<BarrageExpose | null>(null);
    const { container } = render(
      defineComponent({
        setup() {
          return { barrageRef };
        },
        render() {
          return h(Barrage, {
            ref: (el: any) => { barrageRef.value = el; },
            modelValue: defaultList,
            autoPlay: false,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    const items = container.querySelectorAll('.van-barrage__item') as NodeListOf<HTMLElement>;
    expect(items[0].style.animationPlayState).toBe('paused');

    // Play
    barrageRef.value?.play();
    await nextTick();
    const itemsAfterPlay = container.querySelectorAll('.van-barrage__item') as NodeListOf<HTMLElement>;
    expect(itemsAfterPlay[0].style.animationPlayState).toBe('running');

    // Pause
    barrageRef.value?.pause();
    await nextTick();
    const itemsAfterPause = container.querySelectorAll('.van-barrage__item') as NodeListOf<HTMLElement>;
    expect(itemsAfterPause[0].style.animationPlayState).toBe('paused');
  });

  it('should emit update:modelValue when item animation ends (timeout)', async () => {
    const onUpdate = vi.fn();
    render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: defaultList,
            duration: 4000,
            delay: 300,
            'onUpdate:modelValue': onUpdate,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();

    // First item has delay=0, so it completes at 4000ms
    vi.advanceTimersByTime(4100);
    await nextTick();

    expect(onUpdate).toHaveBeenCalled();
    // The first item (id: 100) should be removed from the emitted value
    const emittedValue = onUpdate.mock.calls[0][0] as BarrageItem[];
    expect(emittedValue.find(v => v.id === 100)).toBeUndefined();
  });

  it('should add new items when modelValue changes', async () => {
    const modelValue = ref<BarrageItem[]>([...defaultList]);
    const { container } = render(
      defineComponent({
        setup() {
          return { modelValue };
        },
        render() {
          return h(Barrage, {
            modelValue: modelValue.value,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();
    expect(container.querySelectorAll('.van-barrage__item')).toHaveLength(7);

    // Add a new item
    modelValue.value = [...modelValue.value, { id: 107, text: 'Barrage' }];
    await nextTick();
    await nextTick();
    expect(container.querySelectorAll('.van-barrage__item')).toHaveLength(8);
  });

  it('should render text content in items', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: [{ id: 1, text: 'Hello' }],
          });
        },
      }),
    );
    await nextTick();
    await nextTick();
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map((t: Element) => t.textContent);
    expect(textContents.some(t => t === 'Hello')).toBe(true);
  });

  it('should use top prop for vertical offset', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: [{ id: 1, text: 'Test' }],
            top: 20,
            rows: 1,
          });
        },
      }),
    );
    await nextTick();
    await nextTick();
    const item = container.querySelector('.van-barrage__item') as HTMLElement;
    expect(item.style.top).toBe('20px');
  });

  it('should accept numeric string props', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Barrage, {
            modelValue: defaultList,
            rows: '3',
            top: '5',
            duration: '3000',
          });
        },
      }),
    );
    await nextTick();
    await nextTick();
    const items = container.querySelectorAll('.van-barrage__item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(7);
    expect(items[0].style.animationDuration).toBe('3000ms');
    expect(items[0].style.top).toBe('5px');
  });
});
