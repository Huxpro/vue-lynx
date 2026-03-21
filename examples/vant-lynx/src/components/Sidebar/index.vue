<script setup lang="ts">
import { computed, provide, toRef } from 'vue-lynx';

export interface SidebarProps {
  modelValue?: number;
}

const props = withDefaults(defineProps<SidebarProps>(), {
  modelValue: 0,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

function setActive(index: number) {
  if (index !== props.modelValue) {
    emit('update:modelValue', index);
    emit('change', index);
  }
}

provide('sidebar', {
  modelValue: toRef(props, 'modelValue'),
  setActive,
});

const sidebarStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  width: 80,
  backgroundColor: '#f7f8fa',
  overflow: 'hidden',
}));
</script>

<template>
  <view :style="sidebarStyle">
    <slot />
  </view>
</template>
