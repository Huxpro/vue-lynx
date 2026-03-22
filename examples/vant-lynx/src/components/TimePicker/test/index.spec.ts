import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import TimePicker from '../index.vue';
import type { PickerOption } from '../../Picker/types';

function findTextEl(container: Element, text: string) {
  const textEls = container.querySelectorAll('text');
  return Array.from(textEls).find((t) => t.textContent === text);
}

async function tapConfirm(container: Element) {
  const btn = findTextEl(container, 'Confirm');
  if (btn) {
    fireEvent.tap(btn.parentElement!);
    await nextTick();
  }
}

async function tapCancel(container: Element) {
  const btn = findTextEl(container, 'Cancel');
  if (btn) {
    fireEvent.tap(btn.parentElement!);
    await nextTick();
  }
}

function filter(type: string, options: PickerOption[]): PickerOption[] {
  const mod = type === 'minute' ? 20 : 10;
  return options.filter((option) => Number(option.value) % mod === 0);
}

function timeRangeFilter(
  type: string,
  options: PickerOption[],
  values: string[],
): PickerOption[] {
  const hour = +values[0];

  if (type === 'hour') {
    return options.filter(
      (option) => Number(option.value) >= 8 && Number(option.value) <= 18,
    );
  }

  if (type === 'minute') {
    if (hour === 8) {
      return options.filter((option) => Number(option.value) >= 40);
    }
    if (hour === 18) {
      return options.filter((option) => Number(option.value) <= 20);
    }
  }

  return options;
}

describe('TimePicker', () => {
  it('should format initial value correctly', async () => {
    const onUpdate = vi.fn();
    render(
      defineComponent({
        render() {
          return h(TimePicker, {
            minHour: 22,
            minMinute: 58,
            'onUpdate:modelValue': onUpdate,
          });
        },
      }),
    );
    await nextTick();
    expect(onUpdate).toHaveBeenCalledWith(['22', '58']);
  });

  it('should update modelValue correctly - basic', async () => {
    const onUpdate = vi.fn();
    const modelValue = ref(['-10', '-10']);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: modelValue.value,
            'onUpdate:modelValue': onUpdate,
          });
      },
    });

    render(Comp);
    await nextTick();

    // [-10, -10] should clamp to [00, 00]
    expect(onUpdate.mock.calls[0]).toEqual([['00', '00']]);

    modelValue.value = ['30', '80'];
    await nextTick();
    // [30, 80] should clamp to [23, 59]
    expect(onUpdate.mock.calls[1]).toEqual([['23', '59']]);

    modelValue.value = ['2', '2'];
    await nextTick();
    // ['2', '2'] should be padded to ['02', '02']
    expect(onUpdate.mock.calls[2]).toEqual([['02', '02']]);
  });

  it('should update modelValue when using max-hour and max-minute prop', async () => {
    const onUpdate = vi.fn();
    const modelValue = ref(['23', '59']);
    const maxHour = ref(2);
    const maxMinute = ref(2);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: modelValue.value,
            maxHour: maxHour.value,
            maxMinute: maxMinute.value,
            'onUpdate:modelValue': (val: string[]) => {
              onUpdate(val);
              modelValue.value = val;
            },
          });
      },
    });

    render(Comp);
    await nextTick();
    // [23, 59] with maxHour=2, maxMinute=2 should clamp to [02, 02]
    expect(onUpdate).toHaveBeenCalledWith(['02', '02']);

    onUpdate.mockClear();
    maxHour.value = 12;
    maxMinute.value = 12;
    await nextTick();
    // Value [02, 02] is still valid with maxHour=12
    // No update expected since [02, 02] is within range
  });

  it('should update modelValue when using min-hour and min-minute prop', async () => {
    const onUpdate = vi.fn();
    const modelValue = ref(['00', '00']);
    const minHour = ref(2);
    const minMinute = ref(2);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: modelValue.value,
            minHour: minHour.value,
            minMinute: minMinute.value,
            'onUpdate:modelValue': (val: string[]) => {
              onUpdate(val);
              modelValue.value = val;
            },
          });
      },
    });

    render(Comp);
    await nextTick();
    // [00, 00] with minHour=2, minMinute=2 should clamp to [02, 02]
    expect(onUpdate).toHaveBeenCalledWith(['02', '02']);
  });

  it('should filter options when using filter prop', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, {
            filter,
            modelValue: ['12', '00'],
          });
        },
      }),
    );
    await nextTick();

    // Hour column with mod 10: 00, 10, 20
    // Minute column with mod 20: 00, 20, 40
    const picker = container.querySelector('.van-picker');
    expect(picker).toBeTruthy();

    const pickerColumns = container.querySelectorAll('.van-picker-column');
    expect(pickerColumns.length).toBe(2);
  });

  it('should format options correctly when using formatter prop', async () => {
    const formatter = (type: string, option: PickerOption): PickerOption => {
      option.text = `${option.text} ${type}`;
      return option;
    };

    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, {
            filter,
            formatter,
            modelValue: ['12', '00'],
          });
        },
      }),
    );
    await nextTick();

    const textEls = container.querySelectorAll('text');
    const formattedTexts = Array.from(textEls).map((t) => t.textContent);
    expect(formattedTexts.some((t) => t?.includes('hour'))).toBe(true);
    expect(formattedTexts.some((t) => t?.includes('minute'))).toBe(true);
  });

  it('should emit confirm event after clicking confirm button', async () => {
    const onConfirm = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, {
            modelValue: ['12', '00'],
            onConfirm,
          });
        },
      }),
    );
    await nextTick();
    await tapConfirm(container);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const params = onConfirm.mock.calls[0][0];
    expect(params.selectedValues).toEqual(['12', '00']);
    expect(params.selectedOptions).toEqual([
      { text: '12', value: '12' },
      { text: '00', value: '00' },
    ]);
    expect(params.selectedIndexes).toEqual([12, 0]);
  });

  it('should emit cancel event after clicking cancel button', async () => {
    const onCancel = vi.fn();

    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, {
            onCancel,
          });
        },
      }),
    );
    await nextTick();
    await tapCancel(container);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should emit confirm event correctly after setting values', async () => {
    const onConfirm = vi.fn();
    const modelValue = ref<string[]>([]);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: modelValue.value,
            onConfirm,
            'onUpdate:modelValue': (val: string[]) => {
              modelValue.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();

    modelValue.value = ['00', '00'];
    await nextTick();
    await tapConfirm(container);

    modelValue.value = ['22', '30'];
    await nextTick();
    await tapConfirm(container);

    expect(onConfirm.mock.calls[0][0].selectedValues).toEqual(['00', '00']);
    expect(onConfirm.mock.calls[1][0].selectedValues).toEqual(['22', '30']);
  });

  it('should emit confirm event correctly after setting range', async () => {
    const onUpdate = vi.fn();
    const onConfirm = vi.fn();
    const modelValue = ref(['12', '00']);
    const minHour = ref(0);
    const minMinute = ref(0);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: modelValue.value,
            minHour: minHour.value,
            minMinute: minMinute.value,
            onConfirm,
            'onUpdate:modelValue': (val: string[]) => {
              onUpdate(val);
              modelValue.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();

    minHour.value = 20;
    minMinute.value = 30;
    await nextTick();

    // [12, 00] should be clamped to [20, 30]
    expect(onUpdate).toHaveBeenCalledWith(['20', '30']);

    await tapConfirm(container);
    expect(onConfirm.mock.calls[0][0].selectedValues).toEqual(['20', '30']);
    expect(onConfirm.mock.calls[0][0].selectedIndexes).toEqual([0, 0]);
  });

  it('should emit confirm correctly after setting smaller max-hour and max-minute', async () => {
    const onUpdate = vi.fn();
    const onConfirm = vi.fn();
    const modelValue = ref(['23', '59']);
    const maxHour = ref(23);
    const maxMinute = ref(59);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            modelValue: modelValue.value,
            maxHour: maxHour.value,
            maxMinute: maxMinute.value,
            onConfirm,
            'onUpdate:modelValue': (val: string[]) => {
              onUpdate(val);
              modelValue.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();

    maxHour.value = 2;
    maxMinute.value = 2;
    await nextTick();

    await tapConfirm(container);
    const params = onConfirm.mock.calls[0][0];
    expect(params.selectedValues).toEqual(['00', '00']);
    expect(params.selectedIndexes).toEqual([0, 0]);
  });

  it('should handle minTime prop correctly', async () => {
    const onConfirm = vi.fn();
    const onUpdate = vi.fn();
    const modelValue = ref(['08', '30', '00']);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            minTime: '09:40:10',
            maxTime: '20:20:50',
            modelValue: modelValue.value,
            columnsType: ['hour', 'minute', 'second'],
            onConfirm,
            'onUpdate:modelValue': (val: string[]) => {
              onUpdate(val);
              modelValue.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();

    // [08, 30, 00] should clamp to minTime [09, 40, 10]
    await tapConfirm(container);
    expect(onConfirm.mock.calls[0][0].selectedValues).toEqual(['09', '40', '10']);
    expect(onConfirm.mock.calls[0][0].selectedIndexes).toEqual([0, 0, 0]);
  });

  it('should handle maxTime prop correctly', async () => {
    const onConfirm = vi.fn();
    const onUpdate = vi.fn();
    const modelValue = ref(['23', '30', '55']);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(TimePicker, {
            minTime: '09:40:10',
            maxTime: '20:20:50',
            modelValue: modelValue.value,
            columnsType: ['hour', 'minute', 'second'],
            onConfirm,
            'onUpdate:modelValue': (val: string[]) => {
              onUpdate(val);
              modelValue.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);
    await nextTick();

    // [23, 30, 55] should clamp to maxTime [20, 20, 50]
    await tapConfirm(container);
    expect(onConfirm.mock.calls[0][0].selectedValues).toEqual(['20', '20', '50']);
    expect(onConfirm.mock.calls[0][0].selectedIndexes).toEqual([11, 20, 50]);
  });

  it('should render with Picker component and BEM classes', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, {
            modelValue: ['12', '30'],
          });
        },
      }),
    );
    await nextTick();

    const picker = container.querySelector('.van-picker');
    expect(picker).toBeTruthy();

    const pickerColumns = container.querySelectorAll('.van-picker-column');
    expect(pickerColumns.length).toBe(2);
  });

  it('should render with second column type', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(TimePicker, {
            modelValue: ['12', '30', '45'],
            columnsType: ['hour', 'minute', 'second'],
          });
        },
      }),
    );
    await nextTick();

    const pickerColumns = container.querySelectorAll('.van-picker-column');
    expect(pickerColumns.length).toBe(3);
  });

  it('should expose confirm and getSelectedTime methods', async () => {
    const onConfirm = vi.fn();
    let timePickerRef: any;

    const Comp = defineComponent({
      setup() {
        const tpRef = ref(null);
        timePickerRef = tpRef;
        return () =>
          h(TimePicker, {
            ref: tpRef,
            modelValue: ['14', '30'],
            onConfirm,
          });
      },
    });

    render(Comp);
    await nextTick();

    expect(timePickerRef.value.getSelectedTime()).toEqual(['14', '30']);
  });
});
