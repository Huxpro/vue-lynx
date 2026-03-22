import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import TreeSelect from '../index.vue';

const mockItem = { text: 'city1', id: 1 };
const mockItem2 = { text: 'city2', id: 2 };

const mockItems = [
  { text: 'group1', children: [mockItem] },
  { text: 'group2', children: [mockItem] },
];

function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

function findNavItems(container: any): any[] {
  // Nav items are in the first child view (flex:1 sidebar)
  const rootView = container.querySelector('view');
  if (!rootView) return [];
  const sidebarView = rootView.querySelector('view');
  if (!sidebarView) return [];
  return Array.from(sidebarView.children).filter(
    (el: any) => el.tagName?.toLowerCase() === 'view',
  );
}

function findContentItems(container: any): any[] {
  // Content items are in the second child view (flex:2 content)
  const rootView = container.querySelector('view');
  if (!rootView) return [];
  const children = Array.from(rootView.children).filter(
    (el: any) => el.tagName?.toLowerCase() === 'view',
  ) as any[];
  if (children.length < 2) return [];
  const contentView = children[1];
  return Array.from(contentView.children).filter(
    (el: any) => el.tagName?.toLowerCase() === 'view',
  );
}

describe('TreeSelect', () => {
  // Vant test 1: should render empty TreeSelect correctly
  it('should render empty TreeSelect correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  // Vant test 2: should emit update:mainActiveIndex event when mainActiveIndex is changed
  it('should emit update:mainActiveIndex event when mainActiveIndex is changed', async () => {
    const updateEvents: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TreeSelect, {
            items: mockItems,
            mainActiveIndex: 0,
            'onUpdate:mainActiveIndex': (val: number) =>
              updateEvents.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const navItems = findNavItems(container);
    expect(navItems.length).toBe(2);

    // Click already active nav (index 0) — should NOT emit update:mainActiveIndex
    fireEvent.tap(navItems[0]);
    await nextTick();
    expect(updateEvents.length).toBe(0);

    // Click different nav (index 1) — should emit
    fireEvent.tap(navItems[1]);
    await nextTick();
    expect(updateEvents).toEqual([1]);
  });

  // Vant test 3: should emit clickNav event when nav item is clicked
  it('should emit clickNav event when nav item is clicked', async () => {
    const clickNavEvents: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TreeSelect, {
            items: mockItems,
            onClickNav: (index: number) => clickNavEvents.push(index),
          });
      },
    });

    const { container } = render(Comp);
    const navItems = findNavItems(container);

    // Click nav item 0 twice — should emit both times
    fireEvent.tap(navItems[0]);
    await nextTick();
    expect(clickNavEvents).toEqual([0]);

    fireEvent.tap(navItems[0]);
    await nextTick();
    expect(clickNavEvents).toEqual([0, 0]);
  });

  // Vant test 4: should emit clickItem event when item is clicked
  it('should emit clickItem event when item is clicked', async () => {
    const activeIdEvents: any[] = [];
    const clickItemEvents: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TreeSelect, {
            items: mockItems,
            mainActiveIndex: 0,
            'onUpdate:activeId': (val: any) => activeIdEvents.push(val),
            onClickItem: (item: any) => clickItemEvents.push(item),
          });
      },
    });

    const { container } = render(Comp);
    const contentItems = findContentItems(container);
    expect(contentItems.length).toBe(1);

    fireEvent.tap(contentItems[0]);
    await nextTick();
    expect(activeIdEvents).toEqual([mockItem.id]);
    expect(clickItemEvents).toEqual([mockItem]);
  });

  // Vant test 5: should not emit clickNav event when disabled nav item is clicked
  it('should not emit clickNav event when disabled nav item is clicked', async () => {
    const clickNavEvents: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TreeSelect, {
            items: [
              { text: 'group1', children: [mockItem], disabled: true },
            ],
            onClickNav: (index: number) => clickNavEvents.push(index),
          });
      },
    });

    const { container } = render(Comp);
    const navItems = findNavItems(container);
    fireEvent.tap(navItems[0]);
    await nextTick();
    expect(clickNavEvents.length).toBe(0);
  });

  // Vant test 6: should not emit clickItem event when disabled item is clicked
  it('should not emit clickItem event when disabled item is clicked', async () => {
    const clickItemEvents: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TreeSelect, {
            items: [
              {
                text: 'group1',
                children: [{ ...mockItem, disabled: true }],
              },
            ],
            mainActiveIndex: 0,
            onClickItem: (item: any) => clickItemEvents.push(item),
          });
      },
    });

    const { container } = render(Comp);
    const contentItems = findContentItems(container);
    fireEvent.tap(contentItems[0]);
    await nextTick();
    expect(clickItemEvents.length).toBe(0);
  });

  // Vant test 7: should render content slot correctly
  it('should render content slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            TreeSelect,
            { items: [{ text: 'group1' }] },
            { content: () => h('text', null, 'Custom Content') },
          );
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Custom Content');
  });

  // Vant test 8: should change height when using height prop
  it('should change height when using height prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { height: '100vh' });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView?.getAttribute('style') || '';
    expect(style).toContain('100vh');
  });

  // Vant test 9: should render nav badge correctly
  it('should render nav badge correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, {
            items: [{ text: 'group1', badge: 3 }],
          });
        },
      }),
    );
    const texts = getTexts(container);
    // Badge text should be rendered
    expect(texts).toContain('3');
    expect(texts).toContain('group1');
  });

  // Vant test 10: should allow to select multiple items when activeId is array
  it('should allow to select multiple items when activeId is array', async () => {
    const activeId = ref<(string | number)[]>([]);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TreeSelect, {
            activeId: activeId.value,
            items: [{ text: 'group1', children: [mockItem, mockItem2] }],
            mainActiveIndex: 0,
            'onUpdate:activeId': (val: any) => {
              activeId.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    const contentItems = findContentItems(container);
    expect(contentItems.length).toBe(2);

    // Select both items
    fireEvent.tap(contentItems[0]);
    await nextTick();
    fireEvent.tap(contentItems[1]);
    await nextTick();
    expect(activeId.value).toEqual([mockItem.id, mockItem2.id]);

    // Deselect both items
    fireEvent.tap(contentItems[0]);
    await nextTick();
    fireEvent.tap(contentItems[1]);
    await nextTick();
    expect(activeId.value).toEqual([]);
  });

  // Vant test 11: should limit the selected item number when using max prop
  it('should limit the selected item number when using max prop', async () => {
    const activeId = ref<(string | number)[]>([]);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(TreeSelect, {
            activeId: activeId.value,
            max: 1,
            items: [{ text: 'group1', children: [mockItem, mockItem2] }],
            mainActiveIndex: 0,
            'onUpdate:activeId': (val: any) => {
              activeId.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    const contentItems = findContentItems(container);

    fireEvent.tap(contentItems[0]);
    await nextTick();
    fireEvent.tap(contentItems[1]);
    await nextTick();
    expect(activeId.value).toEqual([mockItem.id]);
  });

  // Vant test 12: should change selected icon when using selected-icon prop
  it('should change selected icon when using selected-icon prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, {
            items: mockItems,
            activeId: 1,
            mainActiveIndex: 0,
            selectedIcon: '★',
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('★');
  });

  // Vant test 13: should render nav-text slot correctly
  it('should render nav-text slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { items: mockItems }, {
            'nav-text': (item: any) =>
              h('text', null, `Custom nav text, ${item.text}`),
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Custom nav text, group1');
    expect(texts).toContain('Custom nav text, group2');
  });

  // Additional: should render children of active nav item
  it('should render children of active nav item', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, {
            items: [
              {
                text: 'group1',
                children: [
                  { text: 'Child 1', id: 11 },
                  { text: 'Child 2', id: 12 },
                ],
              },
              { text: 'group2', children: [{ text: 'Child 3', id: 21 }] },
            ],
            mainActiveIndex: 0,
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Child 1');
    expect(texts).toContain('Child 2');
  });

  // Additional: should support Numeric height prop
  it('should support Numeric height prop (number)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TreeSelect, { height: 500 });
        },
      }),
    );
    const rootView = container.querySelector('view');
    const style = rootView?.getAttribute('style') || '';
    expect(style).toContain('500px');
  });
});
