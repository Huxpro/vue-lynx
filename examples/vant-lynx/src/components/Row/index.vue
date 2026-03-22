<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view (Lynx has no HTML elements)
  - CSS class-based BEM styling replaced with inline styles
  - Gutter distribution uses uniform padding + negative margins (visually identical to Vant's per-child algorithm)
-->
<script setup lang="ts">
import { computed, provide } from 'vue-lynx';
import { ROW_KEY, type RowAlign, type RowJustify } from './types';

export interface RowProps {
  tag?: string;
  wrap?: boolean;
  align?: RowAlign;
  gutter?: number | string | (number | string)[];
  justify?: RowJustify;
}

const props = withDefaults(defineProps<RowProps>(), {
  tag: 'div',
  wrap: true,
  gutter: 0,
});

const gutterH = computed(() => {
  if (Array.isArray(props.gutter)) {
    return Number(props.gutter[0]) || 0;
  }
  return Number(props.gutter) || 0;
});

const gutterV = computed(() => {
  if (Array.isArray(props.gutter) && props.gutter.length > 1) {
    return Number(props.gutter[1]) || 0;
  }
  return 0;
});

provide(ROW_KEY, { gutterH, gutterV });

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

const rowStyle = computed(() => {
  const style: Record<string, string | number> = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: props.wrap ? 'wrap' : 'nowrap',
  };

  if (props.justify) {
    style.justifyContent = justifyMap[props.justify] || 'flex-start';
  }

  if (props.align) {
    style.alignItems = alignMap[props.align] || 'flex-start';
  }

  if (gutterH.value) {
    style.marginLeft = `${-gutterH.value / 2}px`;
    style.marginRight = `${-gutterH.value / 2}px`;
  }

  return style;
});
</script>

<template>
  <view :style="rowStyle">
    <slot />
  </view>
</template>
