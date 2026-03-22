<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Progress from '../components/Progress/index.vue';
import Button from '../components/Button/index.vue';

const percentage = ref(50);

function add() {
  percentage.value = Math.min(100, percentage.value + 20);
}
function reduce() {
  percentage.value = Math.max(0, percentage.value - 20);
}

const sectionTitleStyle = {
  fontSize: '14px',
  color: '#969799',
  paddingTop: '16px',
  paddingBottom: '8px',
  paddingLeft: '16px',
};
const progressWrap = {
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '5px',
  paddingBottom: '20px',
  backgroundColor: '#fff',
};
</script>

<template>
  <DemoPage title="Progress">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="sectionTitleStyle">基础用法</text>
      <view :style="progressWrap">
        <Progress :percentage="50" />
      </view>

      <!-- Stroke Width -->
      <text :style="sectionTitleStyle">线条粗细</text>
      <view :style="progressWrap">
        <Progress :percentage="50" stroke-width="8" />
      </view>

      <!-- Inactive -->
      <text :style="sectionTitleStyle">置灰</text>
      <view :style="progressWrap">
        <Progress :percentage="50" inactive />
      </view>

      <!-- Custom Style -->
      <text :style="sectionTitleStyle">样式定制</text>
      <view :style="progressWrap">
        <Progress :percentage="25" color="#f2826a" pivot-text="橙色" />
        <view :style="{ height: '20px' }" />
        <Progress :percentage="50" color="#ee0a24" pivot-text="红色" />
        <view :style="{ height: '20px' }" />
        <Progress :percentage="75" pivot-color="#7232dd" color="linear-gradient(to right, #be99ff, #7232dd)" pivot-text="紫色" />
      </view>

      <!-- Pivot Slot -->
      <text :style="sectionTitleStyle">进度插槽内容</text>
      <view :style="progressWrap">
        <Progress :percentage="percentage">
          <template #pivot="{ percentage: value }">
            <text :style="{ fontSize: '10px', color: '#fff' }">🔥 {{ value }}%</text>
          </template>
        </Progress>
      </view>

      <!-- Transition -->
      <text :style="sectionTitleStyle">过渡效果</text>
      <view :style="progressWrap">
        <Progress :percentage="percentage" />
        <view :style="{ display: 'flex', flexDirection: 'row', marginTop: '15px' }">
          <Button type="primary" size="small" @tap="add">增加</Button>
          <view :style="{ width: '10px' }" />
          <Button type="danger" size="small" @tap="reduce">减少</Button>
        </view>
      </view>
    </view>
  </DemoPage>
</template>
