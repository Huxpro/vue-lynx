import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import SwipeCell from '../index.vue';

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

function triggerDrag(el: Element, x: number, y: number) {
  // Start at 200,200 so negative deltas don't produce negative clientX/clientY
  // (useTouch clamps negative clientX to 0)
  const startX = 200;
  const startY = 200;
  trigger(el, 'touchstart', startX, startY);
  trigger(el, 'touchmove', startX + x / 4, startY + y / 4);
  trigger(el, 'touchmove', startX + x / 2, startY + y / 2);
  trigger(el, 'touchmove', startX + x, startY + y);
  trigger(el, 'touchend');
}

const defaultSlots = {
  left: () => h('text', null, 'Left'),
  default: () => h('text', null, 'Content'),
  right: () => h('text', null, 'Right'),
};

describe('SwipeCell', () => {
  it('should render with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100 },
            defaultSlots,
          ),
      }),
    );
    expect(container.querySelector('.van-swipe-cell')).toBeTruthy();
    expect(container.querySelector('.van-swipe-cell__wrapper')).toBeTruthy();
    expect(container.querySelector('.van-swipe-cell__left')).toBeTruthy();
    expect(container.querySelector('.van-swipe-cell__right')).toBeTruthy();
  });

  it('should allow to drag to show left part', async () => {
    const onOpen = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, onOpen },
            defaultSlots,
          ),
      }),
    );

    const root = container.querySelector('.van-swipe-cell')!;
    triggerDrag(root, 100, 0);
    await later();

    expect(onOpen).toHaveBeenCalledWith({
      name: '',
      position: 'left',
    });
  });

  it('should allow to drag to show right part', async () => {
    const onOpen = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, onOpen },
            defaultSlots,
          ),
      }),
    );

    const root = container.querySelector('.van-swipe-cell')!;
    triggerDrag(root, -100, 0);
    await later();

    expect(onOpen).toHaveBeenCalledWith({
      name: '',
      position: 'right',
    });
  });

  it('should emit open event with name when using name prop', async () => {
    const onOpen = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, name: 'test', onOpen },
            defaultSlots,
          ),
      }),
    );

    const root = container.querySelector('.van-swipe-cell')!;
    triggerDrag(root, 100, 0);
    await later();

    expect(onOpen).toHaveBeenCalledWith({
      name: 'test',
      position: 'left',
    });
  });

  it('should emit close event when closed', async () => {
    const onClose = vi.fn();
    const compRef = ref<any>(null);

    render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, name: 'test', onClose, ref: compRef },
            defaultSlots,
          ),
      }),
    );

    await nextTick();
    compRef.value?.open('left');
    await nextTick();
    compRef.value?.close('cell');
    await nextTick();

    expect(onClose).toHaveBeenCalledWith({
      name: 'test',
      position: 'cell',
    });
  });

  it('should not trigger close event again if already closed', async () => {
    const onClose = vi.fn();
    const compRef = ref<any>(null);

    render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, onClose, ref: compRef },
            defaultSlots,
          ),
      }),
    );

    await nextTick();
    compRef.value?.open('left');
    await nextTick();
    compRef.value?.close('cell');
    await nextTick();
    expect(onClose).toHaveBeenCalledTimes(1);

    compRef.value?.close('cell');
    await nextTick();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should reset transform after short dragging', async () => {
    const onOpen = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, onOpen },
            defaultSlots,
          ),
      }),
    );

    const root = container.querySelector('.van-swipe-cell')!;
    // Very small drag should not trigger open
    trigger(root, 'touchstart', 0, 0);
    trigger(root, 'touchmove', 5, 0);
    trigger(root, 'touchend');
    await later();

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('should not allow to drag when using disabled prop', async () => {
    const onOpen = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, disabled: true, onOpen },
            defaultSlots,
          ),
      }),
    );

    const root = container.querySelector('.van-swipe-cell')!;
    triggerDrag(root, 100, 0);
    await later();

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('should close swipe cell after cell clicked', async () => {
    const onClose = vi.fn();
    const compRef = ref<any>(null);

    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, onClose, ref: compRef },
            defaultSlots,
          ),
      }),
    );

    await nextTick();
    compRef.value?.open('left');
    await nextTick();

    const root = container.querySelector('.van-swipe-cell')!;
    fireEvent.tap(root);
    await later();

    expect(onClose).toHaveBeenCalled();
  });

  it('should emit click event with position', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, onClick },
            defaultSlots,
          ),
      }),
    );

    const root = container.querySelector('.van-swipe-cell')!;
    fireEvent.tap(root);
    await later();

    expect(onClick).toHaveBeenCalledWith('cell');
  });

  it('should emit click event for left side', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, onClick },
            defaultSlots,
          ),
      }),
    );

    const left = container.querySelector('.van-swipe-cell__left')!;
    fireEvent.tap(left);
    await later();

    expect(onClick).toHaveBeenCalledWith('left');
  });

  it('should emit click event for right side', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, onClick },
            defaultSlots,
          ),
      }),
    );

    const right = container.querySelector('.van-swipe-cell__right')!;
    fireEvent.tap(right);
    await later();

    expect(onClick).toHaveBeenCalledWith('right');
  });

  it('should call beforeClose before closing', async () => {
    let calledPosition: string | undefined;
    const beforeClose = vi.fn(({ position }: { position: string }) => {
      calledPosition = position;
      return true;
    });
    const compRef = ref<any>(null);

    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, beforeClose, ref: compRef },
            defaultSlots,
          ),
      }),
    );

    await nextTick();
    compRef.value?.open('left');
    await nextTick();

    const root = container.querySelector('.van-swipe-cell')!;
    fireEvent.tap(root);
    await later();

    expect(beforeClose).toHaveBeenCalled();
    expect(calledPosition).toBe('cell');
  });

  it('should support beforeClose returning promise', async () => {
    const onClose = vi.fn();
    const beforeClose = vi.fn(() => {
      return new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(true), 50);
      });
    });
    const compRef = ref<any>(null);

    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, beforeClose, onClose, ref: compRef },
            defaultSlots,
          ),
      }),
    );

    await nextTick();
    compRef.value?.open('left');
    await nextTick();

    const root = container.querySelector('.van-swipe-cell')!;
    fireEvent.tap(root);
    await later(100);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close when beforeClose returns false', async () => {
    const onClose = vi.fn();
    const beforeClose = vi.fn(() => false);
    const compRef = ref<any>(null);

    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, beforeClose, onClose, ref: compRef },
            defaultSlots,
          ),
      }),
    );

    await nextTick();
    compRef.value?.open('left');
    await nextTick();

    const root = container.querySelector('.van-swipe-cell')!;
    fireEvent.tap(root);
    await later();

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not close when beforeClose promise resolves false', async () => {
    const onClose = vi.fn();
    const beforeClose = vi.fn(
      () => new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 50)),
    );
    const compRef = ref<any>(null);

    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, beforeClose, onClose, ref: compRef },
            defaultSlots,
          ),
      }),
    );

    await nextTick();
    compRef.value?.open('left');
    await nextTick();

    const root = container.querySelector('.van-swipe-cell')!;
    fireEvent.tap(root);
    await later(100);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should expose open and close methods', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const compRef = ref<any>(null);

    render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100, onOpen, onClose, ref: compRef },
            defaultSlots,
          ),
      }),
    );

    await nextTick();
    expect(compRef.value?.open).toBeDefined();
    expect(compRef.value?.close).toBeDefined();

    compRef.value?.open('left');
    await nextTick();
    expect(onOpen).toHaveBeenCalledWith({ name: '', position: 'left' });

    compRef.value?.close('cell');
    await nextTick();
    expect(onClose).toHaveBeenCalled();
  });

  it('should not render left/right when width is 0', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(SwipeCell, {}, defaultSlots),
      }),
    );

    expect(container.querySelector('.van-swipe-cell__left')).toBeFalsy();
    expect(container.querySelector('.van-swipe-cell__right')).toBeFalsy();
  });

  it('should render default slot content', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(SwipeCell, {}, {
            default: () => h('text', null, 'Cell Content'),
          }),
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasContent = Array.from(textEls).some(
      (t: Element) => t.textContent === 'Cell Content',
    );
    expect(hasContent).toBe(true);
  });

  it('should render left and right slot content', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            SwipeCell,
            { leftWidth: 100, rightWidth: 100 },
            {
              left: () => h('text', null, 'Left Action'),
              default: () => h('text', null, 'Content'),
              right: () => h('text', null, 'Right Action'),
            },
          ),
      }),
    );

    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t: Element) => t.textContent);
    expect(texts).toContain('Left Action');
    expect(texts).toContain('Right Action');
  });
});
