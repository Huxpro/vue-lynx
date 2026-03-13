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
  >
    <view class="scrollbar-effect glow" />
  </view>
</template>
