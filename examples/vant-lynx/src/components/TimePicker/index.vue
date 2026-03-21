<!--
  Vant Feature Parity Report:
  - Props: 7/13 supported (modelValue, title, minHour, maxHour, minMinute, maxMinute,
    columnsType, confirmButtonText, cancelButtonText)
    Missing: minSecond, maxSecond, minTime, maxTime, filter, formatter, loading, readonly,
    optionHeight, swipeDuration, visibleOptionNum, showToolbar
  - Events: 4/4 supported (update:modelValue, confirm, cancel, change)
  - Slots: 0/5 supported
    Missing: toolbar, title, confirm, cancel, option, columns-top, columns-bottom
  - Gaps: no minTime/maxTime for cross-column time range constraints; no minSecond/maxSecond;
    no filter/formatter for custom option text; no scroll-wheel physics (tap-to-select);
    no loading/readonly inherited from Picker
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';

export interface TimePickerProps {
  modelValue?: string[];
  title?: string;
  minHour?: number;
  maxHour?: number;
  minMinute?: number;
  maxMinute?: number;
  columnsType?: string[];
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const props = withDefaults(defineProps<TimePickerProps>(), {
  modelValue: () => [],
  minHour: 0,
  maxHour: 23,
  minMinute: 0,
  maxMinute: 59,
  columnsType: () => ['hour', 'minute'],
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
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

const columns = computed(() => {
  const result: string[][] = [];

  for (const type of props.columnsType) {
    if (type === 'hour') {
      const hours: string[] = [];
      for (let h = props.minHour; h <= props.maxHour; h++) {
        hours.push(padZero(h));
      }
      result.push(hours);
    } else if (type === 'minute') {
      const minutes: string[] = [];
      for (let m = props.minMinute; m <= props.maxMinute; m++) {
        minutes.push(padZero(m));
      }
      result.push(minutes);
    } else if (type === 'second') {
      const seconds: string[] = [];
      for (let s = 0; s <= 59; s++) {
        seconds.push(padZero(s));
      }
      result.push(seconds);
    }
  }

  return result;
});

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

function getColumnLabel(type: string): string {
  switch (type) {
    case 'hour': return 'Hour';
    case 'minute': return 'Minute';
    case 'second': return 'Second';
    default: return '';
  }
}
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
        v-for="(colType, ci) in columnsType"
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
