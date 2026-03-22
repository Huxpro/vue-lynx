<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import TimePicker from '../components/TimePicker/index.vue';
import type { PickerOption } from '../components/Picker/types';
import type { TimePickerColumnType } from '../components/TimePicker/types';

// 基础用法
const baseTime = ref(['12', '00']);

// 选项类型
const secondTime = ref(['12', '00', '00']);
const columnsType: TimePickerColumnType[] = ['hour', 'minute', 'second'];

// 时间范围
const rangeTime = ref(['12', '35']);

// 整体时间范围
const overallTime = ref(['12', '00', '00']);

// 格式化选项
const formatterTime = ref(['12', '00']);
const formatter = (type: string, option: PickerOption): PickerOption => {
  if (type === 'hour') {
    option.text = `${option.text}时`;
  }
  if (type === 'minute') {
    option.text = `${option.text}分`;
  }
  return option;
};

// 过滤选项
const filterTime = ref(['12', '00']);
const filter = (type: string, options: PickerOption[]) => {
  if (type === 'minute') {
    return options.filter((option) => Number(option.value) % 10 === 0);
  }
  return options;
};

// 高级用法
const timeFilter = (
  type: string,
  options: PickerOption[],
  values: string[],
) => {
  const hour = +values[0];

  if (type === 'hour') {
    return options.filter(
      (option) => Number(option.value) >= 8 && Number(option.value) <= 18,
    );
  }

  if (type === 'minute') {
    options = options.filter((option) => Number(option.value) % 10 === 0);

    if (hour === 8) {
      return options.filter((option) => Number(option.value) >= 40);
    }
    if (hour === 18) {
      return options.filter((option) => Number(option.value) <= 20);
    }
  }

  return options;
};
</script>

<template>
  <DemoPage title="TimePicker 时间选择">
    <!-- 基础用法 -->
    <view class="demo-time-picker-block">
      <text class="demo-time-picker-title">基础用法</text>
      <TimePicker
        v-model="baseTime"
        title="选择时间"
      />
    </view>

    <!-- 选项类型 -->
    <view class="demo-time-picker-block">
      <text class="demo-time-picker-title">选项类型</text>
      <TimePicker
        v-model="secondTime"
        title="选择时间"
        :columns-type="columnsType"
      />
    </view>

    <!-- 时间范围 -->
    <view class="demo-time-picker-block">
      <text class="demo-time-picker-title">时间范围</text>
      <TimePicker
        v-model="rangeTime"
        title="选择时间"
        :min-hour="10"
        :max-hour="20"
        :min-minute="30"
        :max-minute="40"
      />
    </view>

    <!-- 整体时间范围 -->
    <view class="demo-time-picker-block">
      <text class="demo-time-picker-title">整体时间范围</text>
      <TimePicker
        v-model="overallTime"
        title="选择时间"
        :columns-type="['hour', 'minute', 'second']"
        min-time="09:40:10"
        max-time="20:20:50"
      />
    </view>

    <!-- 格式化选项 -->
    <view class="demo-time-picker-block">
      <text class="demo-time-picker-title">格式化选项</text>
      <TimePicker
        v-model="formatterTime"
        title="选择时间"
        :formatter="formatter"
      />
    </view>

    <!-- 过滤选项 -->
    <view class="demo-time-picker-block">
      <text class="demo-time-picker-title">过滤选项</text>
      <TimePicker
        v-model="filterTime"
        title="选择时间"
        :filter="filter"
      />
    </view>

    <!-- 高级用法 -->
    <view class="demo-time-picker-block">
      <text class="demo-time-picker-title">高级用法</text>
      <TimePicker
        title="选择时间"
        :filter="timeFilter"
      />
    </view>
  </DemoPage>
</template>

<style>
.demo-time-picker-block {
  display: flex;
  flex-direction: column;
}

.demo-time-picker-title {
  font-size: 14px;
  color: #969799;
  padding: 12px 16px 8px;
}
</style>
