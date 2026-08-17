<!--
  Vant Feature Parity Report:
  - Props: 9/9 supported (columnNum, iconSize, gutter, border, center, square, clickable, direction, reverse)
  - Slots: 1/1 supported (default)
  - provide/inject: Provides grid config + child index registration to GridItem children
  - Gutter handling: paddingLeft on Grid, paddingRight + conditional marginTop on items (matches Vant)
  - Border: Top+Left hairline borders on Grid when border=true and no gutter (items add Right+Bottom)
  - Gaps:
    - No CSS variable theming (Lynx uses inline styles)
    - No HTML tag switching (Lynx always uses view elements)
-->
<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue-lynx';

export type GridDirection = 'horizontal' | 'vertical';

export interface GridProps {
  /** Number of columns per row */
  columnNum?: number;
  /** Icon size for grid items (px) */
  iconSize?: number | string;
  /** Gutter spacing between items (px) */
  gutter?: number | string;
  /** Whether to show border */
  border?: boolean;
  /** Whether to center content in items */
  center?: boolean;
  /** Whether items are square (1:1 aspect ratio) */
  square?: boolean;
  /** Whether items are clickable (adds active feedback) */
  clickable?: boolean;
  /** Layout direction for item content: 'vertical' (icon above text) or 'horizontal' (icon beside text) */
  direction?: GridDirection;
  /** Whether to reverse item content order (text before icon) */
  reverse?: boolean;
}

const props = withDefaults(defineProps<GridProps>(), {
  columnNum: 4,
  iconSize: 28,
  gutter: 0,
  border: true,
  center: true,
  square: false,
  clickable: false,
  direction: 'vertical',
  reverse: false,
});

// Child index counter: each GridItem calls registerChild() on setup to get its index.
// This mirrors Vant's useChildren/useParent pattern for index-based gutter logic.
const childCount = ref(0);

function registerChild(): number {
  return childCount.value++;
}

provide('grid', {
  columnNum: toRef(props, 'columnNum'),
  iconSize: toRef(props, 'iconSize'),
  gutter: toRef(props, 'gutter'),
  border: toRef(props, 'border'),
  center: toRef(props, 'center'),
  square: toRef(props, 'square'),
  clickable: toRef(props, 'clickable'),
  direction: toRef(props, 'direction'),
  reverse: toRef(props, 'reverse'),
  registerChild,
});

/** Parse a numeric or string gutter value to a number (px) */
function parseGutter(val: number | string): number {
  if (typeof val === 'number') return val;
  return parseFloat(val) || 0;
}

const gridStyle = computed(() => {
  const gutterNum = parseGutter(props.gutter);
  const hasBorder = props.border && !gutterNum;

  return {
    display: 'flex',
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    // Vant applies paddingLeft equal to gutter on the Grid wrapper.
    // Each item then has paddingRight = gutter, creating even spacing.
    paddingLeft: gutterNum || 0,
    // Hairline border on top and left edges (items provide right and bottom)
    borderTopWidth: hasBorder ? 0.5 : 0,
    borderTopStyle: 'solid' as const,
    borderTopColor: '#ebedf0',
    borderLeftWidth: hasBorder ? 0.5 : 0,
    borderLeftStyle: 'solid' as const,
    borderLeftColor: '#ebedf0',
  };
});
</script>

<template>
  <view :style="gridStyle">
    <slot />
  </view>
</template>
