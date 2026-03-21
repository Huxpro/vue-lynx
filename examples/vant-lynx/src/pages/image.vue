<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import VanImage from '../components/Image/index.vue';
const imgSrc = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg';
</script>

<template>
  <DemoPage title="Image">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :src="imgSrc" :width="100" :height="100" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Round</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :src="imgSrc" :width="100" :height="100" round />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Radius</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :src="imgSrc" :width="100" :height="100" :radius="8" />
      </view>
    </view>
  </DemoPage>
</template>
