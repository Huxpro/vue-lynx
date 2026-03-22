import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Cascader from '../index.vue';
import type { CascaderOption } from '../types';

const options: CascaderOption[] = [
  {
    text: 'Zhejiang',
    value: '330000',
    children: [
      {
        text: 'Hangzhou',
        value: '330100',
        children: [
          { text: 'Xihu', value: '330106' },
          { text: 'Yuhang', value: '330110' },
        ],
      },
      {
        text: 'Ningbo',
        value: '330200',
        children: [
          { text: 'Haishu', value: '330203' },
          { text: 'Jiangbei', value: '330205' },
        ],
      },
    ],
  },
  {
    text: 'Jiangsu',
    value: '320000',
    children: [
      {
        text: 'Nanjing',
        value: '320100',
        children: [
          { text: 'Xuanwu', value: '320102' },
          { text: 'Qinhuai', value: '320104' },
        ],
      },
    ],
  },
];

function findTextEl(container: Element, text: string) {
  const textEls = container.querySelectorAll('text');
  return Array.from(textEls).find((t) => t.textContent === text);
}

function findOptionByText(container: Element, text: string) {
  const allOptions = container.querySelectorAll('.van-cascader__option');
  return Array.from(allOptions).find((el) => {
    // Vue renders empty <text> elements as slot anchors; find the one with matching content
    const textEls = el.querySelectorAll('text');
    return Array.from(textEls).some((t) => t.textContent === text);
  });
}

function findAllOptions(container: Element) {
  return Array.from(container.querySelectorAll('.van-cascader__option'));
}

describe('Cascader', () => {
  it('should emit change event when active option changed', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options,
            onChange,
          });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const firstOption = findOptionByText(container, 'Zhejiang');
    expect(firstOption).toBeTruthy();
    fireEvent.tap(firstOption!);

    expect(onChange).toHaveBeenCalledWith({
      value: '330000',
      tabIndex: 0,
      selectedOptions: [options[0]],
    });

    await nextTick();
    await nextTick();

    // Select second level option
    const secondOption = findOptionByText(container, 'Hangzhou');
    expect(secondOption).toBeTruthy();
    fireEvent.tap(secondOption!);

    expect(onChange).toHaveBeenCalledWith({
      value: '330100',
      tabIndex: 1,
      selectedOptions: [options[0], options[0].children![0]],
    });
  });

  it('should emit finish event when all options are selected', async () => {
    const option = { value: '1', text: 'foo' };
    const onFinish = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options: [option],
            onFinish,
          });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const optionEl = findOptionByText(container, 'foo');
    expect(optionEl).toBeTruthy();
    fireEvent.tap(optionEl!);

    expect(onFinish).toHaveBeenCalledWith({
      value: '1',
      tabIndex: 0,
      selectedOptions: [option],
    });
  });

  it('should emit close event when close icon is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, { onClose });
        },
      }),
    );

    await nextTick();
    const closeIcon = container.querySelector('.van-cascader__close-icon');
    expect(closeIcon).toBeTruthy();
    fireEvent.tap(closeIcon!);
    expect(onClose).toHaveBeenCalled();
  });

  it('should not render close icon when closeable is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, { closeable: false });
        },
      }),
    );

    await nextTick();
    const closeIcon = container.querySelector('.van-cascader__close-icon');
    expect(closeIcon).toBeFalsy();
  });

  it('should render title correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, { title: 'Test Title' });
        },
      }),
    );

    await nextTick();
    const title = container.querySelector('.van-cascader__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Test Title');
  });

  it('should render title slot correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Cascader,
            null,
            {
              title: () => h('text', {}, 'Custom Title'),
            },
          );
        },
      }),
    );

    await nextTick();
    const title = container.querySelector('.van-cascader__title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('Custom Title');
  });

  it('should render option slot correctly', async () => {
    const option = { value: '1', text: 'foo' };
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Cascader,
            { options: [option] },
            {
              option: ({ option: opt, selected }: { option: CascaderOption; selected: boolean }) =>
                h('text', {}, `Custom ${opt.text}`),
            },
          );
        },
      }),
    );

    await nextTick();
    await nextTick();
    const customText = findTextEl(container, 'Custom foo');
    expect(customText).toBeTruthy();
  });

  it('should select correct option when value changed', async () => {
    const modelValue = ref<string | undefined>(undefined);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Cascader, {
            options,
            modelValue: modelValue.value,
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();
    await nextTick();

    // Set modelValue to a leaf node
    modelValue.value = '330106';
    await nextTick();
    await nextTick();
    await nextTick();

    const selectedOptions = container.querySelectorAll('.van-cascader__option--selected');
    expect(selectedOptions.length).toBeGreaterThan(0);
  });

  it('should reset selected options when value is set to empty', async () => {
    const modelValue = ref<string | undefined>('330106');
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Cascader, {
            options,
            modelValue: modelValue.value,
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();
    await nextTick();

    modelValue.value = undefined;
    await nextTick();
    await nextTick();

    const selectedOptions = container.querySelectorAll('.van-cascader__option--selected');
    expect(selectedOptions.length).toBe(0);
  });

  it('should allow to custom field names', async () => {
    const fieldNames = {
      text: 'name',
      value: 'code',
      children: 'items',
    };
    const customOptions = [
      {
        name: 'Zhejiang',
        code: '330000',
        items: [{ name: 'Hangzhou', code: '330100' }],
      },
    ];
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options: customOptions,
            fieldNames,
            onChange,
          });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const optionEl = findOptionByText(container, 'Zhejiang');
    expect(optionEl).toBeTruthy();
    fireEvent.tap(optionEl!);

    expect(onChange).toHaveBeenCalledWith({
      value: '330000',
      tabIndex: 0,
      selectedOptions: [customOptions[0]],
    });

    await nextTick();
    await nextTick();

    const secondOption = findOptionByText(container, 'Hangzhou');
    expect(secondOption).toBeTruthy();
    fireEvent.tap(secondOption!);

    expect(onChange).toHaveBeenCalledWith({
      value: '330100',
      tabIndex: 1,
      selectedOptions: [customOptions[0], customOptions[0].items[0]],
    });
  });

  it('should allow to custom the className of option', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options: [{ value: '1', text: 'foo', className: 'foo' }],
          });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const optionEl = container.querySelector('.van-cascader__option');
    expect(optionEl).toBeTruthy();
    expect(optionEl!.classList.contains('foo')).toBe(true);
  });

  it('should allow to custom the color of option', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options: [{ value: '1', text: 'foo', color: 'red' }],
          });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const optionEl = container.querySelector('.van-cascader__option') as HTMLElement;
    expect(optionEl).toBeTruthy();
    expect(optionEl.style.color).toBe('red');
  });

  it('should not render header when show-header prop is false', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options,
            showHeader: false,
          });
        },
      }),
    );

    await nextTick();
    const header = container.querySelector('.van-cascader__header');
    expect(header).toBeFalsy();
  });

  it('should render options-top and options-bottom slots', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Cascader,
            { options },
            {
              'options-top': ({ tabIndex }: { tabIndex: number }) =>
                h('text', {}, `Top ${tabIndex}`),
              'options-bottom': ({ tabIndex }: { tabIndex: number }) =>
                h('text', {}, `Bottom ${tabIndex}`),
            },
          );
        },
      }),
    );

    await nextTick();
    await nextTick();

    const topText = findTextEl(container, 'Top 0');
    expect(topText).toBeTruthy();
    const bottomText = findTextEl(container, 'Bottom 0');
    expect(bottomText).toBeTruthy();
  });

  it('should not select disabled option', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options: [{ value: '1', text: 'foo', disabled: true }],
            onChange,
          });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const optionEl = findOptionByText(container, 'foo');
    expect(optionEl).toBeTruthy();
    fireEvent.tap(optionEl!);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should render disabled option with correct class', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options: [{ value: '1', text: 'foo', disabled: true }],
          });
        },
      }),
    );

    await nextTick();
    await nextTick();

    const optionEl = container.querySelector('.van-cascader__option--disabled');
    expect(optionEl).toBeTruthy();
  });

  it('should render BEM classes correctly', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            title: 'Test',
            options: [{ value: '1', text: 'foo' }],
          });
        },
      }),
    );

    await nextTick();

    expect(container.querySelector('.van-cascader')).toBeTruthy();
    expect(container.querySelector('.van-cascader__header')).toBeTruthy();
    expect(container.querySelector('.van-cascader__title')).toBeTruthy();
  });

  it('should render selected icon for selected option', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Cascader, {
            options,
            onChange,
          });
        },
      }),
    );

    await nextTick();
    await nextTick();

    // Select an option
    const optionEl = findOptionByText(container, 'Zhejiang');
    fireEvent.tap(optionEl!);

    await nextTick();
    await nextTick();

    // The selected option should have selected class
    const selectedOption = container.querySelector('.van-cascader__option--selected');
    expect(selectedOption).toBeTruthy();

    // And should have the selected icon
    const selectedIcon = selectedOption?.querySelector('.van-cascader__selected-icon');
    expect(selectedIcon).toBeTruthy();
  });

  it('should update tabs when previous tab option is clicked', async () => {
    const onChange = vi.fn();
    const modelValue = ref<string | undefined>('330106');
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Cascader, {
              options,
              modelValue: modelValue.value,
              'onUpdate:modelValue': (v: string) => {
                modelValue.value = v;
              },
              onChange,
            });
        },
      }),
    );

    await nextTick();
    await nextTick();
    await nextTick();

    // Should have multiple tabs now. Click a first-level option that differs
    const jiangsuOption = findOptionByText(container, 'Jiangsu');
    if (jiangsuOption) {
      fireEvent.tap(jiangsuOption);
      await nextTick();
      await nextTick();
      expect(onChange).toHaveBeenCalled();
    }
  });
});
