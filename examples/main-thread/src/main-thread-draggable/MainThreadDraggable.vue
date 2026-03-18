<script setup lang="ts">
import type { MainThreadRef } from 'vue-lynx'

defineProps<{
  size: number
  mtRef: MainThreadRef
}>()
</script>

<template>
  <view
    :main-thread-ref="mtRef"
    :style="{
      height: `${size}px`,
      width: `${size}px`,
      backgroundColor: 'lightskyblue',
      transform: 'translate(0px, 500px)',
    }"
  >
    <text :style="{ fontSize: '12px', color: '#333' }">MTDraggable</text>
  </view>
</template>
