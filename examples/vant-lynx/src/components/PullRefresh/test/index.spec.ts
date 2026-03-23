import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import PullRefresh from '../index.vue';

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
  trigger(el, 'touchstart', 0, 0);
  trigger(el, 'touchmove', x / 4, y / 4);
  trigger(el, 'touchmove', x / 2, y / 2);
  trigger(el, 'touchmove', x, y);
  trigger(el, 'touchend');
}

describe('PullRefresh', () => {
  it('should render with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(PullRefresh, null, {
            default: () => h('text', null, 'Content'),
          }),
      }),
    );
    expect(container.querySelector('.van-pull-refresh')).toBeTruthy();
    expect(container.querySelector('.van-pull-refresh__track')).toBeTruthy();
    expect(container.querySelector('.van-pull-refresh__head')).toBeTruthy();
  });

  it('should render different head content in different pulling status', async () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(PullRefresh, null, {
            default: () => h('text', null, 'Content'),
          }),
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;

    // pulling
    trigger(track, 'touchstart', 0, 0);
    trigger(track, 'touchmove', 0, 20);
    await later();

    const textEls = container.querySelectorAll('text');
    const hasPulling = Array.from(textEls).some(
      (t) => t.textContent === 'Pull to refresh...',
    );
    expect(hasPulling).toBe(true);

    // loosing
    trigger(track, 'touchmove', 0, 100);
    await later();

    const textEls2 = container.querySelectorAll('text');
    const hasLoosing = Array.from(textEls2).some(
      (t) => t.textContent === 'Release to refresh...',
    );
    expect(hasLoosing).toBe(true);

    // loading (after touchend while loosing)
    trigger(track, 'touchend');
    await later();

    const textEls3 = container.querySelectorAll('text');
    const hasLoading = Array.from(textEls3).some(
      (t) => t.textContent === 'Loading...',
    );
    expect(hasLoading).toBe(true);
  });

  it('should render status slots correctly', async () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(PullRefresh, null, {
            pulling: ({ distance }: { distance: number }) =>
              h('text', null, `pulling ${distance}`),
            loosing: ({ distance }: { distance: number }) =>
              h('text', null, `loosing ${distance}`),
            loading: ({ distance }: { distance: number }) =>
              h('text', null, `loading ${distance}`),
            default: () => h('text', null, 'Content'),
          }),
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;

    // pulling
    trigger(track, 'touchstart', 0, 0);
    trigger(track, 'touchmove', 0, 20);
    await later();

    const textEls = container.querySelectorAll('text');
    const hasPullingSlot = Array.from(textEls).some((t) =>
      t.textContent?.startsWith('pulling'),
    );
    expect(hasPullingSlot).toBe(true);

    // loosing
    trigger(track, 'touchmove', 0, 100);
    await later();

    const textEls2 = container.querySelectorAll('text');
    const hasLoosingSlot = Array.from(textEls2).some((t) =>
      t.textContent?.startsWith('loosing'),
    );
    expect(hasLoosingSlot).toBe(true);

    // loading
    trigger(track, 'touchend');
    await later();

    const textEls3 = container.querySelectorAll('text');
    const hasLoadingSlot = Array.from(textEls3).some((t) =>
      t.textContent?.startsWith('loading'),
    );
    expect(hasLoadingSlot).toBe(true);
  });

  it('should not emit update:modelValue after pulling a short distance', async () => {
    const updates: boolean[] = [];
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PullRefresh,
              { 'onUpdate:modelValue': (v: boolean) => updates.push(v) },
              { default: () => h('text', null, 'Content') },
            );
        },
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;
    triggerDrag(track, 0, 10);
    await later();
    expect(updates.length).toBe(0);
  });

  it('should emit update:modelValue and refresh when pulled past threshold', async () => {
    const updates: boolean[] = [];
    let refreshCount = 0;
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PullRefresh,
              {
                'onUpdate:modelValue': (v: boolean) => updates.push(v),
                onRefresh: () => { refreshCount++; },
              },
              { default: () => h('text', null, 'Content') },
            );
        },
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;
    triggerDrag(track, 0, 100);
    await later();
    await nextTick();
    expect(updates).toEqual([true]);
    expect(refreshCount).toBe(1);
  });

  it('should render success text correctly', async () => {
    vi.useFakeTimers();
    const modelValue = ref(false);
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PullRefresh,
              {
                modelValue: modelValue.value,
                successText: 'Done!',
                successDuration: 0,
                'onUpdate:modelValue': (v: boolean) => {
                  modelValue.value = v;
                },
              },
              { default: () => h('text', null, 'Content') },
            );
        },
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;
    triggerDrag(track, 0, 100);
    await nextTick();

    // Set loading
    modelValue.value = true;
    await nextTick();

    // End loading — triggers success
    modelValue.value = false;
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasSuccess = Array.from(textEls).some(
      (t) => t.textContent === 'Done!',
    );
    expect(hasSuccess).toBe(true);

    // After successDuration (0ms), should go back to normal
    vi.runAllTimers();
    await nextTick();
    vi.useRealTimers();
  });

  it('should set height when using head-height', () => {
    const { container } = render(
      defineComponent({
        render: () =>
          h(
            PullRefresh,
            { headHeight: 100 },
            { default: () => h('text', null, 'Content') },
          ),
      }),
    );
    const head = container.querySelector('.van-pull-refresh__head') as HTMLElement;
    expect(head).toBeTruthy();
    expect(head.style.height).toEqual('100px');
  });

  it('should not respond to touch when disabled', async () => {
    const changes: any[] = [];
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PullRefresh,
              {
                disabled: true,
                onChange: (e: any) => changes.push(e),
              },
              { default: () => h('text', null, 'Content') },
            );
        },
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;
    triggerDrag(track, 0, 100);
    await later();
    expect(changes.length).toBe(0);
  });

  it('should not respond to touch during loading', async () => {
    const changes: any[] = [];
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PullRefresh,
              {
                onChange: (e: any) => changes.push(e),
              },
              { default: () => h('text', null, 'Content') },
            );
        },
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;

    // First, drag to trigger loading state
    triggerDrag(track, 0, 100);
    await later();

    // Now in loading state, record change count
    const changeCountBefore = changes.length;

    // Extra touch while loading should be ignored
    trigger(track, 'touchstart', 0, 0);
    trigger(track, 'touchmove', 0, 100);
    trigger(track, 'touchend');
    await later();

    // No new pulling/loosing changes should have been emitted
    const newChanges = changes.slice(changeCountBefore);
    const touchTriggeredChanges = newChanges.filter(
      (c) => c.status === 'pulling' || c.status === 'loosing',
    );
    expect(touchTriggeredChanges.length).toBe(0);
  });

  it('should allow custom pull distance', async () => {
    const changes: any[] = [];
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PullRefresh,
              {
                pullDistance: 300,
                onChange: (e: any) => changes.push(e),
              },
              { default: () => h('text', null, 'Content') },
            );
        },
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;

    trigger(track, 'touchstart', 0, 0);
    trigger(track, 'touchmove', 0, 100);
    await later();

    // With pullDistance=300, a 100px drag should still be 'pulling' (not loosing)
    const lastChange = changes[changes.length - 1];
    expect(lastChange.status).toBe('pulling');

    trigger(track, 'touchend');
  });

  it('should emit change event when status changed', async () => {
    const changes: any[] = [];
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PullRefresh,
              {
                onChange: (e: any) => changes.push(e),
              },
              { default: () => h('text', null, 'Content') },
            );
        },
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;
    trigger(track, 'touchstart', 0, 0);
    trigger(track, 'touchmove', 0, 20);
    await later();

    expect(changes.length).toBeGreaterThanOrEqual(1);
    expect(changes[0].status).toBe('pulling');
    expect(changes[0].distance).toBe(20);

    trigger(track, 'touchend');
  });

  it('should render success slot correctly', async () => {
    vi.useFakeTimers();
    const modelValue = ref(false);
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(
              PullRefresh,
              {
                modelValue: modelValue.value,
                'onUpdate:modelValue': (v: boolean) => {
                  modelValue.value = v;
                },
              },
              {
                default: () => h('text', null, 'Content'),
                success: () => h('text', null, 'Custom Success'),
              },
            );
        },
      }),
    );
    const track = container.querySelector('.van-pull-refresh__track')!;
    triggerDrag(track, 0, 100);
    await nextTick();

    // Set loading
    modelValue.value = true;
    await nextTick();

    // End loading
    modelValue.value = false;
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const hasCustomSuccess = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Success',
    );
    expect(hasCustomSuccess).toBe(true);

    vi.runAllTimers();
    vi.useRealTimers();
  });
});
