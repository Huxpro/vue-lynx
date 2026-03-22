import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Sidebar from '../../Sidebar/index.vue';
import SidebarItem from '../index.vue';

describe('SidebarItem', () => {
  it('should render sidebar item with title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => h(SidebarItem, { title: 'Test Item' }),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const hasTitle = textEls.some(
      (el: any) => el.textContent === 'Test Item',
    );
    expect(hasTitle).toBe(true);
  });

  it('should apply --disabled BEM class when disabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => h(SidebarItem, { title: 'Disabled', disabled: true }),
          });
        },
      }),
    );
    const item = container.querySelector('.van-sidebar-item');
    expect(item?.classList.contains('van-sidebar-item--disabled')).toBe(true);
  });

  it('should apply --select BEM class when active', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => [
              h(SidebarItem, { title: 'Active' }),
              h(SidebarItem, { title: 'Inactive' }),
            ],
          });
        },
      }),
    );
    const items = container.querySelectorAll('.van-sidebar-item');
    expect(items[0].classList.contains('van-sidebar-item--select')).toBe(true);
    expect(items[1].classList.contains('van-sidebar-item--select')).toBe(false);
  });

  it('should render item with badge', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => h(SidebarItem, { title: 'Badge', badge: 5 }),
          });
        },
      }),
    );
    const badge = container.querySelector('.van-badge');
    expect(badge).toBeTruthy();
    const textEls = Array.from(container.querySelectorAll('text'));
    const hasBadge = textEls.some(
      (el: any) => el.textContent === '5',
    );
    expect(hasBadge).toBe(true);
  });

  it('should render item with dot badge', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => h(SidebarItem, { title: 'Dot', dot: true }),
          });
        },
      }),
    );
    const dot = container.querySelector('.van-badge--dot');
    expect(dot).toBeTruthy();
  });

  it('should render __text sub-element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => h(SidebarItem, { title: 'Hello' }),
          });
        },
      }),
    );
    const textEl = container.querySelector('.van-sidebar-item__text');
    expect(textEl).toBeTruthy();
  });

  it('should render selected bar for active item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => h(SidebarItem, { title: 'Active' }),
          });
        },
      }),
    );
    const bar = container.querySelector('.van-sidebar-item__selected-bar');
    expect(bar).toBeTruthy();
  });

  it('should not render selected bar for non-active item', () => {
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
    expect(items[0].querySelector('.van-sidebar-item__selected-bar')).toBeFalsy();
    expect(items[1].querySelector('.van-sidebar-item__selected-bar')).toBeTruthy();
  });
});
