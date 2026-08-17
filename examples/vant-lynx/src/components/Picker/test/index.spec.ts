import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Picker from '../index.vue';
import type { PickerOption } from '../types';

const columns = [
  { text: 'A', value: 'A' },
  { text: 'B', value: 'B' },
  { text: 'C', value: 'C' },
];

const multiColumns = [
  [
    { text: '2021', value: '2021' },
    { text: '2022', value: '2022' },
    { text: '2023', value: '2023' },
  ],
  [
    { text: 'Jan', value: 'Jan' },
    { text: 'Feb', value: 'Feb' },
    { text: 'Mar', value: 'Mar' },
  ],
];

const cascadeColumns = [
  {
    text: 'Zhejiang',
    value: 'Zhejiang',
    children: [
      { text: 'Hangzhou', value: 'Hangzhou' },
      { text: 'Ningbo', value: 'Ningbo' },
    ],
  },
  {
    text: 'Fujian',
    value: 'Fujian',
    children: [
      { text: 'Fuzhou', value: 'Fuzhou' },
      { text: 'Xiamen', value: 'Xiamen' },
    ],
  },
];

function findTextEl(container: Element, text: string) {
  const textEls = container.querySelectorAll('text');
  return Array.from(textEls).find((t) => t.textContent === text);
}

describe('Picker', () => {
  it('should emit confirm event after clicking the confirm button', async () => {
    const onConfirm = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            onConfirm,
          });
        },
      }),
    );

    const confirmBtn = findTextEl(container, 'Confirm');
    expect(confirmBtn).toBeTruthy();
    fireEvent.tap(confirmBtn!.parentElement!);
    await nextTick();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0].selectedValues).toEqual(['A']);
  });

  it('should emit cancel event after clicking the cancel button', async () => {
    const onCancel = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            onCancel,
          });
        },
      }),
    );

    const cancelBtn = findTextEl(container, 'Cancel');
    expect(cancelBtn).toBeTruthy();
    fireEvent.tap(cancelBtn!.parentElement!);
    await nextTick();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should emit change event after clicking an option', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            onChange,
          });
        },
      }),
    );

    const optionB = findTextEl(container, 'B');
    expect(optionB).toBeTruthy();
    fireEvent.tap(optionB!.parentElement!);
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].selectedValues).toEqual(['B']);
    expect(onChange.mock.calls[0][0].columnIndex).toBe(0);
  });

  it('should not emit change event if modelValue is not changed', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            modelValue: ['A'],
            onChange,
          });
        },
      }),
    );

    // Click the already-selected option A
    const optionA = findTextEl(container, 'A');
    expect(optionA).toBeTruthy();
    fireEvent.tap(optionA!.parentElement!);
    await nextTick();
    // Should not fire change since value didn't change
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('should not emit change event when clicking a disabled option', async () => {
    const onChange = vi.fn();
    const disabledColumns = [
      { text: 'A', value: 'A' },
      { text: 'B', value: 'B', disabled: true },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [disabledColumns],
            onChange,
          });
        },
      }),
    );

    const optionB = findTextEl(container, 'B');
    expect(optionB).toBeTruthy();
    fireEvent.tap(optionB!.parentElement!);
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('should emit click-option event after clicking an option', async () => {
    const onClickOption = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            'onClick-option': onClickOption,
          });
        },
      }),
    );

    const optionB = findTextEl(container, 'B');
    expect(optionB).toBeTruthy();
    fireEvent.tap(optionB!.parentElement!);
    await nextTick();
    expect(onClickOption).toHaveBeenCalledTimes(1);
    expect(onClickOption.mock.calls[0][0].currentOption.text).toBe('B');
    expect(onClickOption.mock.calls[0][0].columnIndex).toBe(0);
  });

  it('should render bottom toolbar when toolbar-position is bottom', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            title: 'Title',
            toolbarPosition: 'bottom',
          });
        },
      }),
    );

    const title = findTextEl(container, 'Title');
    expect(title).toBeTruthy();
    // Toolbar should appear after columns when position is bottom
    const confirmBtn = findTextEl(container, 'Confirm');
    expect(confirmBtn).toBeTruthy();
  });

  it('should not allow to change option when using readonly prop', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            readonly: true,
            onChange,
          });
        },
      }),
    );

    const optionB = findTextEl(container, 'B');
    expect(optionB).toBeTruthy();
    fireEvent.tap(optionB!.parentElement!);
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('should render title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            title: 'Select',
          });
        },
      }),
    );

    const title = findTextEl(container, 'Select');
    expect(title).toBeTruthy();
  });

  it('should render custom button text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            confirmButtonText: 'OK',
            cancelButtonText: 'Close',
          });
        },
      }),
    );

    expect(findTextEl(container, 'OK')).toBeTruthy();
    expect(findTextEl(container, 'Close')).toBeTruthy();
  });

  it('should render multiple columns', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: multiColumns,
          });
        },
      }),
    );

    expect(findTextEl(container, '2021')).toBeTruthy();
    expect(findTextEl(container, 'Jan')).toBeTruthy();
  });

  it('should render cascade columns', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: cascadeColumns,
          });
        },
      }),
    );

    // First column should show province options
    expect(findTextEl(container, 'Zhejiang')).toBeTruthy();
    expect(findTextEl(container, 'Fujian')).toBeTruthy();
    // Second column should show cities of the first province
    expect(findTextEl(container, 'Hangzhou')).toBeTruthy();
  });

  it('should support cascade columns change', async () => {
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: cascadeColumns,
            onChange,
          });
        },
      }),
    );

    // Click 'Fujian' to change the first column
    const fujianEl = findTextEl(container, 'Fujian');
    expect(fujianEl).toBeTruthy();
    fireEvent.tap(fujianEl!.parentElement!);
    await nextTick();
    expect(onChange).toHaveBeenCalled();
  });

  it('should support v-model', async () => {
    const modelValue = ref<(string | number)[]>(['B']);
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Picker, {
              columns: [columns],
              modelValue: modelValue.value,
              'onUpdate:modelValue': (val: (string | number)[]) => {
                modelValue.value = val;
              },
            });
        },
      }),
    );

    // Click option C
    const optionC = findTextEl(container, 'C');
    expect(optionC).toBeTruthy();
    fireEvent.tap(optionC!.parentElement!);
    await nextTick();
    expect(modelValue.value).toEqual(['C']);
  });

  it('should not emit confirm when loading', async () => {
    const onConfirm = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            loading: true,
            onConfirm,
          });
        },
      }),
    );

    const confirmBtn = findTextEl(container, 'Confirm');
    expect(confirmBtn).toBeTruthy();
    fireEvent.tap(confirmBtn!.parentElement!);
    await nextTick();
    expect(onConfirm).toHaveBeenCalledTimes(0);
  });

  it('should render loading state', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            loading: true,
          });
        },
      }),
    );

    // Loading overlay should be rendered
    const loadingEls = container.querySelectorAll('.van-picker__loading');
    expect(loadingEls.length).toBe(1);
  });

  it('should hide toolbar when showToolbar is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [columns],
            showToolbar: false,
            title: 'Title',
          });
        },
      }),
    );

    const title = findTextEl(container, 'Title');
    expect(title).toBeFalsy();
  });

  it('should support columnsFieldNames', () => {
    const customColumns = [
      [
        { cityName: 'Beijing', id: 1 },
        { cityName: 'Shanghai', id: 2 },
      ],
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: customColumns,
            columnsFieldNames: { text: 'cityName', value: 'id' },
          });
        },
      }),
    );

    expect(findTextEl(container, 'Beijing')).toBeTruthy();
    expect(findTextEl(container, 'Shanghai')).toBeTruthy();
  });

  it('should allow to update columns props dynamically', async () => {
    const cols = ref([columns]);
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Picker, {
              columns: cols.value,
            });
        },
      }),
    );

    expect(findTextEl(container, 'A')).toBeTruthy();

    // Update columns
    cols.value = [
      [
        { text: 'X', value: 'X' },
        { text: 'Y', value: 'Y' },
      ],
    ];
    await nextTick();
    expect(findTextEl(container, 'X')).toBeTruthy();
    expect(findTextEl(container, 'Y')).toBeTruthy();
  });

  it('should render disabled options', () => {
    const disabledColumns = [
      { text: 'A', value: 'A' },
      { text: 'B', value: 'B', disabled: true },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [disabledColumns],
          });
        },
      }),
    );

    const disabledEls = container.querySelectorAll(
      '.van-picker-column__item--disabled',
    );
    expect(disabledEls.length).toBe(1);
  });

  it('should not render mask and frame when options is empty', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Picker, {
            columns: [[]],
          });
        },
      }),
    );

    const masks = container.querySelectorAll('.van-picker__mask');
    const frames = container.querySelectorAll('.van-picker__frame');
    expect(masks.length).toBe(0);
    expect(frames.length).toBe(0);
  });

  it('should expose confirm method', async () => {
    const onConfirm = vi.fn();
    const pickerRef = ref<any>(null);
    render(
      defineComponent({
        setup() {
          return () =>
            h(Picker, {
              ref: pickerRef,
              columns: [columns],
              onConfirm,
            });
        },
      }),
    );

    await nextTick();
    pickerRef.value?.confirm();
    await nextTick();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should expose getSelectedOptions method', async () => {
    const pickerRef = ref<any>(null);
    render(
      defineComponent({
        setup() {
          return () =>
            h(Picker, {
              ref: pickerRef,
              columns: [columns],
              modelValue: ['B'],
            });
        },
      }),
    );

    await nextTick();
    const selected = pickerRef.value?.getSelectedOptions();
    expect(selected).toBeTruthy();
    expect(selected[0]?.text).toBe('B');
  });

  it('should emit default values when clear modelValue', async () => {
    const modelValue = ref<(string | number)[]>(['B']);
    const onChange = vi.fn();
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Picker, {
              columns: [columns],
              modelValue: modelValue.value,
              'onUpdate:modelValue': (val: (string | number)[]) => {
                modelValue.value = val;
              },
              onChange,
            });
        },
      }),
    );

    // Clear modelValue
    modelValue.value = [];
    await nextTick();
    await nextTick();
    // Should auto-select first enabled option
    expect(modelValue.value).toEqual(['A']);
  });

  it('should render columns-top and columns-bottom slots', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Picker,
            { columns: [columns] },
            {
              'columns-top': () => h('text', {}, 'Top Content'),
              'columns-bottom': () => h('text', {}, 'Bottom Content'),
            },
          );
        },
      }),
    );

    expect(findTextEl(container, 'Top Content')).toBeTruthy();
    expect(findTextEl(container, 'Bottom Content')).toBeTruthy();
  });

  it('should render option slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Picker,
            { columns: [columns] },
            {
              option: ({ option }: { option: PickerOption }) =>
                h('text', {}, `Custom: ${option.text}`),
            },
          );
        },
      }),
    );

    expect(findTextEl(container, 'Custom: A')).toBeTruthy();
    expect(findTextEl(container, 'Custom: B')).toBeTruthy();
  });
});
