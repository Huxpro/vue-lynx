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
        <Progress :percentage="50" inactive />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Hide Pivot</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="50" :show-pivot="false" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="25" color="#ee0a24" />
        <view :style="{ height: 20 }" />
        <Progress :percentage="50" color="#7232dd" />
        <view :style="{ height: 20 }" />
        <Progress :percentage="75" color="#07c160" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Pivot</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="percentage" pivot-text="Orange" color="#f2826a" />
        <view :style="{ height: 20 }" />
        <Progress :percentage="percentage" pivot-color="#ee0a24" color="#f2826a" />
        <view :style="{ height: 20 }" />
        <Progress :percentage="percentage" text-color="#f2826a" color="#f2826a" pivot-color="#fff" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Pivot Content</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Progress :percentage="percentage" color="#07c160">
          <template #pivot="{ percentage: pct }">
            <text :style="{ fontSize: 10, color: '#fff' }">{{ pct }}%</text>
          </template>
        </Progress>
        <view :style="{ height: 20 }" />
        <Progress :percentage="percentage" color="#ee0a24" pivot-color="#ee0a24">
          <template #pivot>
            <text :style="{ fontSize: 10, color: '#fff' }">Done</text>
          </template>
        </Progress>
      </view>
    </view>
  </DemoPage>
</template>
