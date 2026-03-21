<script setup lang="ts">
import { computed, provide } from 'vue-lynx';

export interface RowProps {
  gutter?: number | string;
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
  align?: 'top' | 'center' | 'bottom';
  wrap?: boolean;
}

const props = withDefaults(defineProps<RowProps>(), {
  gutter: 0,
  justify: 'start',
  align: 'top',
  wrap: true,
});

const gutterValue = computed(() => {
  if (typeof props.gutter === 'string') return parseInt(props.gutter, 10) || 0;
  return props.gutter;
});

provide('rowGutter', gutterValue);

const justifyMap: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  'space-around': 'space-around',
  'space-between': 'space-between',
};

const alignMap: Record<string, string> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
};

const rowStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  flexWrap: props.wrap ? ('wrap' as const) : ('nowrap' as const),
  justifyContent: justifyMap[props.justify] || 'flex-start',
  alignItems: alignMap[props.align] || 'flex-start',
  marginLeft: gutterValue.value ? -gutterValue.value / 2 : 0,
  marginRight: gutterValue.value ? -gutterValue.value / 2 : 0,
}));
</script>

<template>
  <view :style="rowStyle">
    <slot />
  </view>
</template>
