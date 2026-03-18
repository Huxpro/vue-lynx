<script setup lang="ts">
defineProps<{
  size: number
  posX: number
  posY: number
}>()
</script>

<template>
  <view
    :style="{
      height: `${size}px`,
      width: `${size}px`,
      backgroundColor: 'lightskyblue',
      transform: `translate(${posX}px, ${posY}px)`,
    }"
  >
    <text :style="{ fontSize: '12px', color: '#333' }">BGDraggable</text>
  </view>
</template>
