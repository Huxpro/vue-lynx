<!--
  Lynx Limitations:
  - tag prop: Lynx has no HTML tags, always renders <view>
  - scroll-wheel physics: tap-to-select via Picker component (no native wheel)
-->
<script lang="ts">
const currentYear = new Date().getFullYear();
</script>

<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import { padZero, clamp } from '../../utils/format';
import Picker from '../Picker/index.vue';
import type { PickerOption, PickerColumn as PickerColumnType } from '../Picker/types';
import type { Numeric } from '../../utils/format';
import type {
  DatePickerColumnType,
  DatePickerFilter,
  DatePickerFormatter,
  DatePickerExpose,
} from './types';
import { genOptions, getMonthEndDay } from './utils';
import './index.less';

const props = withDefaults(
  defineProps<{
    modelValue?: string[];
    columnsType?: DatePickerColumnType[];
    minDate?: Date;
    maxDate?: Date;
    filter?: DatePickerFilter;
    formatter?: DatePickerFormatter;
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
    columnsType: () => ['year', 'month', 'day'] as DatePickerColumnType[],
    minDate: () => new Date(currentYear - 10, 0, 1),
    maxDate: () => new Date(currentYear + 10, 11, 31),
    formatter: ((_type: string, option: PickerOption) => option) as DatePickerFormatter,
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

// Helpers
const isMinYear = (year: number) => year === props.minDate.getFullYear();
const isMaxYear = (year: number) => year === props.maxDate.getFullYear();
const isMinMonth = (month: number) => month === props.minDate.getMonth() + 1;
const isMaxMonth = (month: number) => month === props.maxDate.getMonth() + 1;

function getValFromArr(values: string[], type: DatePickerColumnType): number {
  const index = props.columnsType.indexOf(type);
  const value = values[index];
  if (value !== undefined && value !== '') return +value;
  switch (type) {
    case 'year': return props.minDate.getFullYear();
    case 'month': return props.minDate.getMonth() + 1;
    case 'day': return props.minDate.getDate();
  }
}

function buildColumnsFromValues(values: string[]): PickerColumnType[] {
  return props.columnsType.map((type) => {
    switch (type) {
      case 'year': {
        return genOptions(
          props.minDate.getFullYear(),
          props.maxDate.getFullYear(),
          'year', props.formatter, props.filter, values,
        );
      }
      case 'month': {
        const year = getValFromArr(values, 'year');
        const min = isMinYear(year) ? props.minDate.getMonth() + 1 : 1;
        const max = isMaxYear(year) ? props.maxDate.getMonth() + 1 : 12;
        return genOptions(min, max, 'month', props.formatter, props.filter, values);
      }
      case 'day': {
        const year = getValFromArr(values, 'year');
        let month = getValFromArr(values, 'month');
        const minMonth = isMinYear(year) ? props.minDate.getMonth() + 1 : 1;
        const maxMonth = isMaxYear(year) ? props.maxDate.getMonth() + 1 : 12;
        month = clamp(month, minMonth, maxMonth);
        const minD = isMinYear(year) && isMinMonth(month) ? props.minDate.getDate() : 1;
        const maxD = isMaxYear(year) && isMaxMonth(month)
          ? props.maxDate.getDate()
          : getMonthEndDay(year, month);
        return genOptions(minD, Math.max(minD, maxD), 'day', props.formatter, props.filter, values);
      }
      default: return [];
    }
  });
}

function clampToColumns(values: string[], cols: PickerColumnType[]): string[] {
  return cols.map((col, i) => {
    if (col.length === 0) return '';
    const val = values[i];
    if (val !== undefined && val !== '') {
      const minV = +col[0].value!;
      const maxV = +col[col.length - 1].value!;
      const n = +val;
      if (!isNaN(n)) {
        return padZero(clamp(n, minV, maxV));
      }
    }
    return String(col[0].value ?? '');
  });
}

// Resolve initial values: clamp modelValue to valid range, fill missing with defaults
function resolveValues(rawValues: string[]): string[] {
  const cols1 = buildColumnsFromValues(rawValues);
  const clamped = clampToColumns(rawValues, cols1);
  const cols2 = buildColumnsFromValues(clamped);
  return clampToColumns(clamped, cols2);
}

// The selected values passed to Picker
const selectedValues = ref<string[]>(resolveValues(props.modelValue));

// Columns computed from selectedValues
const columns = computed<PickerColumnType[]>(() =>
  buildColumnsFromValues(selectedValues.value),
);

// Sync from external modelValue changes
watch(
  () => props.modelValue,
  (newValues) => {
    const resolved = resolveValues(newValues);
    if (JSON.stringify(resolved) !== JSON.stringify(selectedValues.value)) {
      selectedValues.value = resolved;
    }
  },
);

// Re-clamp when min/max date changes
watch(
  [() => props.minDate, () => props.maxDate],
  () => {
    const resolved = resolveValues(selectedValues.value);
    if (JSON.stringify(resolved) !== JSON.stringify(selectedValues.value)) {
      selectedValues.value = resolved;
    }
  },
);

// Map Picker events
function onChange(params: {
  columnIndex: number;
  selectedValues: Numeric[];
  selectedOptions: (PickerOption | undefined)[];
  selectedIndexes: number[];
}) {
  const strValues = params.selectedValues.map(String);
  // Re-clamp dependent columns (changing year may invalidate month/day)
  const resolved = resolveValues(strValues);
  selectedValues.value = resolved;
  if (JSON.stringify(resolved) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', resolved);
  }
  emit('change', {
    columnIndex: params.columnIndex,
    selectedValues: resolved,
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

function getSelectedDate(): string[] {
  return selectedValues.value;
}

defineExpose<DatePickerExpose>({ confirm, getSelectedDate });
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
