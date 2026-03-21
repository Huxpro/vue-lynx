<!--
  Vant Feature Parity Report:
  - Props: 5/5 supported (gutter, tag, justify, align, wrap)
  - Events: 1/1 (click)
  - Slots: 1/1 (default)
  - provide/inject: rowGutter provided to Col children
  - Lynx Limitations:
    - tag: accepted for API compat but always renders as view
    - Array gutter [horizontal, vertical] supported
-->
<script setup lang="ts">
import { computed, provide } from 'vue-lynx';

export interface RowProps {
  gutter?: number | string | (number | string)[];
  tag?: string;
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
  align?: 'top' | 'center' | 'bottom';
  wrap?: boolean;
}

const props = withDefaults(defineProps<RowProps>(), {
  gutter: 0,
  tag: 'div',
  justify: 'start',
  align: 'top',
  wrap: true,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const gutterH = computed(() => {
  if (Array.isArray(props.gutter)) {
    const v = props.gutter[0];
    return typeof v === 'string' ? parseInt(v, 10) || 0 : v;
  }
  if (typeof props.gutter === 'string') return parseInt(props.gutter, 10) || 0;
  return props.gutter;
});

const gutterV = computed(() => {
  if (Array.isArray(props.gutter)) {
    const v = props.gutter[1] ?? 0;
    return typeof v === 'string' ? parseInt(v, 10) || 0 : v;
  }
  return 0;
});

provide('rowGutter', gutterH);
provide('rowGutterV', gutterV);

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
  marginLeft: gutterH.value ? -gutterH.value / 2 : 0,
  marginRight: gutterH.value ? -gutterH.value / 2 : 0,
}));

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view :style="rowStyle" @tap="onTap">
    <slot />
  </view>
</template>
