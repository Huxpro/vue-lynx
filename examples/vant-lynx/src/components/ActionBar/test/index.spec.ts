import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ActionBar from '../index.vue';
import ActionBarIcon from '../../ActionBarIcon/index.vue';
import ActionBarButton from '../../ActionBarButton/index.vue';

describe('ActionBar', () => {
  it('should render with van-action-bar BEM class', () => {
    const { container } = render(
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
    expect(container.querySelector('.van-action-bar')).toBeTruthy();
  });

  it('should allow to disable safe-area-inset-bottom prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar, { safeAreaInsetBottom: false });
        },
      }),
    );
    const bar = container.querySelector('.van-action-bar');
    expect(bar).toBeTruthy();
    expect(bar!.classList.contains('van-safe-area-bottom')).toBe(false);
  });

  it('should have safe-area-inset-bottom class by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar);
        },
      }),
    );
    const bar = container.querySelector('.van-action-bar');
    expect(bar).toBeTruthy();
    expect(bar!.classList.contains('van-safe-area-bottom')).toBe(true);
  });

  it('should render placeholder element when using placeholder prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar, { placeholder: true, safeAreaInsetBottom: false });
        },
      }),
    );
    const placeholder = container.querySelector('.van-action-bar__placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('should not render placeholder by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar, { safeAreaInsetBottom: false });
        },
      }),
    );
    const placeholder = container.querySelector('.van-action-bar__placeholder');
    expect(placeholder).toBeFalsy();
  });

  it('should render with icons and buttons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar, { safeAreaInsetBottom: false }, {
            default: () => [
              h(ActionBarIcon, { icon: 'chat-o', text: 'Chat' }),
              h(ActionBarIcon, { icon: 'cart-o', text: 'Cart' }),
              h(ActionBarButton, { type: 'warning', text: 'Add to Cart' }),
              h(ActionBarButton, { type: 'danger', text: 'Buy Now' }),
            ],
          });
        },
      }),
    );
    const icons = container.querySelectorAll('.van-action-bar-icon');
    const buttons = container.querySelectorAll('.van-action-bar-button');
    expect(icons.length).toBe(2);
    expect(buttons.length).toBe(2);
  });
});
