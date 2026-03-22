<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Circle from '../components/Circle/index.vue';
import Button from '../components/Button/index.vue';

const rate = ref(70);
const currentRate1 = ref(70);
const currentRate2 = ref(70);
const currentRate3 = ref(70);
const currentRate4 = ref(70);

const gradientColor = {
  '0%': '#3fecff',
  '100%': '#6149f6',
};

function add() {
  rate.value = Math.min(100, rate.value + 20);
}
function reduce() {
  rate.value = Math.max(0, rate.value - 20);
}

const sectionTitleStyle = {
  fontSize: '14px',
  color: '#969799',
  paddingTop: '16px',
  paddingBottom: '8px',
  paddingLeft: '16px',
};
const rowStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  paddingLeft: '16px',
  paddingBottom: '16px',
  backgroundColor: '#fff',
};
</script>

<template>
  <DemoPage title="Circle">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage 基础用法 -->
      <text :style="sectionTitleStyle">基础用法</text>
      <view :style="rowStyle">
        <Circle
          v-model:current-rate="currentRate1"
          :rate="rate"
          :speed="100"
          :text="`${Math.round(currentRate1)}%`"
        />
      </view>

      <!-- Custom Style 样式定制 -->
      <text :style="sectionTitleStyle">样式定制</text>
      <view :style="{ ...rowStyle, flexWrap: 'wrap' }">
        <Circle
          v-model:current-rate="currentRate3"
          :rate="rate"
          :speed="100"
          :stroke-width="60"
          text="宽度定制"
        />
        <view :style="{ width: '16px' }" />
        <Circle
          v-model:current-rate="currentRate3"
          color="#ee0a24"
          :rate="rate"
          layer-color="#ebedf0"
          :speed="100"
          text="颜色定制"
        />
        <view :style="{ width: '16px' }" />
        <Circle
          v-model:current-rate="currentRate2"
          :rate="rate"
          :speed="100"
          :color="gradientColor"
          text="渐变色"
        />
      </view>

      <view :style="{ ...rowStyle, paddingTop: '16px' }">
        <Circle
          v-model:current-rate="currentRate4"
          color="#07c160"
          :rate="rate"
          :speed="100"
          :clockwise="false"
          text="逆时针"
        />
        <view :style="{ width: '16px' }" />
        <Circle
          v-model:current-rate="currentRate4"
          color="#7232dd"
          :rate="rate"
          :speed="100"
          size="120px"
          text="大小定制"
        />
      </view>

      <view :style="{ display: 'flex', flexDirection: 'row', paddingLeft: '16px', paddingTop: '8px', paddingBottom: '16px', backgroundColor: '#fff' }">
        <Button type="primary" size="small" @tap="add">增加</Button>
        <view :style="{ width: '10px' }" />
        <Button type="danger" size="small" @tap="reduce">减少</Button>
      </view>

      <!-- Start Position 起始位置 -->
      <text :style="sectionTitleStyle">起始位置</text>
      <view :style="rowStyle">
        <Circle :current-rate="75" :rate="100" text="左侧" start-position="left" />
        <view :style="{ width: '16px' }" />
        <Circle :current-rate="75" :rate="100" text="右侧" start-position="right" />
        <view :style="{ width: '16px' }" />
        <Circle :current-rate="75" :rate="100" text="底部" start-position="bottom" />
      </view>
    </view>
  </DemoPage>
</template>
