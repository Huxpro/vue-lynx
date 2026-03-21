import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Sidebar from '../index.vue';
import SidebarItem from '../../SidebarItem/index.vue';

describe('Sidebar', () => {
  it('should render sidebar with items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 0 }, {
            default: () => [
              h(SidebarItem, { title: 'Tab 1', index: 0 }),
              h(SidebarItem, { title: 'Tab 2', index: 1 }),
              h(SidebarItem, { title: 'Tab 3', index: 2 }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with active item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Sidebar, { modelValue: 1 }, {
            default: () => [
              h(SidebarItem, { title: 'Tab 1', index: 0 }),
              h(SidebarItem, { title: 'Tab 2', index: 1 }),
            ],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });
});
