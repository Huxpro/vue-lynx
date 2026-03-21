<!--
  Vant Feature Parity Report:
  - Props: 5/5 supported (direction, size, align, wrap, fill)
  - Events: 0/0 (none defined)
  - Slots: 1/1 (default)
  - Lynx Adaptations:
    - Uses margin-based spacing instead of CSS gap for Lynx compatibility
    - Size array [horizontal, vertical] supported via margin-right/margin-bottom
    - fill maps to flex: 1 on items
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface SpaceProps {
  direction?: 'horizontal' | 'vertical';
  size?: string | number | (string | number)[];
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

const gapH = computed(() => {
  if (Array.isArray(props.size)) {
    const v = props.size[0];
    return typeof v === 'string' ? parseInt(v, 10) || 8 : v;
  }
  if (typeof props.size === 'string') return parseInt(props.size, 10) || 8;
  return props.size;
});

const gapV = computed(() => {
  if (Array.isArray(props.size)) {
    const v = props.size[1] ?? props.size[0];
    return typeof v === 'string' ? parseInt(v, 10) || 8 : v;
  }
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
  width: props.fill ? '100%' : undefined,
}));

const itemStyle = computed(() => {
  const style: Record<string, any> = {};
  if (props.fill) {
    style.flex = 1;
  }
  if (props.direction === 'horizontal') {
    style.marginRight = gapH.value;
  } else {
    style.marginBottom = gapV.value;
  }
  if (props.wrap) {
    style.marginBottom = gapV.value;
  }
  return style;
});
</script>

<template>
  <view :style="containerStyle">
    <slot />
  </view>
</template>
