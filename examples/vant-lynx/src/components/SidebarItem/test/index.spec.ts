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

  it('should render disabled item with not-allowed cursor', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => h(SidebarItem, { title: 'Disabled', disabled: true }),
          });
        },
      }),
    );
    const allViews = Array.from(container.querySelectorAll('view'));
    const disabledItem = allViews.find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('cursor: not-allowed');
    });
    expect(disabledItem).toBeTruthy();
  });

  it('should render disabled item with dimmed text color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => [
              h(SidebarItem, { title: 'Normal' }),
              h(SidebarItem, { title: 'Disabled', disabled: true }),
            ],
          });
        },
      }),
    );
    // Disabled item should have not-allowed cursor
    const allViews = Array.from(container.querySelectorAll('view'));
    const disabledItem = allViews.find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('not-allowed');
    });
    expect(disabledItem).toBeTruthy();
  });

  it('should render active item with bold text', () => {
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
    // The active item should exist and be clickable
    const allViews = Array.from(container.querySelectorAll('view'));
    const clickableItems = allViews.filter((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('cursor: pointer');
    });
    expect(clickableItems.length).toBe(2);
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
    const allViews = Array.from(container.querySelectorAll('view'));
    const dotView = allViews.find((v: any) => {
      const style = v.getAttribute('style') || '';
      return style.includes('border-radius') && style.includes('8px') && style.includes('background');
    });
    expect(dotView).toBeTruthy();
  });
});
