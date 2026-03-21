<script setup lang="ts">
import { computed, provide, toRef } from 'vue-lynx';

export interface GridProps {
  columnNum?: number;
  iconSize?: number;
  gutter?: number;
  border?: boolean;
  center?: boolean;
  square?: boolean;
  clickable?: boolean;
}

const props = withDefaults(defineProps<GridProps>(), {
  columnNum: 4,
  iconSize: 28,
  gutter: 0,
  border: true,
  center: true,
  square: false,
  clickable: false,
});

provide('grid', {
  columnNum: toRef(props, 'columnNum'),
  iconSize: toRef(props, 'iconSize'),
  gutter: toRef(props, 'gutter'),
  border: toRef(props, 'border'),
  center: toRef(props, 'center'),
  square: toRef(props, 'square'),
  clickable: toRef(props, 'clickable'),
});

const gridStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  flexWrap: 'wrap' as const,
  borderTopWidth: props.border && !props.gutter ? 0.5 : 0,
  borderTopStyle: 'solid' as const,
  borderTopColor: '#ebedf0',
  borderLeftWidth: props.border && !props.gutter ? 0.5 : 0,
  borderLeftStyle: 'solid' as const,
  borderLeftColor: '#ebedf0',
}));
</script>

<template>
  <view :style="gridStyle">
    <slot />
  </view>
</template>
