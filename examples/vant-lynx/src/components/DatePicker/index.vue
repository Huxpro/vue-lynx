<!--
  Vant Feature Parity Report -- DatePicker
  =========================================
  Props: 14/14 supported
    Supported: modelValue, columnsType, title, minDate, maxDate,
               confirmButtonText, cancelButtonText, loading, readonly,
               showToolbar, optionHeight, filter, formatter, visibleOptionNum

  Events: 4/4 supported
    Supported: update:modelValue, confirm, cancel, change

  Slots: 7/7 supported
    Supported: toolbar, title, confirm, cancel, option, columns-top, columns-bottom
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import Loading from '../Loading/index.vue';

export type DatePickerColumnType = 'year' | 'month' | 'day' | 'hour';

export interface DatePickerProps {
  modelValue?: string[];
  columnsType?: DatePickerColumnType[];
  title?: string;
  minDate?: Date;
  maxDate?: Date;
  confirmButtonText?: string;
  cancelButtonText?: string;
  loading?: boolean;
  readonly?: boolean;
  showToolbar?: boolean;
  optionHeight?: number;
  filter?: (type: string, values: string[]) => string[];
  formatter?: (type: string, value: string) => string;
  visibleOptionNum?: number;
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  modelValue: () => [],
  columnsType: () => ['year', 'month', 'day'] as DatePickerColumnType[],
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  minDate: () => new Date(new Date().getFullYear() - 10, 0, 1),
  maxDate: () => new Date(new Date().getFullYear() + 10, 11, 31),
  loading: false,
  readonly: false,
  showToolbar: true,
  optionHeight: 44,
  visibleOptionNum: 6,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
  confirm: [value: string[]];
  cancel: [];
  change: [value: string[]];
}>();

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getColumnLabel(type: string): string {
  switch (type) {
    case 'year': return 'Year';
    case 'month': return 'Month';
    case 'day': return 'Day';
    case 'hour': return 'Hour';
    default: return '';
  }
}

function getYearIndex(): number {
  return props.columnsType.indexOf('year');
}

function getMonthIndex(): number {
  return props.columnsType.indexOf('month');
}

// Format display text for an option
function getDisplayText(type: string, value: string): string {
  if (props.formatter) {
    return props.formatter(type, value);
  }
  return value;
}

const minYear = computed(() => props.minDate.getFullYear());
const maxYear = computed(() => props.maxDate.getFullYear());

const years = computed(() => {
  const result: string[] = [];
  for (let y = minYear.value; y <= maxYear.value; y++) {
    result.push(`${y}`);
  }
  return result;
});

function getDefaultValues(): string[] {
  const now = new Date();
  const y = `${now.getFullYear()}`;
  const m = padZero(now.getMonth() + 1);
  const d = padZero(now.getDate());
  const h = padZero(now.getHours());

  const map: Record<string, string> = { year: y, month: m, day: d, hour: h };
  return props.columnsType.map((type) => map[type] ?? '00');
}

function buildColumns(vals: string[]): string[][] {
  const result: string[][] = [];

  for (let ci = 0; ci < props.columnsType.length; ci++) {
    const colType = props.columnsType[ci];
    let values: string[] = [];

    if (colType === 'year') {
      values = years.value.slice();
    } else if (colType === 'month') {
      const yIdx = getYearIndex();
      let startMonth = 1;
      let endMonth = 12;
      if (yIdx >= 0 && parseInt(vals[yIdx] ?? '0', 10) === minYear.value) {
        startMonth = props.minDate.getMonth() + 1;
      }
      if (yIdx >= 0 && parseInt(vals[yIdx] ?? '9999', 10) === maxYear.value) {
        endMonth = props.maxDate.getMonth() + 1;
      }
      for (let m = startMonth; m <= endMonth; m++) {
        values.push(padZero(m));
      }
    } else if (colType === 'day') {
      const yIdx = getYearIndex();
      const mIdx = getMonthIndex();
      const yr = parseInt(vals[yIdx >= 0 ? yIdx : 0] ?? `${new Date().getFullYear()}`, 10);
      const mo = parseInt(vals[mIdx >= 0 ? mIdx : 1] ?? '01', 10);
      const maxDay = getDaysInMonth(yr, mo);
      let startDay = 1;
      let endDay = maxDay;
      if (
        yIdx >= 0 && mIdx >= 0 &&
        parseInt(vals[yIdx] ?? '0', 10) === minYear.value &&
        parseInt(vals[mIdx] ?? '0', 10) === props.minDate.getMonth() + 1
      ) {
        startDay = props.minDate.getDate();
      }
      if (
        yIdx >= 0 && mIdx >= 0 &&
        parseInt(vals[yIdx] ?? '9999', 10) === maxYear.value &&
        parseInt(vals[mIdx] ?? '99', 10) === props.maxDate.getMonth() + 1
      ) {
        endDay = Math.min(maxDay, props.maxDate.getDate());
      }
      for (let d = startDay; d <= endDay; d++) {
        values.push(padZero(d));
      }
    } else if (colType === 'hour') {
      for (let h = 0; h <= 23; h++) {
        values.push(padZero(h));
      }
    }

    // Apply filter
    if (props.filter) {
      values = props.filter(colType, values);
    }

    result.push(values);
  }

  return result;
}

// Track current values directly
const currentValues = ref<string[]>([]);

function initValues() {
  if (props.modelValue && props.modelValue.length > 0) {
    currentValues.value = [...props.modelValue];
  } else {
    currentValues.value = getDefaultValues();
  }
}

watch(() => props.modelValue, () => initValues(), { immediate: true });

const columns = computed(() => buildColumns(currentValues.value));

const selectedIndexes = computed(() =>
  columns.value.map((col, i) => {
    const idx = col.indexOf(currentValues.value[i] ?? '');
    return idx >= 0 ? idx : 0;
  }),
);

const selectedValues = computed(() =>
  columns.value.map((col, i) => col[selectedIndexes.value[i]] ?? col[0] ?? ''),
);

function onSelectItem(colIndex: number, itemIndex: number) {
  if (props.readonly) return;

  const newVals = [...currentValues.value];
  newVals[colIndex] = columns.value[colIndex][itemIndex] ?? newVals[colIndex];

  // Rebuild columns with new values and clamp subsequent columns
  const newCols = buildColumns(newVals);
  for (let i = colIndex + 1; i < newCols.length; i++) {
    const curIdx = newCols[i].indexOf(newVals[i] ?? '');
    if (curIdx < 0) {
      newVals[i] = newCols[i][0] ?? '';
    }
  }

  currentValues.value = newVals;
  emit('change', newVals);
}

function onConfirm() {
  emit('update:modelValue', selectedValues.value);
  emit('confirm', selectedValues.value);
}

function onCancel() {
  emit('cancel');
}

const resolvedVisibleNum = computed(() => props.visibleOptionNum || 6);
const wrapHeight = computed(() => props.optionHeight * resolvedVisibleNum.value);

const toolbarStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'space-between' as const,
  height: 44,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};

const columnsContainerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  height: wrapHeight.value,
  backgroundColor: '#fff',
  overflow: 'hidden' as const,
  position: 'relative' as const,
}));

const loadingOverlayStyle = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
};

const frameStyle = computed(() => ({
  position: 'absolute' as const,
  top: (wrapHeight.value - props.optionHeight) / 2,
  left: 0,
  right: 0,
  height: props.optionHeight,
  borderTopWidth: 0.5,
  borderTopStyle: 'solid' as const,
  borderTopColor: '#ebedf0',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
}));
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }">
    <!-- Toolbar -->
    <view v-if="showToolbar" :style="toolbarStyle">
      <slot name="toolbar">
        <slot name="cancel">
          <text
            :style="{ fontSize: 14, color: '#969799', padding: 4 }"
            @tap="onCancel"
          >{{ cancelButtonText }}</text>
        </slot>
        <slot name="title">
          <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ title }}</text>
        </slot>
        <slot name="confirm">
          <text
            :style="{ fontSize: 14, color: '#1989fa', padding: 4 }"
            @tap="onConfirm"
          >{{ confirmButtonText }}</text>
        </slot>
      </slot>
    </view>

    <!-- Column Headers -->
    <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', paddingTop: 8 }">
      <view
        v-for="(colType, ci) in columnsType"
        :key="ci"
        :style="{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }"
      >
        <text :style="{ fontSize: 12, color: '#969799' }">{{ getColumnLabel(colType) }}</text>
      </view>
    </view>

    <!-- Columns top slot -->
    <slot name="columns-top" />

    <!-- Columns -->
    <view :style="columnsContainerStyle">
      <view
        v-for="(column, colIndex) in columns"
        :key="colIndex"
        :style="{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column' as const,
          position: 'relative' as const,
        }"
      >
        <!-- Items list -->
        <view :style="{ paddingTop: (wrapHeight - optionHeight) / 2, paddingBottom: (wrapHeight - optionHeight) / 2 }">
          <view
            v-for="(item, itemIndex) in column"
            :key="itemIndex"
            :style="{
              height: optionHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }"
            @tap="onSelectItem(colIndex, itemIndex)"
          >
            <slot name="option" :option="item" :column-type="columnsType[colIndex]" :index="itemIndex">
              <text
                :style="{
                  fontSize: 16,
                  color: selectedIndexes[colIndex] === itemIndex ? '#323233' : '#969799',
                  fontWeight: selectedIndexes[colIndex] === itemIndex ? 'bold' as const : 'normal' as const,
                }"
              >{{ getDisplayText(columnsType[colIndex], item) }}</text>
            </slot>
          </view>
        </view>
      </view>

      <!-- Frame indicator -->
      <view :style="frameStyle" />

      <!-- Loading overlay -->
      <view v-if="loading" :style="loadingOverlayStyle">
        <Loading />
      </view>
    </view>

    <!-- Columns bottom slot -->
    <slot name="columns-bottom" />
  </view>
</template>
