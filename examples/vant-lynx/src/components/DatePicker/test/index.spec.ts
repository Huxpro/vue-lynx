import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import DatePicker from '../index.vue';
import type { PickerOption } from '../../Picker/types';

function findTextEl(container: Element, text: string) {
  const textEls = container.querySelectorAll('text');
  return Array.from(textEls).find((t) => t.textContent === text);
}

function findConfirmButton(container: Element) {
  return findTextEl(container, 'Confirm');
}

function findCancelButton(container: Element) {
  return findTextEl(container, 'Cancel');
}

async function tapConfirm(container: Element) {
  const btn = findConfirmButton(container);
  if (btn) {
    fireEvent.tap(btn.parentElement!);
    await nextTick();
  }
}

describe('DatePicker', () => {
  it('should emit confirm event correctly', async () => {
    const minDate = new Date(2030, 0, 1);
    const onConfirm = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(DatePicker, {
            minDate,
            onConfirm,
          });
        },
      }),
    );

    await nextTick();
    await tapConfirm(container);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const params = onConfirm.mock.calls[0][0];
    expect(params.selectedValues).toEqual(['2030', '01', '01']);
    expect(params.selectedOptions).toEqual([
      { text: '2030', value: '2030' },
      { text: '01', value: '01' },
      { text: '01', value: '01' },
    ]);
    expect(params.selectedIndexes).toEqual([0, 0, 0]);
  });

  it('should emit cancel event correctly', async () => {
    const minDate = new Date(2030, 0, 1);
    const onCancel = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(DatePicker, {
            minDate,
            onCancel,
          });
        },
      }),
    );

    await nextTick();
    const cancelBtn = findCancelButton(container);
    expect(cancelBtn).toBeTruthy();
    fireEvent.tap(cancelBtn!.parentElement!);
    await nextTick();

    expect(onCancel).toHaveBeenCalledTimes(1);
    const params = onCancel.mock.calls[0][0];
    expect(params.selectedValues).toEqual(['2030', '01', '01']);
  });

  it('should allow to dynamically set value', async () => {
    const onConfirm = vi.fn();
    const modelValue = ref(['2020', '01', '01']);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(DatePicker, {
            modelValue: modelValue.value,
            minDate: new Date(2019, 0, 1),
            onConfirm,
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();

    modelValue.value = ['2020', '02', '02'];
    await nextTick();
    await tapConfirm(container);

    modelValue.value = ['2020', '03', '03'];
    await nextTick();
    await tapConfirm(container);

    expect(onConfirm.mock.calls[0][0].selectedValues).toEqual([
      '2020',
      '02',
      '02',
    ]);
    expect(onConfirm.mock.calls[1][0].selectedValues).toEqual([
      '2020',
      '03',
      '03',
    ]);
  });

  it('should render with max-date correctly', async () => {
    const maxDate = new Date(2010, 1, 1);
    const minDate = new Date(2000, 1, 1);
    const onConfirm = vi.fn();
    const modelValue = ref(['2020', '10', '10']);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(DatePicker, {
            modelValue: modelValue.value,
            minDate,
            maxDate,
            onConfirm,
            'onUpdate:modelValue': (newVal: string[]) => {
              modelValue.value = newVal;
            },
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();
    await tapConfirm(container);

    // modelValue ['2020', '10', '10'] should be clamped to max year 2010
    // month 10 is valid (Feb 2010 max, but month stays if within range)
    const values = onConfirm.mock.calls[0][0].selectedValues;
    expect(+values[0]).toBeLessThanOrEqual(2010);
  });

  it('should render with min-date correctly', async () => {
    const maxDate = new Date(2010, 1, 1);
    const minDate = new Date(2000, 1, 1);
    const onConfirm = vi.fn();
    const modelValue = ref(['1990', '10', '10']);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(DatePicker, {
            modelValue: modelValue.value,
            minDate,
            maxDate,
            onConfirm,
            'onUpdate:modelValue': (newVal: string[]) => {
              modelValue.value = newVal;
            },
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();
    await tapConfirm(container);

    // modelValue ['1990', '10', '10'] should be clamped to min year 2000
    const values = onConfirm.mock.calls[0][0].selectedValues;
    expect(+values[0]).toBeGreaterThanOrEqual(2000);
  });

  it('should render title slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            DatePicker,
            null,
            {
              title: () => h('text', {}, 'Custom title'),
            },
          );
        },
      }),
    );

    const titleEl = findTextEl(container, 'Custom title');
    expect(titleEl).toBeTruthy();
  });

  it('should filter options when using filter prop', () => {
    const maxDate = new Date(2010, 1, 1);
    const minDate = new Date(2000, 1, 1);

    const filter = (_type: string, options: PickerOption[]) => {
      if (_type === 'year') {
        return options.filter((option) => Number(option.value) % 10 === 0);
      }
      return options;
    };

    const { container } = render(
      defineComponent({
        render() {
          return h(DatePicker, {
            filter,
            maxDate,
            minDate,
            modelValue: ['2005', '01', '01'],
          });
        },
      }),
    );

    // Year column should only have 2000 and 2010
    const textEls = container.querySelectorAll('text');
    const yearTexts = Array.from(textEls)
      .map((t) => t.textContent)
      .filter((t) => t === '2000' || t === '2010' || t === '2005');
    expect(yearTexts).toContain('2000');
    expect(yearTexts).toContain('2010');
    expect(yearTexts).not.toContain('2005');
  });

  it('should format options correctly when using formatter prop', () => {
    const maxDate = new Date(2010, 1, 1);
    const minDate = new Date(2000, 1, 1);

    const formatter = (type: string, option: PickerOption): PickerOption => {
      option.text = `${option.text} ${type}`;
      return option;
    };

    const { container } = render(
      defineComponent({
        render() {
          return h(DatePicker, {
            formatter,
            maxDate,
            minDate,
            modelValue: ['2005', '01', '01'],
          });
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const formattedTexts = Array.from(textEls).map((t) => t.textContent);
    // Year options should be formatted like "2000 year"
    expect(formattedTexts.some((t) => t?.includes('year'))).toBe(true);
    // Month options should be formatted like "01 month"
    expect(formattedTexts.some((t) => t?.includes('month'))).toBe(true);
  });

  it('should render year-month columns type', async () => {
    const onConfirm = vi.fn();
    const minDate = new Date(2020, 0, 1);
    const maxDate = new Date(2025, 11, 31);

    const { container } = render(
      defineComponent({
        render() {
          return h(DatePicker, {
            modelValue: ['2023', '12'],
            columnsType: ['year', 'month'],
            minDate,
            maxDate,
            onConfirm,
          });
        },
      }),
    );

    await nextTick();
    await tapConfirm(container);

    const values = onConfirm.mock.calls[0][0].selectedValues;
    expect(values).toHaveLength(2);
    expect(values[0]).toBe('2023');
    expect(values[1]).toBe('12');
  });

  it('should expose confirm and getSelectedDate methods', async () => {
    const onConfirm = vi.fn();
    let datePickerRef: any;

    const Comp = defineComponent({
      setup() {
        const dpRef = ref(null);
        datePickerRef = dpRef;
        return () =>
          h(DatePicker, {
            ref: dpRef,
            modelValue: ['2023', '06', '15'],
            minDate: new Date(2020, 0, 1),
            onConfirm,
          });
      },
    });

    render(Comp);
    await nextTick();

    expect(datePickerRef.value.getSelectedDate()).toEqual([
      '2023',
      '06',
      '15',
    ]);
  });

  it('should render default columns with year, month, day', () => {
    const minDate = new Date(2023, 0, 1);
    const maxDate = new Date(2023, 11, 31);

    const { container } = render(
      defineComponent({
        render() {
          return h(DatePicker, {
            minDate,
            maxDate,
            modelValue: ['2023', '06', '15'],
          });
        },
      }),
    );

    // Should render the Picker component with van-picker class
    const picker = container.querySelector('.van-picker');
    expect(picker).toBeTruthy();

    // Should have picker columns
    const pickerColumns = container.querySelectorAll('.van-picker-column');
    expect(pickerColumns.length).toBe(3);
  });
});
