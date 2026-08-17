import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import BackTop from '../index.vue';

async function later() {
  await nextTick();
  await nextTick();
  await new Promise((r) => setTimeout(r, 0));
}

describe('BackTop', () => {
  it('should not have active class by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop);
        },
      }),
    );
    const el = container.querySelector('.van-back-top');
    expect(el).toBeTruthy();
    expect(el!.getAttribute('class')).not.toContain('van-back-top--active');
  });

  it('should add active class when scroll offset is reached', async () => {
    const backTopRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, {
            offset: 100,
            ref: (el: any) => { backTopRef.value = el; },
          });
        },
      }),
    );

    await later();
    expect(container.querySelector('.van-back-top--active')).toBeFalsy();

    backTopRef.value?.handleScroll({ detail: { scrollTop: 150 } });
    await later();

    expect(container.querySelector('.van-back-top--active')).toBeTruthy();
  });

  it('should remove active class when scroll goes below offset', async () => {
    const backTopRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, {
            offset: 100,
            ref: (el: any) => { backTopRef.value = el; },
          });
        },
      }),
    );

    await later();

    // Show
    backTopRef.value?.handleScroll({ detail: { scrollTop: 150 } });
    await later();
    expect(container.querySelector('.van-back-top--active')).toBeTruthy();

    // Hide
    backTopRef.value?.handleScroll({ detail: { scrollTop: 50 } });
    await later();
    expect(container.querySelector('.van-back-top--active')).toBeFalsy();
  });

  it('should allow to custom position by position prop', async () => {
    const backTopRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, {
            right: 30,
            bottom: 100,
            zIndex: 200,
            offset: 0,
            ref: (el: any) => { backTopRef.value = el; },
          });
        },
      }),
    );

    await later();
    backTopRef.value?.handleScroll({ detail: { scrollTop: 0 } });
    await later();

    const button = container.querySelector('.van-back-top');
    expect(button).toBeTruthy();
    const style = button!.getAttribute('style') || '';
    expect(style).toContain('right: 30px');
    expect(style).toContain('bottom: 100px');
    expect(style).toContain('z-index: 200');
  });

  it('should allow position prop to contain unit', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, {
            right: '2rem',
            bottom: '4rem',
            offset: 0,
          });
        },
      }),
    );

    await later();

    const button = container.querySelector('.van-back-top');
    expect(button).toBeTruthy();
    const style = button!.getAttribute('style') || '';
    expect(style).toContain('right: 2rem');
    expect(style).toContain('bottom: 4rem');
  });

  it('should emit click event after clicked', async () => {
    const onClick = vi.fn();
    const backTopRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, {
            offset: 0,
            onClick,
            ref: (el: any) => { backTopRef.value = el; },
          });
        },
      }),
    );

    await later();
    backTopRef.value?.handleScroll({ detail: { scrollTop: 0 } });
    await later();

    const button = container.querySelector('.van-back-top');
    expect(button).toBeTruthy();
    await fireEvent.tap(button!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should use default offset of 200', async () => {
    const backTopRef = ref<any>(null);
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, {
            ref: (el: any) => { backTopRef.value = el; },
          });
        },
      }),
    );

    await later();

    // Scroll to 199 - should not be active
    backTopRef.value?.handleScroll({ detail: { scrollTop: 199 } });
    await later();
    expect(container.querySelector('.van-back-top--active')).toBeFalsy();

    // Scroll to 200 - should be active
    backTopRef.value?.handleScroll({ detail: { scrollTop: 200 } });
    await later();
    expect(container.querySelector('.van-back-top--active')).toBeTruthy();
  });

  it('should render default icon when no slot content', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, { offset: 0 });
        },
      }),
    );

    await later();

    const iconEl = container.querySelector('.van-back-top__icon');
    expect(iconEl).toBeTruthy();
  });

  it('should render custom content via default slot', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            BackTop,
            { offset: 0 },
            { default: () => h('text', {}, 'Back to Top') },
          );
        },
      }),
    );

    await later();

    const textElements = container.querySelectorAll('text');
    const found = Array.from(textElements).some(
      (el: any) => el.textContent === 'Back to Top',
    );
    expect(found).toBe(true);
  });

  it('should use CSS class defaults when right/bottom not specified', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, { offset: 0 });
        },
      }),
    );

    await later();

    const button = container.querySelector('.van-back-top');
    expect(button).toBeTruthy();
    // Right and bottom should come from CSS variables, not inline styles
    const style = button!.getAttribute('style') || '';
    expect(style).not.toContain('right:');
    expect(style).not.toContain('bottom:');
  });

  it('should accept teleport prop for API parity', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, { teleport: 'body', offset: 0 });
        },
      }),
    );
    expect(container).toBeTruthy();
  });

  it('should accept immediate prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, { immediate: true, offset: 0 });
        },
      }),
    );
    expect(container.querySelector('.van-back-top')).toBeTruthy();
  });

  it('should accept target prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, { target: '.scroll-container', offset: 0 });
        },
      }),
    );
    expect(container.querySelector('.van-back-top')).toBeTruthy();
  });

  it('should have proper BEM class names', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(BackTop, { offset: 0 });
        },
      }),
    );

    await later();

    const el = container.querySelector('.van-back-top');
    expect(el).toBeTruthy();
    expect(el!.getAttribute('class')).toContain('van-back-top');
  });
});
