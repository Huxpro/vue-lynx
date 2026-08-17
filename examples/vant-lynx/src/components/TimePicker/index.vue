<!--
  Vant Feature Parity Report -- TimePicker
  =========================================
  Props: 16/16 supported
    Supported: modelValue, title, minHour, maxHour, minMinute, maxMinute,
               minSecond, maxSecond, minTime, maxTime, columnsType,
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

export type TimePickerColumnType = 'hour' | 'minute' | 'second';

export interface TimePickerProps {
  modelValue?: string[];
  title?: string;
  minHour?: number;
  maxHour?: number;
  minMinute?: number;
  maxMinute?: number;
  minSecond?: number;
  maxSecond?: number;
  minTime?: string;
  maxTime?: string;
  columnsType?: TimePickerColumnType[];
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

const props = withDefaults(defineProps<TimePickerProps>(), {
  modelValue: () => [],
  minHour: 0,
  maxHour: 23,
  minMinute: 0,
  maxMinute: 59,
  minSecond: 0,
  maxSecond: 59,
  columnsType: () => ['hour', 'minute'] as TimePickerColumnType[],
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
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

// Parse "HH:MM:SS" time string into per-column values
const fullColumns: TimePickerColumnType[] = ['hour', 'minute', 'second'];

function getValidTime(time: string): string[] {
  const parts = time.split(':');
  return fullColumns.map((col, i) =>
    props.columnsType.includes(col) ? (parts[i] ?? '00') : '00',
  );
}

const columns = computed(() => {
  const result: string[][] = [];

  let effectiveMinHour = props.minHour;
  let effectiveMaxHour = props.maxHour;
  let effectiveMinMinute = props.minMinute;
  let effectiveMaxMinute = props.maxMinute;
  let effectiveMinSecond = props.minSecond;
  let effectiveMaxSecond = props.maxSecond;

  if (props.minTime || props.maxTime) {
    const currentFull: Record<TimePickerColumnType, number> = {
      hour: 0,
      minute: 0,
      second: 0,
    };
    const vals = props.modelValue && props.modelValue.length > 0
      ? props.modelValue
      : [];
    props.columnsType.forEach((col, i) => {
      currentFull[col] = parseInt(vals[i] ?? '0', 10);
    });

    if (props.minTime) {
      const [minH, minM, minS] = getValidTime(props.minTime);
      effectiveMinHour = parseInt(minH, 10);
      effectiveMinMinute = currentFull.hour <= effectiveMinHour ? parseInt(minM, 10) : 0;
      effectiveMinSecond = currentFull.hour <= effectiveMinHour && currentFull.minute <= parseInt(minM, 10)
        ? parseInt(minS, 10)
        : 0;
    }
    if (props.maxTime) {
      const [maxH, maxM, maxS] = getValidTime(props.maxTime);
      effectiveMaxHour = parseInt(maxH, 10);
      effectiveMaxMinute = currentFull.hour >= effectiveMaxHour ? parseInt(maxM, 10) : 59;
      effectiveMaxSecond = currentFull.hour >= effectiveMaxHour && currentFull.minute >= parseInt(maxM, 10)
        ? parseInt(maxS, 10)
        : 59;
    }
  }

  for (const type of props.columnsType) {
    let values: string[] = [];
    if (type === 'hour') {
      for (let h = effectiveMinHour; h <= effectiveMaxHour; h++) {
        values.push(padZero(h));
      }
    } else if (type === 'minute') {
      for (let m = effectiveMinMinute; m <= effectiveMaxMinute; m++) {
        values.push(padZero(m));
      }
    } else if (type === 'second') {
      for (let s = effectiveMinSecond; s <= effectiveMaxSecond; s++) {
        values.push(padZero(s));
      }
    }

    // Apply filter
    if (props.filter) {
      values = props.filter(type, values);
    }

    result.push(values);
  }

  return result;
});

// Format display text for an option
function getDisplayText(type: string, value: string): string {
  if (props.formatter) {
    return props.formatter(type, value);
  }
  return value;
}

const selectedIndexes = ref<number[]>([]);

function initIndexes() {
  const vals = props.modelValue && props.modelValue.length > 0
    ? props.modelValue
    : columns.value.map((col) => col[0] ?? '');

  selectedIndexes.value = columns.value.map((col, i) => {
    const idx = col.indexOf(vals[i] ?? '');
    return idx >= 0 ? idx : 0;
  });
}

watch(() => props.modelValue, () => initIndexes(), { immediate: true });
watch(() => columns.value, () => initIndexes());

const selectedValues = computed(() =>
  columns.value.map((col, i) => col[selectedIndexes.value[i]] ?? col[0] ?? ''),
);

function onSelectItem(colIndex: number, itemIndex: number) {
  if (props.readonly) return;

  const newIndexes = [...selectedIndexes.value];
  newIndexes[colIndex] = itemIndex;
  selectedIndexes.value = newIndexes;

  const vals = columns.value.map((col, i) => col[newIndexes[i]] ?? col[0] ?? '');
  emit('change', vals);
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

function getColumnLabel(type: string): string {
  switch (type) {
    case 'hour': return 'Hour';
    case 'minute': return 'Minute';
    case 'second': return 'Second';
    default: return '';
  }
}

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
