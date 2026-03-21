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
            default: () => h(SidebarItem, { title: 'Test Item', index: 0 }),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should render disabled item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => h(SidebarItem, { title: 'Disabled', index: 0, disabled: true }),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render item with badge', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => h(SidebarItem, { title: 'Badge', index: 0, badge: 5 }),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });
});
