import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Collapse from '../index.vue';
import CollapseItem from '../../CollapseItem/index.vue';

async function later() {
  await nextTick();
  await nextTick();
}

/**
 * Find CollapseItem title cells by the BEM class van-collapse-item__title.
 * Cell renders as a view with class="van-cell ...".
 */
function findTitleCells(container: any): any[] {
  const views = Array.from(container.querySelectorAll('view'));
  return views.filter((v: any) => {
    const cls = v.getAttribute('class') || '';
    return cls.includes('van-collapse-item__title');
  });
}

describe('Collapse', () => {
  it('should update active value when title is clicked', async () => {
    const onChange = vi.fn();
    const onUpdate = vi.fn();
    const modelValue = ref([0]);

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
                  { name: 0, title: 'Title 1' },
                  { default: () => 'Content 1' },
                ),
                h(
                  CollapseItem,
                  { name: 1, title: 'Title 2' },
                  { default: () => 'Content 2' },
                ),
                h(
                  CollapseItem,
                  { name: 2, title: 'Title 3' },
                  { default: () => 'Content 3' },
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

    // Click title 2 - should add 1 to active
    await fireEvent.tap(titles[1]);
    await later();
    expect(onUpdate).toHaveBeenCalledWith([0, 1]);
    expect(onChange).toHaveBeenCalledWith([0, 1]);

    // Click title 1 - should remove 0 from active
    await fireEvent.tap(titles[0]);
    await later();
    expect(onUpdate).toHaveBeenCalledWith([1]);
    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it('should update active value when title is clicked in accordion mode', async () => {
    const onUpdate = vi.fn();
    const modelValue = ref(0);

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
                  { name: 0, title: 'Title 1' },
                  { default: () => 'Content 1' },
                ),
                h(
                  CollapseItem,
                  { name: 1, title: 'Title 2' },
                  { default: () => 'Content 2' },
                ),
                h(
                  CollapseItem,
                  { name: 2, title: 'Title 3' },
                  { default: () => 'Content 3' },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    const titles = findTitleCells(container);

    // Click title 2 - should set active to 1
    await fireEvent.tap(titles[1]);
    await later();
    expect(onUpdate).toHaveBeenCalledWith(1);

    // Click title 2 again - should toggle off (empty string)
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
  });

  it('should not render border when border prop is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Collapse,
            { modelValue: [0], border: false },
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

    // The root collapse view should not have hairline class when border is false
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
                  { default: () => h('text', { class: 'lazy-content' }, 'Lazy Content') },
                ),
              ],
            },
          );
        },
      }),
    );

    await later();

    // Content should not be rendered initially (lazy render)
    let allTexts = Array.from(container.querySelectorAll('text')).map(
      (t: any) => t.textContent,
    );
    expect(allTexts).not.toContain('Lazy Content');

    // Expand item
    const titles = findTitleCells(container);
    await fireEvent.tap(titles[0]);
    await later();

    // Content should now be rendered
    allTexts = Array.from(container.querySelectorAll('text')).map(
      (t: any) => t.textContent,
    );
    expect(allTexts).toContain('Lazy Content');
  });

  it('should toggle collapse after calling the toggle method', async () => {
    const modelValue = ref([0]);
    const itemRef = ref<any>(null);

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
                h(CollapseItem, {
                  name: 0,
                  title: 'Title 1',
                  ref: (el: any) => {
                    itemRef.value = el;
                  },
                }, { default: () => 'Content 1' }),
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

    // Toggle item 0 off via exposed method
    itemRef.value?.toggle(false);
    await later();
    expect(modelValue.value).toEqual([]);

    // Toggle item 0 on via exposed method
    itemRef.value?.toggle(true);
    await later();
    expect(modelValue.value).toEqual([0]);

    // Toggle without argument (should toggle to opposite)
    itemRef.value?.toggle();
    await later();
    expect(modelValue.value).toEqual([]);
  });

  it('should toggle collapse after calling the toggle method in accordion mode', async () => {
    const modelValue = ref(0);
    const itemRef = ref<any>(null);

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
              },
            },
            {
              default: () => [
                h(CollapseItem, {
                  name: 0,
                  title: 'Title 1',
                  ref: (el: any) => {
                    itemRef.value = el;
                  },
                }, { default: () => 'Content 1' }),
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

    // Toggle item 0 off
    itemRef.value?.toggle(false);
    await later();
    expect(modelValue.value).toBe('');

    // Toggle item 0 on
    itemRef.value?.toggle(true);
    await later();
    expect(modelValue.value).toBe(0);
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

    // Should not have updated because readonly
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
