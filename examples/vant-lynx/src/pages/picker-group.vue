<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import PickerGroup from '../components/PickerGroup/index.vue';
import Picker from '../components/Picker/index.vue';

// 选择日期时间
const dateColumns = [
  [
    { text: '2023', value: '2023' },
    { text: '2024', value: '2024' },
    { text: '2025', value: '2025' },
  ],
  [
    { text: '01', value: '01' },
    { text: '02', value: '02' },
    { text: '03', value: '03' },
    { text: '04', value: '04' },
    { text: '05', value: '05' },
    { text: '06', value: '06' },
  ],
  [
    { text: '01', value: '01' },
    { text: '02', value: '02' },
    { text: '03', value: '03' },
  ],
];

const timeColumns = [
  [
    { text: '00', value: '00' },
    { text: '01', value: '01' },
    { text: '02', value: '02' },
    { text: '08', value: '08' },
    { text: '12', value: '12' },
  ],
  [
    { text: '00', value: '00' },
    { text: '15', value: '15' },
    { text: '30', value: '30' },
    { text: '45', value: '45' },
  ],
];

const dateValue1 = ref(['2024', '01', '01']);
const timeValue1 = ref(['08', '00']);

const onDateTimeConfirm = (params: unknown[]) => {
  console.log('DateTime confirm:', params);
};

// 下一步按钮
const dateValue2 = ref(['2024', '01', '01']);
const timeValue2 = ref(['08', '00']);

const onNextStepConfirm = (params: unknown[]) => {
  console.log('NextStep confirm:', params);
};

// 选择日期范围
const startDate = ref(['2024', '01', '01']);
const endDate = ref(['2024', '06', '01']);

const onDateRangeConfirm = (params: unknown[]) => {
  console.log('DateRange confirm:', params);
};

// 选择时间范围
const startTime = ref(['08', '00']);
const endTime = ref(['12', '00']);

const onTimeRangeConfirm = (params: unknown[]) => {
  console.log('TimeRange confirm:', params);
};

// 受控模式
const controlledTab = ref(0);
const controlledDate = ref(['2024', '01', '01']);
const controlledTime = ref(['08', '00']);
</script>

<template>
  <DemoPage title="PickerGroup 选择器组">
    <!-- 选择日期时间 -->
    <view class="demo-picker-group-block">
      <text class="demo-picker-group-title">选择日期时间</text>
      <PickerGroup
        title="预约日期时间"
        :tabs="['选择日期', '选择时间']"
        @confirm="onDateTimeConfirm"
      >
        <Picker
          :columns="dateColumns"
          v-model="dateValue1"
          :show-toolbar="false"
        />
        <Picker
          :columns="[timeColumns[0], timeColumns[1]]"
          v-model="timeValue1"
          :show-toolbar="false"
        />
      </PickerGroup>
    </view>

    <!-- 下一步按钮 -->
    <view class="demo-picker-group-block">
      <text class="demo-picker-group-title">下一步按钮</text>
      <PickerGroup
        title="预约日期时间"
        :tabs="['选择日期', '选择时间']"
        next-step-text="下一步"
        @confirm="onNextStepConfirm"
      >
        <Picker
          :columns="dateColumns"
          v-model="dateValue2"
          :show-toolbar="false"
        />
        <Picker
          :columns="[timeColumns[0], timeColumns[1]]"
          v-model="timeValue2"
          :show-toolbar="false"
        />
      </PickerGroup>
    </view>

    <!-- 选择日期范围 -->
    <view class="demo-picker-group-block">
      <text class="demo-picker-group-title">选择日期范围</text>
      <PickerGroup
        title="预约日期"
        :tabs="['开始日期', '结束日期']"
        @confirm="onDateRangeConfirm"
      >
        <Picker
          :columns="dateColumns"
          v-model="startDate"
          :show-toolbar="false"
        />
        <Picker
          :columns="dateColumns"
          v-model="endDate"
          :show-toolbar="false"
        />
      </PickerGroup>
    </view>

    <!-- 选择时间范围 -->
    <view class="demo-picker-group-block">
      <text class="demo-picker-group-title">选择时间范围</text>
      <PickerGroup
        title="预约时间"
        :tabs="['开始时间', '结束时间']"
        @confirm="onTimeRangeConfirm"
      >
        <Picker
          :columns="[timeColumns[0], timeColumns[1]]"
          v-model="startTime"
          :show-toolbar="false"
        />
        <Picker
          :columns="[timeColumns[0], timeColumns[1]]"
          v-model="endTime"
          :show-toolbar="false"
        />
      </PickerGroup>
    </view>

    <!-- 受控模式 -->
    <view class="demo-picker-group-block">
      <text class="demo-picker-group-title">受控模式</text>
      <PickerGroup
        title="预约日期时间"
        :tabs="['选择日期', '选择时间']"
        v-model:active-tab="controlledTab"
      >
        <Picker
          :columns="dateColumns"
          v-model="controlledDate"
          :show-toolbar="false"
        />
        <Picker
          :columns="[timeColumns[0], timeColumns[1]]"
          v-model="controlledTime"
          :show-toolbar="false"
        />
      </PickerGroup>
      <view class="demo-picker-group-result">
        <text class="demo-picker-group-result-text">当前标签: {{ controlledTab }}</text>
      </view>
    </view>
  </DemoPage>
</template>

<style>
.demo-picker-group-block {
  display: flex;
  flex-direction: column;
}

.demo-picker-group-title {
  font-size: 14px;
  color: #969799;
  padding: 12px 16px 8px;
}

.demo-picker-group-result {
  padding: 8px 16px;
  background-color: #fff;
}

.demo-picker-group-result-text {
  font-size: 14px;
  color: #323233;
}
</style>
