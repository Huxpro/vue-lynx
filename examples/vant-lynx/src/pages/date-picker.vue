<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import DatePicker from '../components/DatePicker/index.vue';
import type { PickerOption } from '../components/Picker/types';

const minDate = new Date(2020, 0, 1);
const maxDate = new Date(2025, 5, 1);

// 选择年月日
const basicDate = ref(['2021', '01', '01']);

// 选择年月
const yearMonthDate = ref<string[]>([]);

// 格式化选项
const formatterDate = ref<string[]>([]);
const formatter = (type: string, option: PickerOption): PickerOption => {
  if (type === 'year') {
    option.text = `${option.text}年`;
  } else if (type === 'month') {
    option.text = `${option.text}月`;
  } else if (type === 'day') {
    option.text = `${option.text}日`;
  }
  return option;
};

// 过滤选项
const filterDate = ref<string[]>([]);
const filter = (type: string, options: PickerOption[]): PickerOption[] => {
  if (type === 'month') {
    return options.filter((option) => Number(option.value) % 6 === 0);
  }
  return options;
};
</script>

<template>
  <DemoPage title="DatePicker 日期选择">
    <!-- 选择年月日 -->
    <view class="demo-date-picker-block">
      <text class="demo-date-picker-title">选择年月日</text>
      <DatePicker
        v-model="basicDate"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
      />
    </view>

    <!-- 选择年月 -->
    <view class="demo-date-picker-block">
      <text class="demo-date-picker-title">选择年月</text>
      <DatePicker
        v-model="yearMonthDate"
        title="选择年月"
        :min-date="minDate"
        :max-date="maxDate"
        :columns-type="['year', 'month']"
      />
    </view>

    <!-- 格式化选项 -->
    <view class="demo-date-picker-block">
      <text class="demo-date-picker-title">格式化选项</text>
      <DatePicker
        v-model="formatterDate"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        :formatter="formatter"
      />
    </view>

    <!-- 过滤选项 -->
    <view class="demo-date-picker-block">
      <text class="demo-date-picker-title">过滤选项</text>
      <DatePicker
        v-model="filterDate"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        :filter="filter"
      />
    </view>
  </DemoPage>
</template>

<style>
.demo-date-picker-block {
  display: flex;
  flex-direction: column;
}

.demo-date-picker-title {
  font-size: 14px;
  color: #969799;
  padding: 12px 16px 8px;
}
</style>
