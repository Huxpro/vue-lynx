<script setup lang="ts">
import { computed, provide } from 'vue-lynx';

export interface ActionBarProps {
  safeAreaInsetBottom?: boolean;
}

const props = withDefaults(defineProps<ActionBarProps>(), {
  safeAreaInsetBottom: true,
});

provide('actionBar', {
  safeAreaInsetBottom: props.safeAreaInsetBottom,
});

const barStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  height: 50,
  backgroundColor: '#fff',
  position: 'fixed' as const,
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  borderTopWidth: 0.5,
  borderTopStyle: 'solid' as const,
  borderTopColor: '#ebedf0',
  paddingBottom: props.safeAreaInsetBottom ? 0 : 0,
}));
</script>

<template>
  <view :style="barStyle">
    <slot />
  </view>
</template>
