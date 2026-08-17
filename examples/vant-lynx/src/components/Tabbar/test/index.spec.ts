import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tabbar from '../index.vue';
import TabbarItem from '../../TabbarItem/index.vue';

const activeClass = 'van-tabbar-item--active';

describe('Tabbar', () => {
  it('should render with van-tabbar class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-tabbar')).not.toBeNull();
  });

  it('should render tabbar items with van-tabbar-item class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, { key: 1 }, { default: () => 'Tab 1' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-tabbar-item');
    expect(items.length).toBe(2);
  });

  it('should render active item with active class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, { key: 1 }, { default: () => 'Active' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Inactive' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-tabbar-item');
    expect(items[0].getAttribute('class')).toContain(activeClass);
    expect(items[1].getAttribute('class')).not.toContain(activeClass);
  });

  it('should watch model-value and update active tab', async () => {
    const active = ref(0);
    const { container } = render(
      defineComponent({
        setup() {
          return { active };
        },
        render() {
          return h(Tabbar, { modelValue: this.active }, {
            default: () => [
              h(TabbarItem, { key: 1 }, { default: () => 'Tab 1' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    let items = container.querySelectorAll('.van-tabbar-item');
    expect(items[0].getAttribute('class')).toContain(activeClass);

    active.value = 1;
    await nextTick();
    items = container.querySelectorAll('.van-tabbar-item');
    expect(items[1].getAttribute('class')).toContain(activeClass);
  });

  it('should match active tab by name when using name prop', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 'a', onChange }, {
            default: () => [
              h(TabbarItem, { name: 'a', key: 'a' }, { default: () => 'A' }),
              h(TabbarItem, { name: 'b', key: 'b' }, { default: () => 'B' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-tabbar-item');
    expect(items[0].getAttribute('class')).toContain(activeClass);

    await fireEvent.tap(items[1]);
    await nextTick();
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('should emit update:modelValue and change events on tab click', async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, {
            modelValue: 0,
            'onUpdate:modelValue': onUpdate,
            onChange,
          }, {
            default: () => [
              h(TabbarItem, { key: 1 }, { default: () => 'Tab 1' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-tabbar-item');
    await fireEvent.tap(items[1]);
    await nextTick();
    expect(onUpdate).toHaveBeenCalledWith(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should not emit events when clicking active tab', async () => {
    const onUpdate = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, {
            modelValue: 0,
            'onUpdate:modelValue': onUpdate,
            onChange,
          }, {
            default: () => [
              h(TabbarItem, { key: 1 }, { default: () => 'Tab 1' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-tabbar-item');
    await fireEvent.tap(items[0]);
    await nextTick();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should emit click event on TabbarItem', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, { onClick, key: 1 }, { default: () => 'Tab 1' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-tabbar-item');
    await fireEvent.tap(items[0]);
    await nextTick();
    expect(onClick).toHaveBeenCalled();
  });

  it('should not render border when border prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, border: false }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const tabbar = container.querySelector('.van-tabbar');
    expect(tabbar!.getAttribute('class')).not.toContain('van-hairline--top-bottom');
  });

  it('should render border by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const tabbar = container.querySelector('.van-tabbar');
    expect(tabbar!.getAttribute('class')).toContain('van-hairline--top-bottom');
  });

  it('should render placeholder element when using placeholder prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, {
            modelValue: 0,
            fixed: true,
            placeholder: true,
          }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-tabbar__placeholder')).not.toBeNull();
    expect(container.querySelector('.van-tabbar')).not.toBeNull();
  });

  it('should render fixed class when fixed prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, fixed: true }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const tabbar = container.querySelector('.van-tabbar');
    expect(tabbar!.getAttribute('class')).toContain('van-tabbar--fixed');
  });

  it('should not render fixed class when fixed prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, fixed: false }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const tabbar = container.querySelector('.van-tabbar');
    expect(tabbar!.getAttribute('class')).not.toContain('van-tabbar--fixed');
  });

  it('should render custom zIndex', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, zIndex: 100 }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const tabbar = container.querySelector('.van-tabbar');
    const style = tabbar!.getAttribute('style') || '';
    expect(style).toContain('z-index: 100');
  });

  it('should render safe area class when fixed', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, fixed: true }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const tabbar = container.querySelector('.van-tabbar');
    expect(tabbar!.getAttribute('class')).toContain('van-safe-area-bottom');
  });

  it('should not render safe area class when safeAreaInsetBottom is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, {
            modelValue: 0,
            fixed: true,
            safeAreaInsetBottom: false,
          }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const tabbar = container.querySelector('.van-tabbar');
    expect(tabbar!.getAttribute('class')).not.toContain('van-safe-area-bottom');
  });

  it('should not render safe area class when not fixed', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, fixed: false }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const tabbar = container.querySelector('.van-tabbar');
    expect(tabbar!.getAttribute('class')).not.toContain('van-safe-area-bottom');
  });

  it('should render custom active and inactive colors via inline style', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, {
            modelValue: 0,
            activeColor: '#ee0a24',
            inactiveColor: '#999',
          }, {
            default: () => [
              h(TabbarItem, { key: 1 }, { default: () => 'Active' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Inactive' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-tabbar-item');
    // Active item should have activeColor in inline style
    const activeStyle = items[0].getAttribute('style') || '';
    expect(activeStyle).toContain('rgb(238, 10, 36)');
    // Inactive item should have inactiveColor in inline style
    const inactiveStyle = items[1].getAttribute('style') || '';
    expect(inactiveStyle).toContain('rgb(153, 153, 153)');
  });

  it('should support beforeChange interceptor that blocks change', async () => {
    const onUpdate = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, {
            modelValue: 0,
            beforeChange: () => false,
            'onUpdate:modelValue': onUpdate,
          }, {
            default: () => [
              h(TabbarItem, { key: 1 }, { default: () => 'Tab 1' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-tabbar-item');
    await fireEvent.tap(items[1]);
    await nextTick();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should support async beforeChange interceptor', async () => {
    const onUpdate = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, {
            modelValue: 0,
            beforeChange: () => Promise.resolve(true),
            'onUpdate:modelValue': onUpdate,
          }, {
            default: () => [
              h(TabbarItem, { key: 1 }, { default: () => 'Tab 1' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-tabbar-item');
    await fireEvent.tap(items[1]);
    await nextTick();
    // Wait for promise resolution
    await new Promise((r) => setTimeout(r, 10));
    expect(onUpdate).toHaveBeenCalledWith(1);
  });

  it('should auto-index items when name is not provided', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, onChange }, {
            default: () => [
              h(TabbarItem, { key: 1 }, { default: () => 'Tab 1' }),
              h(TabbarItem, { key: 2 }, { default: () => 'Tab 2' }),
              h(TabbarItem, { key: 3 }, { default: () => 'Tab 3' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const items = container.querySelectorAll('.van-tabbar-item');
    await fireEvent.tap(items[2]);
    await nextTick();
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should render icon in TabbarItem', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, { icon: 'home-o' }, { default: () => 'Home' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    // Icon component renders inside van-tabbar-item__icon
    expect(container.querySelector('.van-tabbar-item__icon')).not.toBeNull();
  });

  it('should render badge on TabbarItem', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, { badge: 5 }, { default: () => 'Tab' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const textEls = container.querySelectorAll('text');
    const hasBadge = Array.from(textEls).some((t) => t.textContent === '5');
    expect(hasBadge).toBe(true);
  });

  it('should render dot on TabbarItem', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, { dot: true }, { default: () => 'Tab' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const dotBadge = container.querySelector('.van-badge--dot');
    expect(dotBadge).toBeTruthy();
  });

  it('should render badge-props correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, {
                badge: 0,
                badgeProps: { color: 'blue' },
              }, { default: () => 'Tab' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const style = badge!.getAttribute('style') || '';
    expect(style).toContain('background');
  });

  it('should render icon slot with active state', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, { key: 1 }, {
                default: () => 'Custom',
                icon: (props: { active: boolean }) =>
                  h('text', {}, props.active ? 'Active Icon' : 'Inactive Icon'),
              }),
              h(TabbarItem, { key: 2 }, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const textEls = container.querySelectorAll('text');
    const hasActiveIcon = Array.from(textEls).some(
      (t) => t.textContent === 'Active Icon',
    );
    expect(hasActiveIcon).toBe(true);
  });

  it('should render van-tabbar-item__text wrapper', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-tabbar-item__text')).not.toBeNull();
  });

  it('should render van-tabbar-item__icon wrapper', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => h(TabbarItem, { icon: 'home-o' }, { default: () => 'Tab' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-tabbar-item__icon')).not.toBeNull();
  });
});
