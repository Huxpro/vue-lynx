<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Progress from '../components/Progress/index.vue';
const percentage = ref(50);
</script>

<template>
  <DemoPage title="Progress">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="50" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Stroke Width</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="50" :stroke-width="8" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Inactive</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="50" :show-pivot="false" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="25" color="#ee0a24" />
        <view :style="{ height: 12 }" />
        <Progress :percentage="50" color="#7232dd" />
        <view :style="{ height: 12 }" />
        <Progress :percentage="75" color="#07c160" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Pivot Text</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="percentage" pivot-text="Orange" color="#f2826a" />
      </view>
    </view>
  </DemoPage>
</template>
