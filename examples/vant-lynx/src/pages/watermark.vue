<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Watermark from '../components/Watermark/index.vue';
</script>

<template>
  <DemoPage title="Watermark">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Text Watermark -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Text Watermark</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, height: 200, position: 'relative', overflow: 'hidden' }">
        <text :style="{ fontSize: 14, color: '#323233' }">This area has a text watermark overlay. The watermark helps protect content from unauthorized use.</text>
        <Watermark content="Vant Lynx" :full-page="false" :opacity="0.1" />
      </view>

      <!-- Custom Style -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Style</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, height: 200, position: 'relative', overflow: 'hidden' }">
        <text :style="{ fontSize: 14, color: '#323233' }">Watermark with custom font size, color and rotation angle.</text>
        <Watermark
          content="Custom"
          :full-page="false"
          :font-size="18"
          font-color="#1989fa"
          :rotate="-30"
          :opacity="0.12"
        />
      </view>

      <!-- Custom Gap -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Gap</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, height: 200, position: 'relative', overflow: 'hidden' }">
        <text :style="{ fontSize: 14, color: '#323233' }">Watermark with custom gap between items.</text>
        <Watermark
          content="Gap"
          :full-page="false"
          :gap-x="50"
          :gap-y="50"
          :opacity="0.15"
        />
      </view>
    </view>
  </DemoPage>
</template>
