<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import FloatingBubble from '../components/FloatingBubble/index.vue';
</script>

<template>
  <DemoPage title="FloatingBubble">
    

    <view :style="{ padding: 16 }">
      <text :style="{ fontSize: 14, color: '#969799' }">A draggable floating bubble</text>
    </view>

    <FloatingBubble axis="xy" />
  </DemoPage>
</template>
