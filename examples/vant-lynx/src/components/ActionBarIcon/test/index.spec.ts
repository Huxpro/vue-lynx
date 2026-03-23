import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import ActionBar from '../../ActionBar/index.vue';
import ActionBarIcon from '../index.vue';

describe('ActionBarIcon', () => {
  it('should render with van-action-bar-icon BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBar, { safeAreaInsetBottom: false }, {
            default: () => h(ActionBarIcon, { text: 'Chat' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-action-bar-icon')).toBeTruthy();
  });

  it('should render default slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, null, {
            default: () => 'Content',
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const hasContent = textEls.some((el: any) => el.textContent === 'Content');
    expect(hasContent).toBe(true);
  });

  it('should render icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, null, {
            default: () => 'Content',
            icon: () => h('text', null, 'Custom Icon'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const hasCustomIcon = textEls.some((el: any) => el.textContent === 'Custom Icon');
    expect(hasCustomIcon).toBe(true);
  });

  it('should render icon slot with badge correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, { badge: '1' }, {
            default: () => 'Content',
            icon: () => h('text', null, 'Custom Icon'),
          });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
  });

  it('should render icon slot with dot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, { dot: true }, {
            default: () => 'Content',
            icon: () => h('text', null, 'Custom Icon'),
          });
        },
      }),
    );
    const dot = container.querySelector('.van-badge--dot');
    expect(dot).toBeTruthy();
  });

  it('should render text prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, { icon: 'chat-o', text: 'Search' });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const hasText = textEls.some((el: any) => el.textContent === 'Search');
    expect(hasText).toBe(true);
  });

  it('should render disabled prop correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, {
            disabled: true,
            text: 'Search',
            icon: 'search',
          });
        },
      }),
    );
    const icon = container.querySelector('.van-action-bar-icon');
    expect(icon!.classList.contains('van-action-bar-icon--disabled')).toBe(true);
  });

  it('should not emit click when disabled', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, {
            disabled: true,
            text: 'Search',
            icon: 'search',
            onClick,
          });
        },
      }),
    );
    const icon = container.querySelector('.van-action-bar-icon');
    await fireEvent.tap(icon!);
    await nextTick();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should emit click when not disabled', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, {
            text: 'Search',
            icon: 'search',
            onClick,
          });
        },
      }),
    );
    const icon = container.querySelector('.van-action-bar-icon');
    await fireEvent.tap(icon!);
    await nextTick();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render badge-props prop correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ActionBarIcon, {
            badge: 1,
            icon: 'chat-o',
            badgeProps: { color: 'blue' },
          });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
  });
});
