import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import ActionBar from '../../ActionBar/index.vue';
import ActionBarButton from '../index.vue';
import ActionBarIcon from '../../ActionBarIcon/index.vue';

// Helper: render and wait for reactive updates to propagate
async function renderAndFlush(...args: Parameters<typeof render>) {
  const result = render(...args);
  await nextTick();
  return result;
}

describe('ActionBarButton', () => {
  it('should render with van-action-bar-button BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar, { safeAreaInsetBottom: false }, {
            default: () => h(ActionBarButton, { type: 'danger', text: 'Buy' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-action-bar-button')).toBeTruthy();
  });

  it('should render default slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarButton, null, {
            default: () => 'Content',
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const hasContent = textEls.some((el: any) => el.textContent === 'Content');
    expect(hasContent).toBe(true);
  });

  it('should render text prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarButton, { type: 'danger', text: 'Buy Now' });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const hasText = textEls.some((el: any) => el.textContent === 'Buy Now');
    expect(hasText).toBe(true);
  });

  it('should apply first/last border radius classes when single button', async () => {
    const { container } = await renderAndFlush(
      defineComponent({
        render() {
          return h(ActionBar, { safeAreaInsetBottom: false }, {
            default: () => [
              h(ActionBarIcon, { icon: 'chat-o', text: 'Chat' }),
              h(ActionBarButton, { type: 'danger', text: 'Buy' }),
            ],
          });
        },
      }),
    );
    const button = container.querySelector('.van-action-bar-button');
    expect(button).toBeTruthy();
    expect(button!.classList.contains('van-action-bar-button--first')).toBe(true);
    expect(button!.classList.contains('van-action-bar-button--last')).toBe(true);
  });

  it('should apply first/last classes correctly with multiple buttons', async () => {
    const { container } = await renderAndFlush(
      defineComponent({
        render() {
          return h(ActionBar, { safeAreaInsetBottom: false }, {
            default: () => [
              h(ActionBarIcon, { icon: 'chat-o', text: 'Chat' }),
              h(ActionBarButton, { type: 'warning', text: 'Cart' }),
              h(ActionBarButton, { type: 'danger', text: 'Buy' }),
            ],
          });
        },
      }),
    );
    const buttons = container.querySelectorAll('.van-action-bar-button');
    expect(buttons.length).toBe(2);
    // First button has --first but not --last
    expect(buttons[0].classList.contains('van-action-bar-button--first')).toBe(true);
    expect(buttons[0].classList.contains('van-action-bar-button--last')).toBe(false);
    // Last button has --last but not --first
    expect(buttons[1].classList.contains('van-action-bar-button--first')).toBe(false);
    expect(buttons[1].classList.contains('van-action-bar-button--last')).toBe(true);
  });

  it('should apply type class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar, { safeAreaInsetBottom: false }, {
            default: () => h(ActionBarButton, { type: 'warning', text: 'Cart' }),
          });
        },
      }),
    );
    const button = container.querySelector('.van-action-bar-button');
    expect(button!.classList.contains('van-action-bar-button--warning')).toBe(true);
  });

  it('should render loading state', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarButton, { type: 'danger', text: 'Buy', loading: true });
        },
      }),
    );
    const loading = container.querySelector('.van-loading');
    expect(loading).toBeTruthy();
  });

  it('should render disabled state', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarButton, { type: 'danger', text: 'Buy', disabled: true });
        },
      }),
    );
    const button = container.querySelector('.van-button--disabled');
    expect(button).toBeTruthy();
  });

  it('should emit click event', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarButton, { type: 'danger', text: 'Buy', onClick });
        },
      }),
    );
    const button = container.querySelector('.van-action-bar-button');
    await fireEvent.tap(button!);
    await nextTick();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
