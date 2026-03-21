<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface SpaceProps {
  direction?: 'horizontal' | 'vertical';
  size?: string | number;
  align?: 'start' | 'end' | 'center' | 'baseline';
  wrap?: boolean;
  fill?: boolean;
}

const props = withDefaults(defineProps<SpaceProps>(), {
  direction: 'horizontal',
  size: 8,
  wrap: false,
  fill: false,
});

const gap = computed(() => {
  if (typeof props.size === 'string') return parseInt(props.size, 10) || 8;
  return props.size;
});

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.direction === 'vertical' ? ('column' as const) : ('row' as const),
  alignItems: props.align || (props.direction === 'horizontal' ? 'center' : undefined),
  flexWrap: props.wrap ? ('wrap' as const) : ('nowrap' as const),
  gap: gap.value,
}));
</script>

<template>
  <view :style="containerStyle">
    <slot />
  </view>
</template>
