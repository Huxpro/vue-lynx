<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import DemoBlock from '../components/DemoBlock/index.vue';
import Cell from '../components/Cell/index.vue';
import Calendar from '../components/Calendar/index.vue';
import type { CalendarDayItem } from '../components/Calendar/types';

// --- State ---
const showCalendar = ref(false);
const calendarType = ref<'single' | 'range' | 'multiple'>('single');
const calendarConfig = ref<Record<string, any>>({});
const result = ref('');

// Formatted date helpers
function formatDate(date: Date): string {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function formatFullDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatRange(dates: Date[]): string {
  if (dates.length === 2) {
    return `${formatFullDate(dates[0])} - ${formatFullDate(dates[1])}`;
  }
  return '';
}

function formatMultiple(dates: Date[]): string {
  return `已选择 ${dates.length} 个日期`;
}

// Per-demo results
const results: Record<string, string> = {};
const currentDemoKey = ref('');

function showDemo(key: string, type: 'single' | 'range' | 'multiple', config: Record<string, any> = {}) {
  currentDemoKey.value = key;
  calendarType.value = type;
  calendarConfig.value = config;
  showCalendar.value = true;
}

function onConfirm(date: Date | Date[]) {
  showCalendar.value = false;
  const key = currentDemoKey.value;
  if (calendarType.value === 'single') {
    results[key] = formatDate(date as Date);
  } else if (calendarType.value === 'range') {
    results[key] = formatRange(date as Date[]);
  } else {
    results[key] = formatMultiple(date as Date[]);
  }
  result.value = results[key] || '';
}

// --- Single date results ---
const singleResult = ref('');
const rangeResult = ref('');
const multipleResult = ref('');
const quickResult = ref('');
const colorResult = ref('');
const rangeCustomResult = ref('');
const confirmTextResult = ref('');
const formatterResult = ref('');
const maxRangeResult = ref('');
const firstDayResult = ref('');

// Individual show states
const showSingle = ref(false);
const showRange = ref(false);
const showMultiple = ref(false);
const showQuick = ref(false);
const showColor = ref(false);
const showRangeCustom = ref(false);
const showConfirmText = ref(false);
const showFormatter = ref(false);
const showMaxRange = ref(false);
const showFirstDay = ref(false);

// Date range for custom demo
const customMinDate = new Date(2010, 0, 1);
const customMaxDate = new Date(2010, 0, 31);

// Formatter
function dayFormatter(day: CalendarDayItem): CalendarDayItem {
  const month = day.date?.getMonth()! + 1;
  const date = day.date?.getDate();

  if (month === 5 && date === 1) {
    day.topInfo = '劳动节';
  } else if (month === 5 && date === 4) {
    day.topInfo = '青年节';
  }

  if (day.type === 'start') {
    day.bottomInfo = '入住';
  } else if (day.type === 'end') {
    day.bottomInfo = '离店';
  }

  return day;
}

function onSingleConfirm(date: Date | Date[]) {
  showSingle.value = false;
  singleResult.value = formatDate(date as Date);
}

function onRangeConfirm(date: Date | Date[]) {
  showRange.value = false;
  rangeResult.value = formatRange(date as Date[]);
}

function onMultipleConfirm(date: Date | Date[]) {
  showMultiple.value = false;
  multipleResult.value = formatMultiple(date as Date[]);
}

function onQuickConfirm(date: Date | Date[]) {
  showQuick.value = false;
  quickResult.value = formatDate(date as Date);
}

function onColorConfirm(date: Date | Date[]) {
  showColor.value = false;
  colorResult.value = formatRange(date as Date[]);
}

function onRangeCustomConfirm(date: Date | Date[]) {
  showRangeCustom.value = false;
  rangeCustomResult.value = formatRange(date as Date[]);
}

function onConfirmTextConfirm(date: Date | Date[]) {
  showConfirmText.value = false;
  confirmTextResult.value = formatDate(date as Date);
}

function onFormatterConfirm(date: Date | Date[]) {
  showFormatter.value = false;
  formatterResult.value = formatRange(date as Date[]);
}

function onMaxRangeConfirm(date: Date | Date[]) {
  showMaxRange.value = false;
  maxRangeResult.value = formatRange(date as Date[]);
}

function onFirstDayConfirm(date: Date | Date[]) {
  showFirstDay.value = false;
  firstDayResult.value = formatDate(date as Date);
}

// Tiled display (non-poppable)
const tiledDate = ref<Date | null>(null);
function onTiledConfirm(date: Date | Date[]) {
  tiledDate.value = date as Date;
}
</script>

<template>
  <DemoPage title="Calendar 日历">
    <!-- 基础用法 -->
    <DemoBlock title="基础用法">
      <Cell title="选择单个日期" :value="singleResult || '请选择'" is-link @tap="showSingle = true" />
      <Cell title="选择日期区间" :value="rangeResult || '请选择'" is-link @tap="showRange = true" />
      <Cell title="选择多个日期" :value="multipleResult || '请选择'" is-link @tap="showMultiple = true" />
    </DemoBlock>

    <!-- 快捷选择 -->
    <DemoBlock title="快捷选择">
      <Cell title="选择单个日期" :value="quickResult || '请选择'" is-link @tap="showQuick = true" />
    </DemoBlock>

    <!-- 自定义颜色 -->
    <DemoBlock title="自定义颜色">
      <Cell title="选择日期区间" :value="colorResult || '请选择'" is-link @tap="showColor = true" />
    </DemoBlock>

    <!-- 自定义日期范围 -->
    <DemoBlock title="自定义日期范围">
      <Cell title="选择日期区间" :value="rangeCustomResult || '请选择'" is-link @tap="showRangeCustom = true" />
    </DemoBlock>

    <!-- 自定义按钮文字 -->
    <DemoBlock title="自定义按钮文字">
      <Cell title="选择单个日期" :value="confirmTextResult || '请选择'" is-link @tap="showConfirmText = true" />
    </DemoBlock>

    <!-- 自定义日期文案 -->
    <DemoBlock title="自定义日期文案">
      <Cell title="选择日期区间" :value="formatterResult || '请选择'" is-link @tap="showFormatter = true" />
    </DemoBlock>

    <!-- 日期区间最大范围 -->
    <DemoBlock title="日期区间最大范围">
      <Cell title="选择日期区间" :value="maxRangeResult || '请选择'" is-link @tap="showMaxRange = true" />
    </DemoBlock>

    <!-- 自定义周起始日 -->
    <DemoBlock title="自定义周起始日">
      <Cell title="选择单个日期" :value="firstDayResult || '请选择'" is-link @tap="showFirstDay = true" />
    </DemoBlock>

    <!-- 平铺展示 -->
    <DemoBlock title="平铺展示">
      <view :style="{ height: '500px' }">
        <Calendar
          :poppable="false"
          :show-confirm="false"
          switch-mode="month"
          @confirm="onTiledConfirm"
        />
      </view>
    </DemoBlock>

    <!-- Calendar instances -->
    <Calendar
      v-model:show="showSingle"
      type="single"
      @confirm="onSingleConfirm"
    />

    <Calendar
      v-model:show="showRange"
      type="range"
      @confirm="onRangeConfirm"
    />

    <Calendar
      v-model:show="showMultiple"
      type="multiple"
      @confirm="onMultipleConfirm"
    />

    <Calendar
      v-model:show="showQuick"
      type="single"
      :show-confirm="false"
      @confirm="onQuickConfirm"
    />

    <Calendar
      v-model:show="showColor"
      type="range"
      color="#ee0a24"
      @confirm="onColorConfirm"
    />

    <Calendar
      v-model:show="showRangeCustom"
      type="range"
      :min-date="customMinDate"
      :max-date="customMaxDate"
      @confirm="onRangeCustomConfirm"
    />

    <Calendar
      v-model:show="showConfirmText"
      type="single"
      confirm-text="完成"
      confirm-disabled-text="请选择日期"
      @confirm="onConfirmTextConfirm"
    />

    <Calendar
      v-model:show="showFormatter"
      type="range"
      :formatter="dayFormatter"
      @confirm="onFormatterConfirm"
    />

    <Calendar
      v-model:show="showMaxRange"
      type="range"
      :max-range="3"
      @confirm="onMaxRangeConfirm"
    />

    <Calendar
      v-model:show="showFirstDay"
      type="single"
      :first-day-of-week="1"
      @confirm="onFirstDayConfirm"
    />
  </DemoPage>
</template>
