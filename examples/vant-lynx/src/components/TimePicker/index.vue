<!--
  Lynx Limitations:
  - tag prop: Lynx has no HTML tags, always renders <view>
  - scroll-wheel physics: tap-to-select via Picker component (no native wheel)
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import { padZero, clamp } from '../../utils/format';
import Picker from '../Picker/index.vue';
import type { PickerOption, PickerColumn as PickerColumnType } from '../Picker/types';
import type { Numeric } from '../../utils/format';
import type {
  TimePickerColumnType,
  TimePickerFilter,
  TimePickerFormatter,
  TimePickerExpose,
} from './types';
import { genOptions } from '../DatePicker/utils';
import './index.less';

const fullColumns: TimePickerColumnType[] = ['hour', 'minute', 'second'];

const props = withDefaults(
  defineProps<{
    modelValue?: string[];
    columnsType?: TimePickerColumnType[];
    minHour?: Numeric;
    maxHour?: Numeric;
    minMinute?: Numeric;
    maxMinute?: Numeric;
    minSecond?: Numeric;
    maxSecond?: Numeric;
    minTime?: string;
    maxTime?: string;
    filter?: TimePickerFilter;
    formatter?: TimePickerFormatter;
    title?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    loading?: boolean;
    readonly?: boolean;
    showToolbar?: boolean;
    visibleOptionNum?: Numeric;
    optionHeight?: Numeric;
    swipeDuration?: Numeric;
  }>(),
  {
    modelValue: () => [],
    columnsType: () => ['hour', 'minute'] as TimePickerColumnType[],
    minHour: 0,
    maxHour: 23,
    minMinute: 0,
    maxMinute: 59,
    minSecond: 0,
    maxSecond: 59,
    formatter: ((_type: string, option: PickerOption) => option) as TimePickerFormatter,
    loading: false,
    readonly: false,
    showToolbar: true,
    visibleOptionNum: 6,
    optionHeight: 44,
    swipeDuration: 1000,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
  confirm: [params: {
    selectedValues: string[];
    selectedOptions: (PickerOption | undefined)[];
    selectedIndexes: number[];
  }];
  cancel: [params: {
    selectedValues: string[];
    selectedOptions: (PickerOption | undefined)[];
    selectedIndexes: number[];
  }];
  change: [params: {
    columnIndex: number;
    selectedValues: string[];
    selectedOptions: (PickerOption | undefined)[];
    selectedIndexes: number[];
  }];
}>();

const pickerRef = ref<InstanceType<typeof Picker>>();

const selectedValues = ref<string[]>([]);

function getValidTime(time: string): string[] {
  const parts = time.split(':');
  return fullColumns.map((col, i) =>
    props.columnsType.includes(col) ? (parts[i] ?? '00') : '00',
  );
}

function buildColumns(currentValues: string[]): PickerColumnType[] {
  let { minHour, maxHour, minMinute, maxMinute, minSecond, maxSecond } = props;

  if (props.minTime || props.maxTime) {
    const fullTime: Record<TimePickerColumnType, string | number> = {
      hour: 0,
      minute: 0,
      second: 0,
    };
    props.columnsType.forEach((col, i) => {
      fullTime[col] = currentValues[i] ?? 0;
    });
    const { hour, minute } = fullTime;

    if (props.minTime) {
      const [minH, minM, minS] = getValidTime(props.minTime);
      minHour = minH;
      minMinute = +hour <= +minHour ? minM : '00';
      minSecond = +hour <= +minHour && +minute <= +minMinute ? minS : '00';
    }
    if (props.maxTime) {
      const [maxH, maxM, maxS] = getValidTime(props.maxTime);
      maxHour = maxH;
      maxMinute = +hour >= +maxHour ? maxM : '59';
      maxSecond = +hour >= +maxHour && +minute >= +maxMinute ? maxS : '59';
    }
  }

  return props.columnsType.map((type) => {
    const { filter, formatter } = props;
    switch (type) {
      case 'hour':
        return genOptions(+minHour, +maxHour, type, formatter, filter, currentValues);
      case 'minute':
        return genOptions(+minMinute, +maxMinute, type, formatter, filter, currentValues);
      case 'second':
        return genOptions(+minSecond, +maxSecond, type, formatter, filter, currentValues);
      default:
        return [];
    }
  });
}

// Clamp values to column boundaries, filling empty slots with first column option
function resolveValues(rawValues: string[]): string[] {
  const cols1 = buildColumns(rawValues);
  const filled = cols1.map((col, i) => {
    if (col.length === 0) return '';
    const val = rawValues[i];
    if (val !== undefined && val !== '') {
      const n = +val;
      if (!isNaN(n)) {
        const minV = +col[0].value!;
        const maxV = +col[col.length - 1].value!;
        return padZero(clamp(n, minV, maxV));
      }
    }
    return String(col[0].value ?? '');
  });
  // Second pass for cross-column dependencies (e.g., minTime/maxTime)
  const cols2 = buildColumns(filled);
  return cols2.map((col, i) => {
    if (col.length === 0) return '';
    const val = filled[i];
    const n = +val;
    if (!isNaN(n)) {
      const minV = +col[0].value!;
      const maxV = +col[col.length - 1].value!;
      return padZero(clamp(n, minV, maxV));
    }
    return String(col[0].value ?? '');
  });
}

const columns = computed<PickerColumnType[]>(() =>
  buildColumns(selectedValues.value),
);

// IMPORTANT: Register selectedValues watcher BEFORE the immediate modelValue watcher
// so that when the immediate callback sets selectedValues, this watcher can fire.
watch(selectedValues, (newValues) => {
  if (JSON.stringify(newValues) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', newValues);
  }
});

// Sync from external modelValue changes (with clamping)
watch(
  () => props.modelValue,
  (newValues) => {
    const resolved = resolveValues(newValues);
    if (JSON.stringify(resolved) !== JSON.stringify(selectedValues.value)) {
      selectedValues.value = resolved;
    }
  },
  { immediate: true },
);

// Sync from Picker's auto-adjustments (e.g., when columns change and
// Picker's fillCascadeValues resets out-of-range values to first option)
function onPickerUpdateModelValue(values: Numeric[]) {
  const strValues = values.map(String);
  if (JSON.stringify(strValues) !== JSON.stringify(selectedValues.value)) {
    selectedValues.value = strValues;
  }
}

// Pass through Picker events with string-typed values
function onChange(params: {
  columnIndex: number;
  selectedValues: Numeric[];
  selectedOptions: (PickerOption | undefined)[];
  selectedIndexes: number[];
}) {
  emit('change', {
    columnIndex: params.columnIndex,
    selectedValues: params.selectedValues.map(String),
    selectedOptions: params.selectedOptions,
    selectedIndexes: params.selectedIndexes,
  });
}

function onConfirm(params: {
  selectedValues: Numeric[];
  selectedOptions: (PickerOption | undefined)[];
  selectedIndexes: number[];
}) {
  emit('confirm', {
    selectedValues: params.selectedValues.map(String),
    selectedOptions: params.selectedOptions,
    selectedIndexes: params.selectedIndexes,
  });
}

function onCancel(params: {
  selectedValues: Numeric[];
  selectedOptions: (PickerOption | undefined)[];
  selectedIndexes: number[];
}) {
  emit('cancel', {
    selectedValues: params.selectedValues.map(String),
    selectedOptions: params.selectedOptions,
    selectedIndexes: params.selectedIndexes,
  });
}

function confirm() {
  pickerRef.value?.confirm();
}

function getSelectedTime(): string[] {
  return selectedValues.value;
}

defineExpose<TimePickerExpose>({ confirm, getSelectedTime });
</script>

<template>
  <Picker
    ref="pickerRef"
    :model-value="(selectedValues as Numeric[])"
    :columns="columns"
    :title="title"
    :confirm-button-text="confirmButtonText"
    :cancel-button-text="cancelButtonText"
    :loading="loading"
    :readonly="readonly"
    :show-toolbar="showToolbar"
    :visible-option-num="visibleOptionNum"
    :option-height="optionHeight"
    :swipe-duration="swipeDuration"
    @update:model-value="onPickerUpdateModelValue"
    @change="onChange"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <template v-if="$slots.toolbar" #toolbar>
      <slot name="toolbar" />
    </template>
    <template v-if="$slots.title" #title>
      <slot name="title" />
    </template>
    <template v-if="$slots.confirm" #confirm>
      <slot name="confirm" />
    </template>
    <template v-if="$slots.cancel" #cancel>
      <slot name="cancel" />
    </template>
    <template v-if="$slots.option" #option="{ option, index }">
      <slot name="option" :option="option" :index="index" />
    </template>
    <template v-if="$slots['columns-top']" #columns-top>
      <slot name="columns-top" />
    </template>
    <template v-if="$slots['columns-bottom']" #columns-bottom>
      <slot name="columns-bottom" />
    </template>
  </Picker>
</template>
