<!--
  Vant Feature Parity Report:
  - Props: 6/10 supported (modelValue, columnsType/type, title, minDate, maxDate,
    confirmButtonText, cancelButtonText)
    Missing: filter, formatter, loading, readonly, optionHeight, swipeDuration, visibleOptionNum,
    showToolbar, columnsOrder (partially via type prop)
  - Events: 4/4 supported (update:modelValue, confirm, cancel, change)
  - Slots: 0/5 supported
    Missing: toolbar, title, confirm, cancel, option, columns-top, columns-bottom
  - Gaps: no filter/formatter for custom option text; no scroll-wheel physics (tap-to-select);
    type prop maps to columnsType internally but 'datehour' is non-standard Vant;
    no loading/readonly inherited from Picker
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';

export interface DatePickerProps {
  modelValue?: string[];
  type?: 'date' | 'year-month' | 'month-day' | 'datehour';
  title?: string;
  minDate?: Date;
  maxDate?: Date;
  columnsOrder?: string[];
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  modelValue: () => [],
  type: 'date',
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  minDate: () => new Date(new Date().getFullYear() - 10, 0, 1),
  maxDate: () => new Date(new Date().getFullYear() + 10, 11, 31),
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

function getColumnTypes(): string[] {
  if (props.columnsOrder) return props.columnsOrder;
  switch (props.type) {
    case 'year-month': return ['year', 'month'];
    case 'month-day': return ['month', 'day'];
    case 'datehour': return ['year', 'month', 'day', 'hour'];
    default: return ['year', 'month', 'day'];
  }
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
  return getColumnTypes().indexOf('year');
}

function getMonthIndex(): number {
  return getColumnTypes().indexOf('month');
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

  switch (props.type) {
    case 'year-month': return [y, m];
    case 'month-day': return [m, d];
    case 'datehour': return [y, m, d, h];
    default: return [y, m, d];
  }
}

function buildColumns(vals: string[]): string[][] {
  const columnTypes = getColumnTypes();
  const result: string[][] = [];

  for (const colType of columnTypes) {
    if (colType === 'year') {
      result.push(years.value);
    } else if (colType === 'month') {
      const months: string[] = [];
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
        months.push(padZero(m));
      }
      result.push(months);
    } else if (colType === 'day') {
      const days: string[] = [];
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
        days.push(padZero(d));
      }
      result.push(days);
    } else if (colType === 'hour') {
      const hours: string[] = [];
      for (let h = 0; h <= 23; h++) {
        hours.push(padZero(h));
      }
      result.push(hours);
    }
  }

  return result;
}

// Track current values directly, avoiding circular computed deps
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

const columnsContainerStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  height: 220,
  backgroundColor: '#fff',
  overflow: 'hidden',
};
</script>

<template>
  <view :style="{ backgroundColor: '#fff' }">
    <!-- Toolbar -->
    <view :style="toolbarStyle">
      <text
        :style="{ fontSize: 14, color: '#969799', padding: 4 }"
        @tap="onCancel"
      >{{ cancelButtonText }}</text>
      <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233' }">{{ title }}</text>
      <text
        :style="{ fontSize: 14, color: '#1989fa', padding: 4 }"
        @tap="onConfirm"
      >{{ confirmButtonText }}</text>
    </view>

    <!-- Column Headers -->
    <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', paddingTop: 8 }">
      <view
        v-for="(colType, ci) in getColumnTypes()"
        :key="ci"
        :style="{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }"
      >
        <text :style="{ fontSize: 12, color: '#969799' }">{{ getColumnLabel(colType) }}</text>
      </view>
    </view>

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
        <!-- Selected item highlight -->
        <view
          :style="{
            position: 'absolute' as const,
            top: 88,
            left: 0,
            right: 0,
            height: 44,
            borderTopWidth: 0.5,
            borderTopStyle: 'solid' as const,
            borderTopColor: '#ebedf0',
            borderBottomWidth: 0.5,
            borderBottomStyle: 'solid' as const,
            borderBottomColor: '#ebedf0',
          }"
        />
        <!-- Items list -->
        <view :style="{ paddingTop: 88, paddingBottom: 88 }">
          <view
            v-for="(item, itemIndex) in column"
            :key="itemIndex"
            :style="{
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }"
            @tap="onSelectItem(colIndex, itemIndex)"
          >
            <text
              :style="{
                fontSize: 16,
                color: selectedIndexes[colIndex] === itemIndex ? '#323233' : '#969799',
                fontWeight: selectedIndexes[colIndex] === itemIndex ? 'bold' as const : 'normal' as const,
              }"
            >{{ item }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
