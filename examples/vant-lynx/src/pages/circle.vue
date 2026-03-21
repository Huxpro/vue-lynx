<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Circle from '../components/Circle/index.vue';
const rate1 = ref(70);
const rate2 = ref(50);
const rate3 = ref(80);
</script>

<template>
  <DemoPage title="Circle">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <Circle :current-rate="rate1" :rate="100" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <Circle :current-rate="rate2" :rate="100" color="#07c160" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Size</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <Circle :current-rate="rate3" :rate="100" :size="120" color="#7232dd" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Stroke Width</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <Circle :current-rate="rate1" :rate="100" :stroke-width="6" color="#ee0a24" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Text</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <Circle :current-rate="rate2" :rate="100" text="Custom" color="#1989fa" />
      </view>
    </view>
  </DemoPage>
</template>
