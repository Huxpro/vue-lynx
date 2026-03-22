import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tabbar from '../index.vue';
import TabbarItem from '../../TabbarItem/index.vue';

// Colors are converted to rgb() in the test environment
const ACTIVE_COLOR_RGB = 'rgb(25, 137, 250)'; // #1989fa
const INACTIVE_COLOR_RGB = 'rgb(50, 50, 51)'; // #323233

describe('Tabbar', () => {
  it('should render tabbar with items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, null, { default: () => 'Tab 1' }),
              h(TabbarItem, null, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((t) => t.textContent);
    expect(texts).toContain('Tab 1');
    expect(texts).toContain('Tab 2');
  });

  it('should render active item with active color', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, null, { default: () => 'Active' }),
              h(TabbarItem, null, { default: () => 'Inactive' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const textEls = container.querySelectorAll('text');
    const activeText = Array.from(textEls).find((t) => t.textContent === 'Active');
    const inactiveText = Array.from(textEls).find((t) => t.textContent === 'Inactive');
    expect(activeText?.getAttribute('style')).toContain(ACTIVE_COLOR_RGB);
    expect(inactiveText?.getAttribute('style')).toContain(INACTIVE_COLOR_RGB);
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
              h(TabbarItem, null, { default: () => 'Tab 1' }),
              h(TabbarItem, null, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    let textEls = container.querySelectorAll('text');
    let tab1 = Array.from(textEls).find((t) => t.textContent === 'Tab 1');
    expect(tab1?.getAttribute('style')).toContain(ACTIVE_COLOR_RGB);

    active.value = 1;
    await nextTick();
    textEls = container.querySelectorAll('text');
    const tab2 = Array.from(textEls).find((t) => t.textContent === 'Tab 2');
    expect(tab2?.getAttribute('style')).toContain(ACTIVE_COLOR_RGB);
  });

  it('should match active tab by name when using name prop', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 'a', onChange }, {
            default: () => [
              h(TabbarItem, { name: 'a' }, { default: () => 'A' }),
              h(TabbarItem, { name: 'b' }, { default: () => 'B' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const itemViews = Array.from(views).filter((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('flex: 1') && style.includes('cursor: pointer');
    });
    expect(itemViews.length).toBe(2);
    await fireEvent.tap(itemViews[1]);
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
              h(TabbarItem, null, { default: () => 'Tab 1' }),
              h(TabbarItem, null, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const itemViews = Array.from(views).filter((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('flex: 1') && style.includes('cursor: pointer');
    });
    await fireEvent.tap(itemViews[1]);
    await nextTick();
    expect(onUpdate).toHaveBeenCalledWith(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should emit click event on TabbarItem', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, { onClick }, { default: () => 'Tab 1' }),
              h(TabbarItem, null, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const itemViews = Array.from(views).filter((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('flex: 1') && style.includes('cursor: pointer');
    });
    await fireEvent.tap(itemViews[0]);
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
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('border-top-width: 0px');
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
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('border-top-width: 0.5px');
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
    const views = container.querySelectorAll('view');
    const placeholderView = views[0];
    const style = placeholderView!.getAttribute('style') || '';
    expect(style).toContain('height:');
  });

  it('should render fixed position when fixed prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, fixed: true }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const hasFixed = Array.from(views).some((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('position: fixed');
    });
    expect(hasFixed).toBe(true);
  });

  it('should render relative position when fixed prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, fixed: false }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('position: relative');
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
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('z-index: 100');
  });

  it('should render custom active and inactive colors', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, {
            modelValue: 0,
            activeColor: '#ee0a24',
            inactiveColor: '#999',
          }, {
            default: () => [
              h(TabbarItem, null, { default: () => 'Active' }),
              h(TabbarItem, null, { default: () => 'Inactive' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const textEls = container.querySelectorAll('text');
    const activeText = Array.from(textEls).find((t) => t.textContent === 'Active');
    const inactiveText = Array.from(textEls).find((t) => t.textContent === 'Inactive');
    // #ee0a24 = rgb(238, 10, 36), #999 = rgb(153, 153, 153)
    expect(activeText?.getAttribute('style')).toContain('rgb(238, 10, 36)');
    expect(inactiveText?.getAttribute('style')).toContain('rgb(153, 153, 153)');
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
              h(TabbarItem, null, { default: () => 'Tab 1' }),
              h(TabbarItem, null, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const itemViews = Array.from(views).filter((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('flex: 1') && style.includes('cursor: pointer');
    });
    await fireEvent.tap(itemViews[1]);
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
              h(TabbarItem, null, { default: () => 'Tab 1' }),
              h(TabbarItem, null, { default: () => 'Tab 2' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const itemViews = Array.from(views).filter((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('flex: 1') && style.includes('cursor: pointer');
    });
    await fireEvent.tap(itemViews[1]);
    await nextTick();
    // Wait for promise resolution
    await new Promise((r) => setTimeout(r, 10));
    expect(onUpdate).toHaveBeenCalledWith(1);
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
    const textEls = container.querySelectorAll('text');
    // Should have at least icon text + label text
    expect(textEls.length).toBeGreaterThanOrEqual(2);
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
    const textEls = container.querySelectorAll('text');
    const hasBadge = Array.from(textEls).some(
      (t) => t.textContent === '5',
    );
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
    const views = container.querySelectorAll('view');
    const hasDot = Array.from(views).some((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('border-radius') && style.includes('8px');
    });
    expect(hasDot).toBe(true);
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
    const views = container.querySelectorAll('view');
    const badgeView = Array.from(views).find((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('background-color: blue');
    });
    expect(badgeView).toBeDefined();
  });

  it('should render safe area padding when fixed', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, fixed: true }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const hasBottomPadding = Array.from(views).some((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('padding-bottom: 34px');
    });
    expect(hasBottomPadding).toBe(true);
  });

  it('should not render safe area padding when safeAreaInsetBottom is false', () => {
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
    const views = container.querySelectorAll('view');
    const hasNoPadding = Array.from(views).some((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('padding-bottom: 0px');
    });
    expect(hasNoPadding).toBe(true);
  });

  it('should auto-index items when name is not provided', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0, onChange }, {
            default: () => [
              h(TabbarItem, null, { default: () => 'Tab 1' }),
              h(TabbarItem, null, { default: () => 'Tab 2' }),
              h(TabbarItem, null, { default: () => 'Tab 3' }),
            ],
          });
        },
      }),
    );
    await nextTick();
    const views = container.querySelectorAll('view');
    const itemViews = Array.from(views).filter((v) => {
      const style = v.getAttribute('style') || '';
      return style.includes('flex: 1') && style.includes('cursor: pointer');
    });
    await fireEvent.tap(itemViews[2]);
    await nextTick();
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should render icon slot with active state', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => [
              h(TabbarItem, null, {
                default: () => 'Custom',
                icon: (props: { active: boolean }) =>
                  h('text', {}, props.active ? 'Active Icon' : 'Inactive Icon'),
              }),
              h(TabbarItem, null, { default: () => 'Tab 2' }),
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

  it('should render flex-row layout', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tabbar, { modelValue: 0 }, {
            default: () => h(TabbarItem, null, { default: () => 'Tab' }),
          });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView!.getAttribute('style') || '';
    expect(style).toContain('flex-direction: row');
  });
});
