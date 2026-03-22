<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ConfigProvider from '../components/ConfigProvider/index.vue';
import Cell from '../components/Cell/index.vue';
import Rate from '../components/Rate/index.vue';
import Slider from '../components/Slider/index.vue';
import Button from '../components/Button/index.vue';

const rate = ref(4);
const slider = ref(50);

const themeVars = {
  rateIconFullColor: '#07c160',
  sliderBarHeight: '4px',
  sliderButtonWidth: '20px',
  sliderButtonHeight: '20px',
  sliderActiveBackground: '#07c160',
  buttonPrimaryBackground: '#07c160',
  buttonPrimaryBorderColor: '#07c160',
};
</script>

<template>
  <DemoPage title="ConfigProvider 全局配置">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">

      <!-- Section 1: 深色模式 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">深色模式</text>
      <Cell title="请点击右上角按钮，切换深浅模式。" />

      <!-- Section 2: 默认主题 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px', marginTop: '16px' }">默认主题</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }">
        <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
          <text :style="{ fontSize: '14px', color: '#646566' }">评分</text>
          <Rate v-model="rate" />
        </view>
        <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
          <text :style="{ fontSize: '14px', color: '#646566' }">滑块</text>
          <view :style="{ flex: 1, marginLeft: '12px' }">
            <Slider v-model="slider" />
          </view>
        </view>
        <Button type="primary" round block>提交</Button>
      </view>

      <!-- Section 3: 定制主题 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">定制主题</text>
      <ConfigProvider :theme-vars="themeVars">
        <view :style="{ backgroundColor: '#fff', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }">
          <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
            <text :style="{ fontSize: '14px', color: '#646566' }">评分</text>
            <Rate v-model="rate" />
          </view>
          <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }">
            <text :style="{ fontSize: '14px', color: '#646566' }">滑块</text>
            <view :style="{ flex: 1, marginLeft: '12px' }">
              <Slider v-model="slider" />
            </view>
          </view>
          <Button type="primary" round block>提交</Button>
        </view>
      </ConfigProvider>

    </view>
  </DemoPage>
</template>
