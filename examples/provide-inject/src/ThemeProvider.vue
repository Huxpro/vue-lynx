<script setup lang="ts">
// This intermediate component does NOT pass any props down.
// It demonstrates that provide/inject skips the middle layer.
import ThemedCard from './ThemedCard.vue';
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', gap: 8 }">
    <ThemedCard label="Card A" />
    <ThemedCard label="Card B" />
  </view>
</template>
