<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import FloatingPanel from '../components/FloatingPanel/index.vue';
</script>

<template>
  <DemoPage title="FloatingPanel">
    

    <view :style="{ padding: 16 }">
      <text :style="{ fontSize: 14, color: '#969799' }">Drag the handle below to resize the panel</text>
    </view>

    <FloatingPanel :anchors="[100, 250, 400]" :height="100">
      <view :style="{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text :style="{ fontSize: 14, color: '#323233' }">Panel Content</text>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Drag the handle to resize</text>
      </view>
    </FloatingPanel>
  </DemoPage>
</template>
