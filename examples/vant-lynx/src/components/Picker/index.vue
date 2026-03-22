<!--
  Lynx Limitations:
  - allowHtml: Lynx does not support innerHTML/v-html; prop accepted but ignored
  - getElementTranslateY: No getComputedStyle in background thread; momentum mid-stop approximated
-->
<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit } from '../../utils/format';
import type { Numeric } from '../../utils/format';
import Loading from '../Loading/index.vue';
import PickerColumn from './PickerColumn.vue';
import PickerToolbar from './PickerToolbar.vue';
import type {
  PickerOption,
  PickerColumn as PickerColumnType,
  PickerFieldNames,
  PickerToolbarPosition,
} from './types';
import {
  assignDefaultFields,
  getColumnsType,
  formatCascadeColumns,
  getFirstEnabledOption,
  isOptionExist,
  findOptionByValue,
} from './utils';
import './index.less';

const [name, bem] = createNamespace('picker');

const props = withDefaults(
  defineProps<{
    columns?: (PickerOption | PickerColumnType)[];
    modelValue?: Numeric[];
    title?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    loading?: boolean;
    readonly?: boolean;
    allowHtml?: boolean;
    showToolbar?: boolean;
    visibleOptionNum?: Numeric;
    optionHeight?: Numeric;
    swipeDuration?: Numeric;
    toolbarPosition?: PickerToolbarPosition;
    columnsFieldNames?: PickerFieldNames;
  }>(),
  {
    columns: () => [],
    modelValue: () => [],
    loading: false,
    readonly: false,
    allowHtml: false,
    showToolbar: true,
    visibleOptionNum: 6,
    optionHeight: 44,
    swipeDuration: 1000,
    toolbarPosition: 'top',
  },
);

const emit = defineEmits<{
  'update:modelValue': [values: Numeric[]];
  confirm: [params: {
    selectedValues: Numeric[];
    selectedOptions: (PickerOption | undefined)[];
    selectedIndexes: number[];
  }];
  cancel: [params: {
    selectedValues: Numeric[];
    selectedOptions: (PickerOption | undefined)[];
    selectedIndexes: number[];
  }];
  change: [params: {
    columnIndex: number;
    selectedValues: Numeric[];
    selectedOptions: (PickerOption | undefined)[];
    selectedIndexes: number[];
  }];
  'click-option': [params: {
    columnIndex: number;
    currentOption: PickerOption;
    selectedValues: Numeric[];
    selectedOptions: (PickerOption | undefined)[];
    selectedIndexes: number[];
  }];
  'scroll-into': [params: {
    columnIndex: number;
    currentOption: PickerOption;
  }];
}>();

const fields = computed(() => assignDefaultFields(props.columnsFieldNames));

const resolvedOptHeight = computed(() => {
  const h = +props.optionHeight;
  return h > 0 ? h : 44;
});

const resolvedVisibleNum = computed(() => {
  const n = +props.visibleOptionNum;
  return n > 0 ? n : 6;
});

// Selected values tracked internally
const selectedValues = ref<Numeric[]>(props.modelValue.slice());

// Detect column type and compute effective columns
const columnsType = computed(() =>
  getColumnsType(props.columns, fields.value),
);

const currentColumns = computed<PickerColumnType[]>(() => {
  const { columns } = props;
  if (!columns || columns.length === 0) return [];

  const f = fields.value;

  switch (columnsType.value) {
    case 'multiple':
      return columns as PickerColumnType[];
    case 'cascade':
      return formatCascadeColumns(
        columns as PickerOption[],
        f,
        selectedValues.value,
      );
    default:
      return [columns as PickerColumnType];
  }
});

const selectedIndexes = computed(() =>
  currentColumns.value.map((options, colIndex) => {
    const val = selectedValues.value[colIndex];
    const f = fields.value;
    const idx = options.findIndex(
      (opt) => opt[f.value] === val && !opt.disabled,
    );
    return idx >= 0 ? idx : 0;
  }),
);

const selectedOptions = computed(() =>
  currentColumns.value.map((options, colIndex) => {
    const val = selectedValues.value[colIndex];
    return findOptionByValue(options, val, fields.value);
  }),
);

function getEventParams() {
  return {
    selectedValues: selectedValues.value.slice(),
    selectedOptions: selectedOptions.value.slice(),
    selectedIndexes: selectedIndexes.value.slice(),
  };
}

// Sync selected values when modelValue changes externally
watch(
  () => props.modelValue,
  (newValues) => {
    if (JSON.stringify(newValues) !== JSON.stringify(selectedValues.value)) {
      selectedValues.value = newValues.slice();
      // Re-fill missing values (handles both cascade and cleared modelValue)
      fillCascadeValues();
    }
  },
  { deep: true },
);

// Emit modelValue when internal selection changes
watch(
  selectedValues,
  (newValues) => {
    if (JSON.stringify(newValues) !== JSON.stringify(props.modelValue)) {
      emit('update:modelValue', newValues.slice());
    }
  },
  { deep: true },
);

// Fill cascade values for columns that don't have a selected value
function fillCascadeValues() {
  const cols = currentColumns.value;
  const values = selectedValues.value.slice();
  let changed = false;

  cols.forEach((options, colIndex) => {
    if (values[colIndex] === undefined || !isOptionExist(options, values[colIndex], fields.value)) {
      const first = getFirstEnabledOption(options);
      if (first) {
        values[colIndex] = first[fields.value.value] ?? '';
        changed = true;
      }
    }
  });

  // Trim excess values
  if (values.length > cols.length) {
    values.length = cols.length;
    changed = true;
  }

  if (changed) {
    selectedValues.value = values;
  }
}

// Ensure selected values stay valid when columns change
watch(
  currentColumns,
  () => {
    fillCascadeValues();
  },
  { immediate: true },
);

function onColumnChange(columnIndex: number, value: Numeric) {
  const newValues = selectedValues.value.slice();
  newValues[columnIndex] = value;
  selectedValues.value = newValues;

  // For cascade, subsequent columns may change
  if (columnsType.value === 'cascade') {
    // Values after the changed column will be auto-filled by fillCascadeValues
    // triggered by the watch on currentColumns
  }

  emit('change', {
    columnIndex,
    ...getEventParams(),
  });
}

function onColumnClickOption(columnIndex: number, option: PickerOption) {
  emit('click-option', {
    columnIndex,
    currentOption: option,
    ...getEventParams(),
  });
}

function onColumnScrollInto(columnIndex: number, option: PickerOption) {
  emit('scroll-into', {
    columnIndex,
    currentOption: option,
  });
}

function onConfirm() {
  if (props.readonly || props.loading) return;
  emit('confirm', getEventParams());
}

function onCancel() {
  emit('cancel', getEventParams());
}

// Computed styles
const wrapHeight = computed(
  () => resolvedOptHeight.value * resolvedVisibleNum.value,
);

const columnsStyle = computed(() => ({
  height: `${wrapHeight.value}px`,
}));

const maskHeight = computed(
  () => (wrapHeight.value - resolvedOptHeight.value) / 2,
);

const maskTopStyle = computed(() => ({
  height: `${maskHeight.value}px`,
}));

const maskBottomStyle = computed(() => ({
  height: `${maskHeight.value}px`,
}));

const frameStyle = computed(() => ({
  top: `${maskHeight.value}px`,
  height: `${resolvedOptHeight.value}px`,
}));

const hasOptions = computed(() =>
  currentColumns.value.some((col) => col.length > 0),
);

// Exposed methods
function confirm() {
  onConfirm();
}

function getSelectedOptions() {
  return selectedOptions.value.slice();
}

defineExpose({ confirm, getSelectedOptions });
</script>

<template>
  <view :class="bem()">
    <!-- Toolbar (top) -->
    <PickerToolbar
      v-if="showToolbar && toolbarPosition === 'top'"
      :title="title"
      :cancel-button-text="cancelButtonText"
      :confirm-button-text="confirmButtonText"
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
    </PickerToolbar>

    <!-- Columns top slot -->
    <slot name="columns-top" />

    <!-- Columns -->
    <view :class="bem('columns')" :style="columnsStyle">
      <template v-if="hasOptions">
        <PickerColumn
          v-for="(column, columnIndex) in currentColumns"
          :key="columnIndex"
          :value="selectedValues[columnIndex]"
          :fields="fields"
          :options="column"
          :readonly="readonly"
          :allow-html="allowHtml"
          :option-height="resolvedOptHeight"
          :swipe-duration="swipeDuration"
          :visible-option-num="visibleOptionNum"
          @change="(val: Numeric) => onColumnChange(columnIndex, val)"
          @click-option="(opt: PickerOption) => onColumnClickOption(columnIndex, opt)"
          @scroll-into="(opt: PickerOption) => onColumnScrollInto(columnIndex, opt)"
        >
          <template v-if="$slots.option" #option="{ option, index }">
            <slot name="option" :option="option" :index="index" />
          </template>
        </PickerColumn>

        <!-- Mask (top gradient) -->
        <view :class="bem('mask') + ' ' + bem('mask', { top: true })" :style="maskTopStyle" />

        <!-- Mask (bottom gradient) -->
        <view :class="bem('mask') + ' ' + bem('mask', { bottom: true })" :style="maskBottomStyle" />

        <!-- Frame (selection indicator) -->
        <view :class="bem('frame')" :style="frameStyle" />
      </template>

      <!-- Empty state -->
      <template v-if="!hasOptions && !loading">
        <slot name="empty" />
      </template>

      <!-- Loading overlay -->
      <view v-if="loading" :class="bem('loading')">
        <Loading color="var(--van-picker-loading-icon-color)" />
      </view>
    </view>

    <!-- Columns bottom slot -->
    <slot name="columns-bottom" />

    <!-- Toolbar (bottom) -->
    <PickerToolbar
      v-if="showToolbar && toolbarPosition === 'bottom'"
      :title="title"
      :cancel-button-text="cancelButtonText"
      :confirm-button-text="confirmButtonText"
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
    </PickerToolbar>
  </view>
</template>
