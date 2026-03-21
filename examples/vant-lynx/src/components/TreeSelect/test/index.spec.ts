import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import TreeSelect from '../index.vue';

const items = [
  { text: 'Group 1', id: 1, children: [{ text: 'Child 1', id: 11 }, { text: 'Child 2', id: 12 }] },
  { text: 'Group 2', id: 2, children: [{ text: 'Child 3', id: 21 }] },
];

describe('TreeSelect', () => {
  it('should render with items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasGroup1 = Array.from(textEls).some((t) => t.textContent === 'Group 1');
    const hasGroup2 = Array.from(textEls).some((t) => t.textContent === 'Group 2');
    expect(hasGroup1).toBe(true);
    expect(hasGroup2).toBe(true);
  });

  it('should render children of active nav item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items, mainActiveIndex: 0 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasChild1 = Array.from(textEls).some((t) => t.textContent === 'Child 1');
    const hasChild2 = Array.from(textEls).some((t) => t.textContent === 'Child 2');
    expect(hasChild1).toBe(true);
    expect(hasChild2).toBe(true);
  });

  it('should render with custom height', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items, height: 500 });
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
          return h(TreeSelect, { items, mainActiveIndex: 0, activeId: 11 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasSelectedIcon = Array.from(textEls).some((t) => t.textContent === '✓');
    expect(hasSelectedIcon).toBe(true);
  });

  it('should render with custom selected icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items, mainActiveIndex: 0, activeId: 11, selectedIcon: '★' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustomIcon = Array.from(textEls).some((t) => t.textContent === '★');
    expect(hasCustomIcon).toBe(true);
  });
});
