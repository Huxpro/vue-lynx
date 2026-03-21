import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import TreeSelect from '../index.vue';

describe('TreeSelect', () => {
  const items = [
    {
      text: 'Group 1',
      id: 'g1',
      children: [
        { text: 'Item A', id: 'a' },
        { text: 'Item B', id: 'b' },
      ],
    },
    {
      text: 'Group 2',
      id: 'g2',
      children: [
        { text: 'Item C', id: 'c' },
      ],
    },
  ];

  it('should render component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items, activeId: 'a', mainActiveIndex: 0 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render nav items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items, activeId: 'a', mainActiveIndex: 0 });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Group 1');
    expect(textContents).toContain('Group 2');
  });

  it('should render children of active nav', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items, activeId: 'a', mainActiveIndex: 0 });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Item A');
    expect(textContents).toContain('Item B');
  });

  it('should show selected icon for active item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items, activeId: 'a', mainActiveIndex: 0, selectedIcon: '✓' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('✓');
  });

  it('should support array activeId for multi-select', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items, activeId: ['a', 'b'], mainActiveIndex: 0 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
