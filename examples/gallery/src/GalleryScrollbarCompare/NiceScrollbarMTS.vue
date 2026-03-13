<script setup lang="ts">
import type { MainThreadRef } from 'vue-lynx';

defineProps<{
  thumbRef: MainThreadRef;
}>();
</script>

<template>
  <view
    class="scrollbar"
    :main-thread-ref="thumbRef"
    :style="{
      right: '14px',
      backgroundColor: 'darkkhaki',
      height: '60px',
      top: '0px',
    }"
  >
    <view class="scrollbar-effect glow" />
  </view>
</template>
