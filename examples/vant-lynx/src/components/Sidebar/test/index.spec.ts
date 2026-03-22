import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Sidebar from '../index.vue';
import SidebarItem from '../../SidebarItem/index.vue';

describe('Sidebar', () => {
  it('should render with van-sidebar BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () => h(SidebarItem, { title: 'Text' }),
          });
        },
      }),
    );
    expect(container.querySelector('.van-sidebar')).toBeTruthy();
  });

  it('should render sidebar items with van-sidebar-item BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () => [
              h(SidebarItem, { title: 'A' }),
              h(SidebarItem, { title: 'B' }),
            ],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-sidebar-item');
    expect(items.length).toBe(2);
  });

  it('should apply --select class to active item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 1 }, {
            default: () => [
              h(SidebarItem, { title: 'A' }),
              h(SidebarItem, { title: 'B' }),
            ],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-sidebar-item');
    expect(items[0].classList.contains('van-sidebar-item--select')).toBe(false);
    expect(items[1].classList.contains('van-sidebar-item--select')).toBe(true);
  });

  it('should apply --disabled class to disabled item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () => [
              h(SidebarItem, { title: 'A' }),
              h(SidebarItem, { title: 'B', disabled: true }),
            ],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-sidebar-item');
    expect(items[0].classList.contains('van-sidebar-item--disabled')).toBe(false);
    expect(items[1].classList.contains('van-sidebar-item--disabled')).toBe(true);
  });

  it('should render selected bar for active item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => [
              h(SidebarItem, { title: 'A' }),
              h(SidebarItem, { title: 'B' }),
            ],
          });
        },
      }),
    );
    const bar = container.querySelector('.van-sidebar-item__selected-bar');
    expect(bar).toBeTruthy();
  });

  it('should render __text element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () => h(SidebarItem, { title: 'Hello' }),
          });
        },
      }),
    );
    const textEl = container.querySelector('.van-sidebar-item__text');
    expect(textEl).toBeTruthy();
  });

  // Vant test: should emit change event when active item changed
  it('should emit change event when active item changed', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { onChange }, {
            default: () => [
              h(SidebarItem, { title: 'Text' }),
              h(SidebarItem, { title: 'Text' }),
            ],
          });
        },
      }),
    );

    const items = container.querySelectorAll('.van-sidebar-item');

    await fireEvent.tap(items[0]);
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(0);

    await fireEvent.tap(items[1]);
    await nextTick();
    expect(onChange).toHaveBeenCalledWith(1);
  });

  // Vant test: should emit click event when SidebarItem is clicked
  it('should emit click event when SidebarItem is clicked', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () => h(SidebarItem, { title: 'Text', onClick }),
          });
        },
      }),
    );

    const items = container.querySelectorAll('.van-sidebar-item');
    await fireEvent.tap(items[0]);
    await nextTick();
    expect(onClick).toHaveBeenCalledWith(0);
  });

  // Vant test: should update v-model when active item changed
  it('should update v-model when active item changed', async () => {
    const onChange = vi.fn();
    const active = ref(0);
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Sidebar, {
              modelValue: active.value,
              'onUpdate:modelValue': (v: number) => { active.value = v; },
              onChange,
            }, {
              default: () => [
                h(SidebarItem, { title: 'Text' }),
                h(SidebarItem, { title: 'Text' }),
              ],
            });
        },
      }),
    );

    const items = container.querySelectorAll('.van-sidebar-item');
    await fireEvent.tap(items[1]);
    await nextTick();
    expect(active.value).toEqual(1);
    expect(onChange).toHaveBeenCalledWith(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  // Vant test: should not update v-model when disabled SidebarItem is clicked
  it('should not update v-model when disabled SidebarItem is clicked', async () => {
    const active = ref(0);
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Sidebar, {
              modelValue: active.value,
              'onUpdate:modelValue': (v: number) => { active.value = v; },
            }, {
              default: () => [
                h(SidebarItem, { title: 'Text' }),
                h(SidebarItem, { title: 'Text', disabled: true }),
              ],
            });
        },
      }),
    );

    const items = container.querySelectorAll('.van-sidebar-item');
    await fireEvent.tap(items[1]);
    await nextTick();
    expect(active.value).toEqual(0);
  });

  // Vant test: should render title slot correctly
  it('should render title slot correctly', async () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Sidebar, { modelValue: 0 }, {
              default: () =>
                h(SidebarItem, null, {
                  title: () => h('text', null, 'Custom Title'),
                }),
            });
        },
      }),
    );

    const textEls = Array.from(container.querySelectorAll('text'));
    const hasCustomTitle = textEls.some(
      (el: any) => el.textContent === 'Custom Title',
    );
    expect(hasCustomTitle).toBe(true);
  });

  // Vant test: should render badge-props correctly
  it('should render badge-props correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () =>
              h(SidebarItem, {
                title: 'Text',
                badge: 1,
                badgeProps: { color: 'blue' },
              }),
          });
        },
      }),
    );

    const badgeEl = container.querySelector('.van-badge');
    expect(badgeEl).toBeTruthy();
  });

  it('should render dot badge', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () => h(SidebarItem, { title: 'Dot', dot: true }),
          });
        },
      }),
    );

    const dot = container.querySelector('.van-badge--dot');
    expect(dot).toBeTruthy();
  });

  it('should not render selected bar for non-active items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => [
              h(SidebarItem, { title: 'A' }),
              h(SidebarItem, { title: 'B' }),
            ],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-sidebar-item');
    // Only the first (active) item should have a selected bar
    const firstBar = items[0].querySelector('.van-sidebar-item__selected-bar');
    const secondBar = items[1].querySelector('.van-sidebar-item__selected-bar');
    expect(firstBar).toBeTruthy();
    expect(secondBar).toBeFalsy();
  });

  it('should not emit click when disabled item is tapped', async () => {
    const onClick = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () => h(SidebarItem, { title: 'Text', disabled: true, onClick }),
          });
        },
      }),
    );

    const items = container.querySelectorAll('.van-sidebar-item');
    await fireEvent.tap(items[0]);
    await nextTick();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should render multiple items with correct titles', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, null, {
            default: () => [
              h(SidebarItem, { title: 'Tab 1' }),
              h(SidebarItem, { title: 'Tab 2' }),
              h(SidebarItem, { title: 'Tab 3' }),
            ],
          });
        },
      }),
    );

    const textEls = Array.from(container.querySelectorAll('text'));
    const titles = textEls
      .map((el: any) => el.textContent)
      .filter((t: string) => t.startsWith('Tab'));
    expect(titles).toEqual(['Tab 1', 'Tab 2', 'Tab 3']);
  });

  it('should handle modelValue as string', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: '1' }, {
            default: () => [
              h(SidebarItem, { title: 'A' }),
              h(SidebarItem, { title: 'B' }),
            ],
          });
        },
      }),
    );

    const items = container.querySelectorAll('.van-sidebar-item');
    expect(items[1].classList.contains('van-sidebar-item--select')).toBe(true);
  });
});
