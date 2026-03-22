import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Collapse from '../../Collapse/index.vue';
import CollapseItem from '../index.vue';

async function later() {
  await nextTick();
  await nextTick();
}

function findTitleCells(container: any): any[] {
  const views = Array.from(container.querySelectorAll('view'));
  return views.filter((v: any) => {
    const cls = v.getAttribute('class') || '';
    return cls.includes('van-collapse-item__title');
  });
}

describe('CollapseItem', () => {
  it('should update active value when title is clicked', async () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    const modelValue = ref<(string | number)[]>(['first']);

    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            {
              modelValue: modelValue.value,
              'onUpdate:modelValue': (val: any) => {
                modelValue.value = val;
                onUpdate(val);
              },
              onChange,
            },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 'first', title: 'a' },
                  { default: () => 'content' },
                ),
                h(
                  CollapseItem,
                  { title: 'b' },
                  { default: () => 'content' },
                ),
                h(
                  CollapseItem,
                  { title: 'c' },
                  { default: () => 'content' },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();
    const titles = findTitleCells(container);
    expect(titles.length).toBe(3);

    // Click first title - should remove 'first'
    await fireEvent.tap(titles[0]);
    await later();
    expect(onUpdate).toHaveBeenCalledWith([]);

    // Click second title - should add auto-generated index
    await fireEvent.tap(titles[1]);
    await later();
    expect(onChange).toHaveBeenCalled();
  });

  it('should update active value when title is clicked in accordion mode', async () => {
    const onUpdate = vi.fn();
    const modelValue = ref<string | number>('first');

    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            {
              modelValue: modelValue.value,
              accordion: true,
              'onUpdate:modelValue': (val: any) => {
                modelValue.value = val;
                onUpdate(val);
              },
            },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 'first', title: 'a' },
                  { default: () => 'content' },
                ),
                h(
                  CollapseItem,
                  { name: 'second', title: 'b' },
                  { default: () => 'content' },
                ),
                h(
                  CollapseItem,
                  { name: 'third', title: 'c' },
                  { default: () => 'content' },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();
    const titles = findTitleCells(container);

    // Click second item
    await fireEvent.tap(titles[1]);
    await later();
    expect(onUpdate).toHaveBeenCalledWith('second');

    // Click second item again — should toggle off
    await fireEvent.tap(titles[1]);
    await later();
    expect(onUpdate).toHaveBeenCalledWith('');
  });

  it('should render slots of CollapseItem correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            { modelValue: [0] },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 0 },
                  {
                    title: () => 'Custom Title',
                    value: () => 'Custom Value',
                    label: () => 'Custom Label',
                    icon: () => h('text', null, 'icon-slot'),
                    'right-icon': () => h('text', null, 'right-icon-slot'),
                    default: () => 'Custom Content',
                  },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    const allTexts = Array.from(container.querySelectorAll('text')).map(
      (t: any) => t.textContent,
    );

    expect(allTexts).toContain('Custom Title');
    expect(allTexts).toContain('Custom Content');
    expect(allTexts).toContain('icon-slot');
    expect(allTexts).toContain('right-icon-slot');
  });

  it('should not render border when border prop is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            { modelValue: [], border: false },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 0, title: 'Title 1' },
                  { default: () => 'Content 1' },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    const rootView = container.querySelector('.van-collapse');
    const cls = rootView?.getAttribute('class') || '';
    expect(cls).not.toContain('van-hairline--top-bottom');
  });

  it('should lazy render collapse content', async () => {
    const modelValue = ref<number[]>([]);

    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            {
              modelValue: modelValue.value,
              'onUpdate:modelValue': (val: any) => {
                modelValue.value = val;
              },
            },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 0, title: 'Title 1' },
                  {
                    default: () =>
                      h('text', { class: 'lazy-content' }, 'Lazy Content'),
                  },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    // Content should not be rendered initially (lazy render)
    expect(container.querySelector('.lazy-content')).toBeNull();

    // Expand item
    const titles = findTitleCells(container);
    await fireEvent.tap(titles[0]);
    await later();

    // Content should now be rendered
    const allTexts = Array.from(container.querySelectorAll('text')).map(
      (t: any) => t.textContent,
    );
    expect(allTexts).toContain('Lazy Content');
  });

  it('should toggle collapse after calling the toggle method', async () => {
    const modelValue = ref<(string | number)[]>([]);
    const itemARef = ref<any>(null);
    const itemBRef = ref<any>(null);

    render(
      defineComponent({
        render() {
          return h(
            Collapse,
            {
              modelValue: modelValue.value,
              'onUpdate:modelValue': (val: any) => {
                modelValue.value = val;
              },
            },
            {
              default: () => [
                h(CollapseItem, {
                  name: 'a',
                  ref: (el: any) => {
                    itemARef.value = el;
                  },
                }),
                h(CollapseItem, {
                  name: 'b',
                  ref: (el: any) => {
                    itemBRef.value = el;
                  },
                }),
              ],
            },
          );
        },
      }),
    );

    await later();

    itemARef.value?.toggle();
    await later();
    expect(modelValue.value).toEqual(['a']);

    itemBRef.value?.toggle();
    await later();
    expect(modelValue.value).toEqual(['a', 'b']);

    itemBRef.value?.toggle(false);
    await later();
    expect(modelValue.value).toEqual(['a']);

    itemARef.value?.toggle();
    await later();
    expect(modelValue.value).toEqual([]);
  });

  it('should toggle collapse after calling the toggle method in accordion mode', async () => {
    const modelValue = ref<string | number>('');
    const itemARef = ref<any>(null);
    const itemBRef = ref<any>(null);

    render(
      defineComponent({
        render() {
          return h(
            Collapse,
            {
              modelValue: modelValue.value,
              accordion: true,
              'onUpdate:modelValue': (val: any) => {
                modelValue.value = val;
              },
            },
            {
              default: () => [
                h(CollapseItem, {
                  name: 'a',
                  ref: (el: any) => {
                    itemARef.value = el;
                  },
                }),
                h(CollapseItem, {
                  name: 'b',
                  ref: (el: any) => {
                    itemBRef.value = el;
                  },
                }),
              ],
            },
          );
        },
      }),
    );

    await later();

    itemARef.value?.toggle();
    await later();
    expect(modelValue.value).toEqual('a');

    itemBRef.value?.toggle();
    await later();
    expect(modelValue.value).toEqual('b');

    itemBRef.value?.toggle(false);
    await later();
    expect(modelValue.value).toEqual('');

    itemARef.value?.toggle();
    await later();
    expect(modelValue.value).toEqual('a');
  });

  it('should be readonly when using readonly prop', async () => {
    const onUpdate = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            {
              modelValue: [],
              'onUpdate:modelValue': onUpdate,
            },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 0, title: 'Title 1', readonly: true },
                  { default: () => 'Content 1' },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    const titles = findTitleCells(container);
    await fireEvent.tap(titles[0]);
    await later();

    expect(onUpdate).not.toHaveBeenCalled();

    // readonly should remove isLink (clickable class)
    const titleCls = titles[0].getAttribute('class') || '';
    expect(titleCls).not.toContain('van-cell--clickable');
  });

  it('should not toggle when disabled', async () => {
    const onUpdate = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            {
              modelValue: [],
              'onUpdate:modelValue': onUpdate,
            },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 0, title: 'Title 1', disabled: true },
                  { default: () => 'Content 1' },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    const titles = findTitleCells(container);
    await fireEvent.tap(titles[0]);
    await later();

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should apply disabled title class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            { modelValue: [] },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 0, title: 'Title 1', disabled: true },
                  { default: () => 'Content 1' },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    const titles = findTitleCells(container);
    const titleCls = titles[0].getAttribute('class') || '';
    expect(titleCls).toContain('van-collapse-item__title--disabled');
  });

  it('should apply expanded title class when expanded', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            { modelValue: [0] },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 0, title: 'Title 1' },
                  { default: () => 'Content 1' },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    const titles = findTitleCells(container);
    const titleCls = titles[0].getAttribute('class') || '';
    expect(titleCls).toContain('van-collapse-item__title--expanded');
  });

  it('should apply borderless modifier when border is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            { modelValue: [] },
            {
              default: () => [
                h(
                  CollapseItem,
                  { name: 0, title: 'Title 1', border: false },
                  { default: () => 'Content 1' },
                ),
                h(
                  CollapseItem,
                  { name: 1, title: 'Title 2' },
                  { default: () => 'Content 2' },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    const items = Array.from(container.querySelectorAll('view')).filter(
      (v: any) => {
        const cls = v.getAttribute('class') || '';
        return (
          cls.includes('van-collapse-item') &&
          !cls.includes('__') &&
          !cls.includes('van-collapse ')
        );
      },
    );

    // First item with border=false should have borderless modifier
    expect(items[0]?.getAttribute('class')).toContain(
      'van-collapse-item--borderless',
    );

    // Second item with default border=true should NOT have borderless modifier
    expect(items[1]?.getAttribute('class')).not.toContain(
      'van-collapse-item--borderless',
    );
  });

  it('should expose expanded state', async () => {
    const modelValue = ref(['a']);
    const itemRef = ref<any>(null);

    render(
      defineComponent({
        render() {
          return h(
            Collapse,
            {
              modelValue: modelValue.value,
              'onUpdate:modelValue': (val: any) => {
                modelValue.value = val;
              },
            },
            {
              default: () => [
                h(CollapseItem, {
                  name: 'a',
                  ref: (el: any) => {
                    itemRef.value = el;
                  },
                }),
              ],
            },
          );
        },
      }),
    );

    await later();

    expect(itemRef.value?.expanded).toBe(true);

    itemRef.value?.toggle(false);
    await later();
    expect(itemRef.value?.expanded).toBe(false);
  });
});
