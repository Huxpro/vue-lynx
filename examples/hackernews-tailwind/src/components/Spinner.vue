<script setup lang="ts">
defineProps<{
  show: boolean;
}>();
</script>

<template>
  <view
    v-if="show"
    :style="{
      width: '28px',
      height: '28px',
      borderRadius: '14px',
      borderWidth: '3px',
      borderColor: '#eee',
      borderTopColor: '#3eaf7c',
      animationName: 'spin',
      animationDuration: '0.8s',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    }"
  />
</template>

<style>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
