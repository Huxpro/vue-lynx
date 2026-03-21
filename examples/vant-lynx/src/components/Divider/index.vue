<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface DividerProps {
  contentPosition?: 'left' | 'center' | 'right';
  dashed?: boolean;
  hairline?: boolean;
}

const props = withDefaults(defineProps<DividerProps>(), {
  contentPosition: 'center',
  dashed: false,
  hairline: true,
});

const lineStyle = computed(() => ({
  flex: 1,
  height: 0,
  borderTopWidth: props.hairline ? 0.5 : 1,
  borderTopStyle: props.dashed ? ('dashed' as const) : ('solid' as const),
  borderTopColor: '#ebedf0',
}));
</script>

<template>
  <view :style="{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
  }">
    <view :style="{ ...lineStyle, marginRight: contentPosition === 'left' ? 16 : (contentPosition === 'right' ? 0 : 16), flex: contentPosition === 'left' ? 'none' : 1, width: contentPosition === 'left' ? 32 : undefined }" />
    <slot />
    <view :style="{ ...lineStyle, marginLeft: contentPosition === 'right' ? 16 : (contentPosition === 'left' ? 0 : 16), flex: contentPosition === 'right' ? 'none' : 1, width: contentPosition === 'right' ? 32 : undefined }" />
  </view>
</template>
