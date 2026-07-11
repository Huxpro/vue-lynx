<script setup lang="ts">
import { computed } from 'vue-lynx';

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
});
</script>

<template>
  <view class="flex-1 flex flex-col items-center justify-center">
    <text class="text-3xl font-bold text-highlighted">{{ greeting }}</text>
  </view>
</template>
