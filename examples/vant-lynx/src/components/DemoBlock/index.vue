<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <view :style="{ marginBottom: '16px' }">
    <text
      :style="{
        fontSize: '14px',
        color: '#969799',
        marginBottom: '12px',
        paddingLeft: '16px',
      }"
    >{{ title }}</text>
    <slot />
  </view>
</template>
