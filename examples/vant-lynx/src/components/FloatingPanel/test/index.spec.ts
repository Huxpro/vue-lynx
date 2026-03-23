import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import FloatingPanel from '../index.vue';

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
  } else if (eventType === 'touchcancel') {
    fireEvent.touchcancel(el);
  }
}

function triggerDrag(el: Element, deltaX: number, deltaY: number) {
  const startX = 200;
  const startY = 400;
  trigger(el, 'touchstart', startX, startY);
  trigger(el, 'touchmove', startX + deltaX / 4, startY + deltaY / 4);
  trigger(el, 'touchmove', startX + deltaX / 2, startY + deltaY / 2);
  trigger(el, 'touchmove', startX + deltaX, startY + deltaY);
  trigger(el, 'touchend');
}

// Default screen height in component is 800, so default max = round(800 * 0.6) = 480
const DEFAULT_MAX = 480;

describe('FloatingPanel', () => {
  it('should render with BEM class', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel),
      }),
    );
    expect(container.querySelector('.van-floating-panel')).toBeTruthy();
  });

  it('should have default minHeight 100 and maxHeight 0.6 * screenHeight when no anchors', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, null, {
          default: () => h('text', 'Content'),
        }),
      }),
    );
    const root = container.querySelector('.van-floating-panel') as HTMLElement;
    expect(root).toBeTruthy();
    // Height should be max boundary value
    expect(root.style.height).toBe(`${DEFAULT_MAX}px`);
    // Transform should position at min height (100)
    expect(root.style.transform).toContain('-100px');
  });

  it('should set height from anchors prop', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, { anchors: [100, 200, 400] }, {
          default: () => h('text', 'Content'),
        }),
      }),
    );
    const root = container.querySelector('.van-floating-panel') as HTMLElement;
    expect(root.style.height).toBe('400px');
    // Initially snaps to closest anchor from min (100)
    expect(root.style.transform).toContain('-100px');
  });

  it('should drag and snap to nearest anchor (magnetic)', async () => {
    const onHeightChange = vi.fn();
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, {
          anchors: [100, 200, 400],
          onHeightChange,
        }, {
          default: () => h('text', 'Content'),
        }),
      }),
    );

    const header = container.querySelector('.van-floating-panel__header') as HTMLElement;
    expect(header).toBeTruthy();

    // Drag up by 199px — should snap to 200
    triggerDrag(header, 0, -199);
    await later();

    const root = container.querySelector('.van-floating-panel') as HTMLElement;
    expect(root.style.transform).toContain('-200px');
    expect(onHeightChange).toHaveBeenCalledWith({ height: 200 });
  });

  it('should emit heightChange when height changes', async () => {
    const onHeightChange = vi.fn();
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, {
          anchors: [100, 200, 400],
          onHeightChange,
        }, {
          default: () => h('text', 'Content'),
        }),
      }),
    );

    const header = container.querySelector('.van-floating-panel__header') as HTMLElement;
    triggerDrag(header, 0, -199);
    await later();

    expect(onHeightChange).toHaveBeenCalledWith({ height: 200 });
  });

  it('should only drag header when contentDraggable is false', async () => {
    const onHeightChange = vi.fn();
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, {
          anchors: [100, 200, 400],
          contentDraggable: false,
          onHeightChange,
        }, {
          default: () => h('text', 'Content'),
        }),
      }),
    );

    // Drag content — should NOT trigger height change
    const content = container.querySelector('.van-floating-panel__content') as HTMLElement;
    triggerDrag(content, 0, -199);
    await later();
    expect(onHeightChange).not.toHaveBeenCalled();

    // Drag header — should trigger height change
    const header = container.querySelector('.van-floating-panel__header') as HTMLElement;
    triggerDrag(header, 0, -199);
    await later();
    expect(onHeightChange).toHaveBeenCalled();
  });

  it('should render header slot correctly', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, null, {
          header: () => h('text', 'Custom Header'),
        }),
      }),
    );
    const texts = container.querySelectorAll('text');
    const headerText = Array.from(texts).find(
      (t) => t.textContent === 'Custom Header',
    );
    expect(headerText).toBeTruthy();
  });

  it('should not snap to anchors when magnetic is false', async () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, {
          anchors: [100, 200, 400],
          magnetic: false,
        }, {
          default: () => h('text', 'Content'),
        }),
      }),
    );

    const header = container.querySelector('.van-floating-panel__header') as HTMLElement;
    // Drag up 150px from start (100) => should land at 250, clamped between 100-400
    triggerDrag(header, 0, -150);
    await later();

    const root = container.querySelector('.van-floating-panel') as HTMLElement;
    // Should NOT snap to 200 or 400, should be ~250
    expect(root.style.transform).not.toContain('-200px');
    expect(root.style.transform).not.toContain('-400px');
    expect(root.style.transform).toContain('-250px');
  });

  it('should snap to nearest anchor when magnetic is true (default)', async () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, {
          anchors: [100, 200, 400],
        }, {
          default: () => h('text', 'Content'),
        }),
      }),
    );

    const header = container.querySelector('.van-floating-panel__header') as HTMLElement;
    // Small drag — should snap back to 100
    triggerDrag(header, 0, 10);
    await later();

    const root = container.querySelector('.van-floating-panel') as HTMLElement;
    expect(root.style.transform).toContain('-100px');
  });

  it('should add padding bottom to content when panel is not fully expanded', async () => {
    const { container, rerender } = render(
      defineComponent({
        props: { height: { type: Number, default: 200 } },
        render() {
          return h(FloatingPanel, {
            anchors: [100, 200, 400],
            height: this.height,
          }, {
            default: () => h('text', 'Content'),
          });
        },
      }),
      { props: { height: 200 } },
    );

    const content = container.querySelector('.van-floating-panel__content') as HTMLElement;
    // paddingBottom = max(400) - height(200) = 200
    expect(content.style.paddingBottom).toBe('200px');
  });

  it('should not allow dragging when draggable is false', async () => {
    const onHeightChange = vi.fn();
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, {
          anchors: [100, 200, 400],
          draggable: false,
          onHeightChange,
        }, {
          default: () => h('text', 'Content'),
        }),
      }),
    );

    // Header should not be rendered when draggable is false
    const header = container.querySelector('.van-floating-panel__header');
    expect(header).toBeFalsy();

    // Drag content — should not trigger height change
    const content = container.querySelector('.van-floating-panel__content') as HTMLElement;
    triggerDrag(content, 0, -199);
    await later();
    expect(onHeightChange).not.toHaveBeenCalled();
  });

  it('should render header slot even when draggable is false', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, {
          draggable: false,
        }, {
          header: () => h('text', 'Custom Header'),
        }),
      }),
    );

    const texts = container.querySelectorAll('text');
    const headerText = Array.from(texts).find(
      (t) => t.textContent === 'Custom Header',
    );
    expect(headerText).toBeTruthy();
  });

  it('should use transition with correct timing function', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, {
          duration: 0.5,
        }),
      }),
    );
    const root = container.querySelector('.van-floating-panel') as HTMLElement;
    expect(root.style.transition).toContain('0.5s');
    expect(root.style.transition).toContain('cubic-bezier(0.18, 0.89, 0.32, 1.28)');
  });

  it('should support v-model:height', async () => {
    const height = ref(200);
    const { container } = render(
      defineComponent({
        setup() {
          return () => h(FloatingPanel, {
            anchors: [100, 200, 400],
            height: height.value,
            'onUpdate:height': (val: number) => { height.value = val; },
          }, {
            default: () => h('text', 'Content'),
          });
        },
      }),
    );

    const root = container.querySelector('.van-floating-panel') as HTMLElement;
    expect(root.style.transform).toContain('-200px');
  });

  it('should have safe area bottom class by default', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel),
      }),
    );
    const root = container.querySelector('.van-floating-panel') as HTMLElement;
    expect(root.className).toContain('van-safe-area-bottom');
  });

  it('should not have safe area bottom class when disabled', () => {
    const { container } = render(
      defineComponent({
        render: () => h(FloatingPanel, { safeAreaInsetBottom: false }),
      }),
    );
    const root = container.querySelector('.van-floating-panel') as HTMLElement;
    expect(root.className).not.toContain('van-safe-area-bottom');
  });
});
