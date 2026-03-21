<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import VanImage from '../components/Image/index.vue';
const imgSrc = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg';
const fitModes = ['contain', 'cover', 'fill', 'none', 'scale-down'] as const;
</script>

<template>
  <DemoPage title="Image">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :src="imgSrc" :width="100" :height="100" />
      </view>

      <!-- Fit Mode -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Fit Mode</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view v-for="mode in fitModes" :key="mode" :style="{ marginRight: 8, marginBottom: 8, alignItems: 'center', display: 'flex', flexDirection: 'column' }">
          <VanImage :src="imgSrc" :width="80" :height="80" :fit="mode" />
          <text :style="{ fontSize: 12, color: '#969799', marginTop: 4 }">{{ mode }}</text>
        </view>
      </view>

      <!-- Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Position</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view v-for="pos in ['left', 'center', 'right', 'top', 'bottom']" :key="pos" :style="{ marginRight: 8, marginBottom: 8, alignItems: 'center', display: 'flex', flexDirection: 'column' }">
          <VanImage :src="imgSrc" :width="80" :height="80" fit="cover" :position="pos" />
          <text :style="{ fontSize: 12, color: '#969799', marginTop: 4 }">{{ pos }}</text>
        </view>
      </view>

      <!-- Round -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Round</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view v-for="mode in fitModes" :key="mode" :style="{ marginRight: 8, marginBottom: 8, alignItems: 'center', display: 'flex', flexDirection: 'column' }">
          <VanImage :src="imgSrc" :width="80" :height="80" :fit="mode" round />
          <text :style="{ fontSize: 12, color: '#969799', marginTop: 4 }">{{ mode }}</text>
        </view>
      </view>

      <!-- Custom Radius -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Radius</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :src="imgSrc" :width="100" :height="100" :radius="8" />
      </view>

      <!-- Loading -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Loading</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :width="100" :height="100" />
      </view>

      <!-- Error -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Error</text>
      <view :style="{ display: 'flex', flexDirection: 'row' }">
        <VanImage src="https://invalid-url-for-error" :width="100" :height="100" />
      </view>
    </view>
  </DemoPage>
</template>
