<!--
  Lynx Limitations:
  - tag prop: not supported (Lynx always uses view elements)
  - CSS class-based BEM styling: replaced with inline styles
  - ::after pseudo-element borders: replaced with inline border styles
-->
<script setup lang="ts">
import { computed, provide, ref } from 'vue-lynx';
import { GRID_KEY, type GridDirection } from './types';

const addUnit = (value?: string | number): string | undefined => {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'number' ? `${value}px` : String(value);
};

export interface GridProps {
  square?: boolean;
  center?: boolean;
  border?: boolean;
  gutter?: number | string;
  reverse?: boolean;
  iconSize?: number | string;
  direction?: GridDirection;
  clickable?: boolean;
  columnNum?: number | string;
}

const props = withDefaults(defineProps<GridProps>(), {
  square: false,
  center: true,
  border: true,
  reverse: false,
  clickable: false,
  columnNum: 4,
});

// Child index registration (mirrors Vant's useChildren/useParent index)
const childCount = ref(0);
function registerChild(): number {
  return childCount.value++;
}

provide(GRID_KEY, { props, registerChild });

const gridStyle = computed(() => {
  const style: Record<string, any> = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  };

  if (props.gutter) {
    style.paddingLeft = addUnit(props.gutter);
  }

  if (props.border && !props.gutter) {
    style.borderTopWidth = 0.5;
    style.borderTopStyle = 'solid';
    style.borderTopColor = '#ebedf0';
    style.borderLeftWidth = 0.5;
    style.borderLeftStyle = 'solid';
    style.borderLeftColor = '#ebedf0';
  }

  return style;
});
</script>

<template>
  <view :style="gridStyle">
    <slot />
  </view>
</template>
