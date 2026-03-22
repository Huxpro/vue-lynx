<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Picker from '../components/Picker/index.vue';

// 基础用法
const basicColumns = [
  [
    { text: '杭州', value: 'Hangzhou' },
    { text: '宁波', value: 'Ningbo' },
    { text: '温州', value: 'Wenzhou' },
    { text: '绍兴', value: 'Shaoxing' },
    { text: '湖州', value: 'Huzhou' },
  ],
];

// 双向绑定
const selectedValues = ref(['Wenzhou']);

// 多列选择
const multiColumns = [
  [
    { text: '周一', value: 'Monday' },
    { text: '周二', value: 'Tuesday' },
    { text: '周三', value: 'Wednesday' },
    { text: '周四', value: 'Thursday' },
    { text: '周五', value: 'Friday' },
  ],
  [
    { text: '上午', value: 'Morning' },
    { text: '下午', value: 'Afternoon' },
    { text: '晚上', value: 'Evening' },
  ],
];

// 级联选择
const cascadeColumns = [
  {
    text: '浙江',
    value: 'Zhejiang',
    children: [
      { text: '杭州', value: 'Hangzhou' },
      { text: '宁波', value: 'Ningbo' },
      { text: '温州', value: 'Wenzhou' },
    ],
  },
  {
    text: '福建',
    value: 'Fujian',
    children: [
      { text: '福州', value: 'Fuzhou' },
      { text: '厦门', value: 'Xiamen' },
    ],
  },
  {
    text: '广东',
    value: 'Guangdong',
    children: [
      { text: '广州', value: 'Guangzhou' },
      { text: '深圳', value: 'Shenzhen' },
      { text: '东莞', value: 'Dongguan' },
    ],
  },
];

// 禁用选项
const disabledColumns = [
  [
    { text: '杭州', value: 'Hangzhou' },
    { text: '宁波', value: 'Ningbo', disabled: true },
    { text: '温州', value: 'Wenzhou' },
  ],
];

// 自定义列字段名
const customFieldColumns = [
  [
    { cityName: '杭州', id: 1 },
    { cityName: '宁波', id: 2 },
    { cityName: '温州', id: 3 },
  ],
];
</script>

<template>
  <DemoPage title="Picker 选择器">
    <!-- 基础用法 -->
    <view class="demo-picker-block">
      <text class="demo-picker-title">基础用法</text>
      <Picker
        title="标题"
        :columns="basicColumns"
      />
    </view>

    <!-- 搭配弹出层使用 -->
    <view class="demo-picker-block">
      <text class="demo-picker-title">搭配弹出层使用</text>
      <text class="demo-picker-desc">在实际场景中，Picker 通常搭配 Popup 组件一起使用。</text>
    </view>

    <!-- 双向绑定 -->
    <view class="demo-picker-block">
      <text class="demo-picker-title">双向绑定</text>
      <Picker
        title="标题"
        :columns="basicColumns"
        v-model="selectedValues"
      />
      <view class="demo-picker-result">
        <text class="demo-picker-result-text">当前值：{{ selectedValues.join(', ') }}</text>
      </view>
    </view>

    <!-- 多列选择 -->
    <view class="demo-picker-block">
      <text class="demo-picker-title">多列选择</text>
      <Picker
        title="标题"
        :columns="multiColumns"
      />
    </view>

    <!-- 级联选择 -->
    <view class="demo-picker-block">
      <text class="demo-picker-title">级联选择</text>
      <Picker
        title="标题"
        :columns="cascadeColumns"
      />
    </view>

    <!-- 禁用选项 -->
    <view class="demo-picker-block">
      <text class="demo-picker-title">禁用选项</text>
      <Picker
        title="标题"
        :columns="disabledColumns"
      />
    </view>

    <!-- 加载状态 -->
    <view class="demo-picker-block">
      <text class="demo-picker-title">加载状态</text>
      <Picker
        title="标题"
        :columns="basicColumns"
        :loading="true"
      />
    </view>

    <!-- 自定义列字段名 -->
    <view class="demo-picker-block">
      <text class="demo-picker-title">自定义列字段名</text>
      <Picker
        title="标题"
        :columns="customFieldColumns"
        :columns-field-names="{ text: 'cityName', value: 'id' }"
      />
    </view>
  </DemoPage>
</template>

<style>
.demo-picker-block {
  display: flex;
  flex-direction: column;
}

.demo-picker-title {
  font-size: 14px;
  color: #969799;
  padding: 12px 16px 8px;
}

.demo-picker-desc {
  font-size: 14px;
  color: #969799;
  padding: 0 16px 8px;
}

.demo-picker-result {
  padding: 8px 16px;
  background-color: #fff;
}

.demo-picker-result-text {
  font-size: 14px;
  color: #323233;
}
</style>
