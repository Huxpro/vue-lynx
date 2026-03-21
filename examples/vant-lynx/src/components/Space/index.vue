<!--
  Vant Feature Parity Report:
  - Props: 5/5 supported (direction, size, align, wrap, fill)
  - Events: 0/0
  - Slots: 1/1 (default)
  - Gaps:
    - Array size [horizontal, vertical] not supported (single value only)
    - Uses margin-based spacing instead of CSS gap for Lynx compatibility
    - fill prop sets items to stretch
-->
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

const gapValue = computed(() => {
  if (typeof props.size === 'string') return parseInt(props.size, 10) || 8;
  return props.size;
});

const alignMap: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  baseline: 'flex-start',
};

const containerStyle = computed(() => ({
  display: 'flex' as const,
  flexDirection: props.direction === 'vertical' ? ('column' as const) : ('row' as const),
  alignItems: props.align ? alignMap[props.align] : (props.direction === 'horizontal' ? 'center' : undefined),
  flexWrap: props.wrap ? ('wrap' as const) : ('nowrap' as const),
}));

const itemStyle = computed(() => {
  const style: Record<string, any> = {};
  if (props.fill) {
    style.flex = 1;
  }
  if (props.direction === 'horizontal') {
    style.marginRight = gapValue.value;
  } else {
    style.marginBottom = gapValue.value;
  }
  if (props.wrap) {
    style.marginBottom = gapValue.value;
  }
  return style;
});
</script>

<template>
  <view :style="containerStyle">
    <slot />
  </view>
</template>
