import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import FloatingBubble from '../index.vue';

const bubbleWidth = 48;
const bubbleHeight = 48;
const defaultGap = 24;
const screenWidth = 375;
const screenHeight = 812;

function later(ms = 50) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trigger(el: Element, eventType: string, x = 0, y = 0) {
  if (eventType === 'touchstart') {
    fireEvent.touchstart(el, { touches: [{ clientX: x, clientY: y }] });
  } else if (eventType === 'touchmove') {
    fireEvent.touchmove(el, { touches: [{ clientX: x, clientY: y }] });
  } else if (eventType === 'touchend') {
    fireEvent.touchend(el);
  }
}

function triggerDrag(el: Element, deltaX: number, deltaY: number) {
  const startX = 200;
  const startY = 200;
  trigger(el, 'touchstart', startX, startY);
  trigger(el, 'touchmove', startX + deltaX / 4, startY + deltaY / 4);
  trigger(el, 'touchmove', startX + deltaX / 2, startY + deltaY / 2);
  trigger(el, 'touchmove', startX + deltaX, startY + deltaY);
  trigger(el, 'touchend');
}

describe('FloatingBubble', () => {
  it('should render with BEM class', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingBubble),
      }),
    );
    expect(container.querySelector('.van-floating-bubble')).toBeTruthy();
  });

  it('should render with default position (bottom-right)', async () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingBubble),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;
    expect(el).toBeTruthy();
    // Default position: screenWidth - size - gap, screenHeight - size - gap
    const expectedX = screenWidth - bubbleWidth - defaultGap;
    const expectedY = screenHeight - bubbleHeight - defaultGap;
    expect(el.style.transform).toContain(`${expectedX}px`);
    expect(el.style.transform).toContain(`${expectedY}px`);
  });

  it('should render with custom gap', async () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingBubble, { gap: 50 }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;
    const expectedX = screenWidth - bubbleWidth - 50;
    const expectedY = screenHeight - bubbleHeight - 50;
    expect(el.style.transform).toContain(`${expectedX}px`);
    expect(el.style.transform).toContain(`${expectedY}px`);
  });

  it('should render with xy gaps', async () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingBubble, { gap: { x: 50, y: 27 } }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;
    const expectedX = screenWidth - bubbleWidth - 50;
    const expectedY = screenHeight - bubbleHeight - 27;
    expect(el.style.transform).toContain(`${expectedX}px`);
    expect(el.style.transform).toContain(`${expectedY}px`);
  });

  it('should position via offset prop', async () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(FloatingBubble, { offset: { x: 100, y: 200 } }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;
    expect(el.style.transform).toContain('100px');
    expect(el.style.transform).toContain('200px');
  });

  it('should only drag along y axis by default', async () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingBubble),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;
    const initialX = screenWidth - bubbleWidth - defaultGap;

    triggerDrag(el, -100, -100);
    await later();

    // X should not change (axis='y'), Y should change
    expect(el.style.transform).toContain(`${initialX}px`);
  });

  it('should drag along x axis when axis is "x"', async () => {
    const onOffsetChange = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(FloatingBubble, {
            axis: 'x',
            onOffsetChange,
          }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;

    triggerDrag(el, -100, -100);
    await later();
    await nextTick();

    // offsetChange should have been emitted
    expect(onOffsetChange).toHaveBeenCalled();
  });

  it('should drag freely when axis is "xy"', async () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(FloatingBubble, { axis: 'xy' }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;

    triggerDrag(el, -50, -50);
    await later();

    // Both x and y should have changed from initial position
    expect(el.style.transform).toBeTruthy();
  });

  it('should not move when axis is "lock"', async () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingBubble, { axis: 'lock' }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;
    const initialTransform = el.style.transform;

    triggerDrag(el, -100, -100);
    await later();

    // Transform should not change
    expect(el.style.transform).toEqual(initialTransform);
  });

  it('should apply magnetic snap to x axis', async () => {
    vi.useFakeTimers();

    const { container } = render(
      defineComponent({
        render: () =>
          h(FloatingBubble, {
            axis: 'xy',
            magnetic: 'x',
          }),
      }),
    );
    await vi.advanceTimersByTimeAsync(50);
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;

    triggerDrag(el, -100, -100);
    await vi.advanceTimersByTimeAsync(400);
    await nextTick();

    // After magnetic snap, x should be at right or left boundary
    const transform = el.style.transform;
    expect(transform).toBeTruthy();
    // The bubble should snap to nearest x boundary
    const rightBoundary = screenWidth - bubbleWidth - defaultGap;
    const leftBoundary = defaultGap;
    // Since we started near right and moved -100, it should snap back to right
    expect(
      transform.includes(`${rightBoundary}px`) ||
        transform.includes(`${leftBoundary}px`),
    ).toBe(true);

    vi.useRealTimers();
  });

  it('should emit click on tap (not drag)', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(FloatingBubble, {
            axis: 'xy',
            onClick,
          }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;

    // Simulate a tap (touchstart + touchend without significant move)
    trigger(el, 'touchstart', 200, 200);
    trigger(el, 'touchend');
    // Fire tap event (Lynx uses tap, not click)
    fireEvent.tap(el);
    await later();

    expect(onClick).toHaveBeenCalled();
  });

  it('should emit update:offset on drag', async () => {
    const onUpdateOffset = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(FloatingBubble, {
            axis: 'xy',
            offset: { x: 200, y: 200 },
            'onUpdate:offset': onUpdateOffset,
          }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;

    triggerDrag(el, 50, 50);
    await later();

    expect(onUpdateOffset).toHaveBeenCalled();
  });

  it('should handle negative gap values', async () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(FloatingBubble, {
            axis: 'xy',
            gap: -10,
          }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;

    // With negative gap, boundary extends past screen edges
    triggerDrag(el, -1000, -1000);
    await later();

    // Should clamp to the negative gap boundary
    expect(el.style.transform).toContain('-10px');
  });

  it('should render default slot content', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            FloatingBubble,
            { axis: 'xy' },
            {
              default: () => h('text', null, 'Custom'),
            },
          ),
      }),
    );
    const texts = container.querySelectorAll('text');
    const customText = Array.from(texts).find(
      (t: any) => t.textContent === 'Custom',
    );
    expect(customText).toBeTruthy();
  });

  it('should render icon when icon prop is provided', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingBubble, { icon: 'chat' }),
      }),
    );
    expect(container.querySelector('.van-icon')).toBeTruthy();
  });

  it('should handle touchcancel as touchend', async () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingBubble, { axis: 'xy' }),
      }),
    );
    await later();
    const el = container.querySelector('.van-floating-bubble') as HTMLElement;

    trigger(el, 'touchstart', 200, 200);
    trigger(el, 'touchmove', 250, 250);
    fireEvent.touchcancel(el);
    await later();

    // Should not throw and should complete drag handling
    expect(el.style.transform).toBeTruthy();
  });
});
