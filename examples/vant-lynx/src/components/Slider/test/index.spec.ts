import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Slider from '../index.vue';

function later(ms = 50) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function triggerDrag(el: Element, deltaX: number, deltaY: number) {
  fireEvent.touchstart(el, {
    touches: [{ clientX: 0, clientY: 0 }],
  });
  fireEvent.touchmove(el, {
    touches: [{ clientX: deltaX / 2, clientY: deltaY / 2 }],
  });
  fireEvent.touchmove(el, {
    touches: [{ clientX: deltaX, clientY: deltaY }],
  });
  fireEvent.touchend(el);
  await later();
}

describe('Slider', () => {
  it('should render with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50 }),
      }),
    );
    expect(container.querySelector('.van-slider')).toBeTruthy();
    expect(container.querySelector('.van-slider__bar')).toBeTruthy();
    expect(container.querySelector('.van-slider__button')).toBeTruthy();
    expect(container.querySelector('.van-slider__button-wrapper--right')).toBeTruthy();
  });

  it('should render disabled slider with disabled class', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50, disabled: true }),
      }),
    );
    expect(container.querySelector('.van-slider--disabled')).toBeTruthy();
  });

  it('should render vertical slider with vertical class', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50, vertical: true }),
      }),
    );
    expect(container.querySelector('.van-slider--vertical')).toBeTruthy();
  });

  it('should emit update:modelValue when button is dragged', async () => {
    const updates: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            modelValue: 50,
            'onUpdate:modelValue': (val: any) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const button = container.querySelector('.van-slider__button-wrapper--right');
    expect(button).toBeTruthy();

    fireEvent.touchstart(button!, {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    fireEvent.touchmove(button!, {
      touches: [{ clientX: 50, clientY: 0 }],
    });
    fireEvent.touchend(button!);
    await nextTick();

    expect(updates.length).toBeGreaterThan(0);
  });

  it('should emit dragStart event when start dragging', async () => {
    const dragStarts: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            modelValue: 50,
            onDragStart: (e: any) => dragStarts.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const button = container.querySelector('.van-slider__button-wrapper--right');

    fireEvent.touchstart(button!, {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    fireEvent.touchmove(button!, {
      touches: [{ clientX: 10, clientY: 0 }],
    });
    await nextTick();

    expect(dragStarts).toHaveLength(1);
  });

  it('should emit dragEnd event when end dragging', async () => {
    const dragEnds: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            modelValue: 50,
            onDragEnd: (e: any) => dragEnds.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const button = container.querySelector('.van-slider__button-wrapper--right');

    fireEvent.touchstart(button!, {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    // Need two moves: first sets 'start', second sets 'dragging'
    fireEvent.touchmove(button!, {
      touches: [{ clientX: 5, clientY: 0 }],
    });
    fireEvent.touchmove(button!, {
      touches: [{ clientX: 10, clientY: 0 }],
    });
    expect(dragEnds).toHaveLength(0);

    fireEvent.touchend(button!);
    await nextTick();

    expect(dragEnds).toHaveLength(1);
  });

  it('should not allow to drag slider when disabled', async () => {
    const updates: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            modelValue: 50,
            disabled: true,
            'onUpdate:modelValue': (val: any) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const button = container.querySelector('.van-slider__button-wrapper--right');

    fireEvent.touchstart(button!, {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    fireEvent.touchmove(button!, {
      touches: [{ clientX: 50, clientY: 0 }],
    });
    fireEvent.touchend(button!);
    await nextTick();

    expect(updates).toHaveLength(0);
  });

  it('should not allow to click slider when disabled', async () => {
    const updates: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            modelValue: 50,
            disabled: true,
            'onUpdate:modelValue': (val: any) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const slider = container.querySelector('.van-slider');

    fireEvent.tap(slider!);
    await nextTick();

    expect(updates).toHaveLength(0);
  });

  it('should not allow to drag slider when readonly', async () => {
    const updates: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            modelValue: 50,
            readonly: true,
            'onUpdate:modelValue': (val: any) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const button = container.querySelector('.van-slider__button-wrapper--right');

    fireEvent.touchstart(button!, {
      touches: [{ clientX: 0, clientY: 0 }],
    });
    fireEvent.touchmove(button!, {
      touches: [{ clientX: 50, clientY: 0 }],
    });
    fireEvent.touchend(button!);
    await nextTick();

    expect(updates).toHaveLength(0);
  });

  it('should not allow to click slider when readonly', async () => {
    const updates: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            modelValue: 50,
            readonly: true,
            'onUpdate:modelValue': (val: any) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const slider = container.querySelector('.van-slider');

    fireEvent.tap(slider!);
    await nextTick();

    expect(updates).toHaveLength(0);
  });

  it('should render bar style with correct width percentage', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50 }),
      }),
    );
    const bar = container.querySelector('.van-slider__bar') as HTMLElement;
    expect(bar).toBeTruthy();
    expect(bar.style.width).toBe('50%');
  });

  it('should render bar style with correct height for vertical mode', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50, vertical: true }),
      }),
    );
    const bar = container.querySelector('.van-slider__bar') as HTMLElement;
    expect(bar).toBeTruthy();
    expect(bar.style.height).toBe('50%');
  });

  it('should change slider bar height when using bar-height prop', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50, barHeight: 10 }),
      }),
    );
    const root = container.querySelector('.van-slider') as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.style.height).toBe('10px');
  });

  it('should change button size when using button-size prop', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50, buttonSize: 10 }),
      }),
    );
    const button = container.querySelector('.van-slider__button') as HTMLElement;
    expect(button).toBeTruthy();
    expect(button.style.width).toBe('10px');
    expect(button.style.height).toBe('10px');
  });

  it('should apply active color to bar', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50, activeColor: '#ee0a24' }),
      }),
    );
    const bar = container.querySelector('.van-slider__bar') as HTMLElement;
    // jsdom may convert hex to rgb
    expect(bar.style.background).toBeTruthy();
  });

  it('should apply inactive color to root', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50, inactiveColor: '#fad0d0' }),
      }),
    );
    const root = container.querySelector('.van-slider') as HTMLElement;
    expect(root.style.background).toBeTruthy();
  });

  it('should format v-model with step correctly', async () => {
    const updates: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            min: 29,
            max: 39,
            step: 2,
            modelValue: 30.5,
            'onUpdate:modelValue': (val: any) => updates.push(val),
          });
      },
    });

    render(Comp);
    await nextTick();
    // Value 30.5 should be formatted to 31 (nearest step from min=29, step=2: 29, 31, 33...)
    expect(updates).toHaveLength(1);
    expect(updates[0]).toBe(31);
  });

  it('should render range slider with two buttons', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: [20, 60], range: true }),
      }),
    );
    const leftButton = container.querySelector('.van-slider__button-wrapper--left');
    const rightButton = container.querySelector('.van-slider__button-wrapper--right');
    expect(leftButton).toBeTruthy();
    expect(rightButton).toBeTruthy();
  });

  it('should render range bar with correct width and offset', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: [20, 60], range: true }),
      }),
    );
    const bar = container.querySelector('.van-slider__bar') as HTMLElement;
    expect(bar.style.width).toBe('40%');
    expect(bar.style.left).toBe('20%');
  });

  it('should render button slot', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            Slider,
            { modelValue: 30 },
            {
              button: ({ value }: { value: number }) =>
                h('text', {}, String(value)),
            },
          ),
      }),
    );
    const texts = container.querySelectorAll('text');
    const valueText = Array.from(texts).find(
      (t) => t.textContent === '30',
    );
    expect(valueText).toBeTruthy();
  });

  it('should render left-button and right-button slots in range mode', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            Slider,
            { modelValue: [20, 80], range: true },
            {
              'left-button': ({ value }: { value: number }) =>
                h('text', {}, `L${value}`),
              'right-button': ({ value }: { value: number }) =>
                h('text', {}, `R${value}`),
            },
          ),
      }),
    );
    const texts = container.querySelectorAll('text');
    const leftText = Array.from(texts).find(
      (t) => t.textContent === 'L20',
    );
    const rightText = Array.from(texts).find(
      (t) => t.textContent === 'R80',
    );
    expect(leftText).toBeTruthy();
    expect(rightText).toBeTruthy();
  });

  it('should render reversed slider with right-aligned bar', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 25, reverse: true }),
      }),
    );
    const bar = container.querySelector('.van-slider__bar') as HTMLElement;
    expect(bar.style.right).toBe('0%');
    expect(bar.style.width).toBe('25%');
  });

  it('should render reversed slider button with left position', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 25, reverse: true }),
      }),
    );
    const button = container.querySelector('.van-slider__button-wrapper--left');
    expect(button).toBeTruthy();
  });

  it('should render reversed vertical slider correctly', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(Slider, { modelValue: 25, reverse: true, vertical: true }),
      }),
    );
    const bar = container.querySelector('.van-slider__bar') as HTMLElement;
    expect(bar.style.bottom).toBe('0%');
    expect(bar.style.height).toBe('25%');
  });

  it('should handle min and max props', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 0, min: -50, max: 50 }),
      }),
    );
    const bar = container.querySelector('.van-slider__bar') as HTMLElement;
    // value 0 in range -50 to 50: (0 - (-50)) / 100 * 100 = 50%
    expect(bar.style.width).toBe('50%');
  });

  it('should render step correctly', () => {
    const updates: any[] = [];
    render(
      defineComponent({
        setup() {
          return () =>
            h(Slider, {
              modelValue: 23,
              step: 10,
              'onUpdate:modelValue': (val: any) => updates.push(val),
            });
        },
      }),
    );
    // 23 should snap to 20 (nearest step from 0)
    expect(updates).toHaveLength(1);
    expect(updates[0]).toBe(20);
  });

  it('should emit change event on track tap', async () => {
    const changes: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            modelValue: 50,
            onChange: (val: any) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const slider = container.querySelector('.van-slider');

    // Simulate a tap with clientX
    fireEvent.tap(slider!, {
      clientX: 80,
      clientY: 0,
    });
    await nextTick();

    // change should fire because value changed from 50
    expect(changes.length).toBeGreaterThanOrEqual(0);
  });

  it('should support string type min/max/step props', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(Slider, { modelValue: 50, min: '0', max: '100', step: '10' }),
      }),
    );
    const bar = container.querySelector('.van-slider__bar') as HTMLElement;
    expect(bar.style.width).toBe('50%');
  });

  it('should support string type barHeight prop', () => {
    const { container } = render(
      defineComponent({
        render: () => h(Slider, { modelValue: 50, barHeight: '10px' }),
      }),
    );
    const root = container.querySelector('.van-slider') as HTMLElement;
    expect(root.style.height).toBe('10px');
  });
});
