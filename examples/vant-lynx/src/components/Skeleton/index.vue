<!--
  Lynx Limitations:
  - CSS @keyframes animation: Lynx has no @keyframes support, shimmer uses static opacity
  - CSS class-based BEM styling: replaced with inline styles
  - Sub-components (SkeletonTitle, SkeletonAvatar, SkeletonParagraph, SkeletonImage) not
    exposed separately; all logic is inlined
  - <h3>/<div> elements: replaced with <view>
  - inheritAttrs: not relevant in Lynx
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import type { Numeric, SkeletonAvatarShape } from './types';
import './index.less';

export interface SkeletonProps {
  row?: Numeric;
  rowWidth?: Numeric | Numeric[];
  round?: boolean;
  title?: boolean;
  titleWidth?: Numeric;
  avatar?: boolean;
  avatarSize?: Numeric;
  avatarShape?: SkeletonAvatarShape;
  loading?: boolean;
  animate?: boolean;
}

const DEFAULT_ROW_WIDTH = '100%';
const DEFAULT_LAST_ROW_WIDTH = '60%';
const ROUND_RADIUS = '999px';

function addUnit(value: Numeric | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    return `${value}px`;
  }
  return String(value);
}

const props = withDefaults(defineProps<SkeletonProps>(), {
  row: 0,
  rowWidth: DEFAULT_ROW_WIDTH,
  round: false,
  title: false,
  titleWidth: '40%',
  avatar: false,
  avatarSize: '32px',
  avatarShape: 'round',
  loading: true,
  animate: true,
});

const slots = useSlots();

const roundRadius = computed(() => (props.round ? ROUND_RADIUS : '4px'));

const containerStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  paddingLeft: '16px',
  paddingRight: '16px',
};

const avatarStyle = computed(() => {
  const size = addUnit(props.avatarSize);
  return {
    width: size,
    height: size,
    borderRadius: props.avatarShape === 'round' ? ROUND_RADIUS : '0px',
    backgroundColor: '#f2f3f5',
    marginRight: '16px',
    flexShrink: 0,
    opacity: props.animate ? '0.6' : '1',
  };
});

const contentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
};

const titleStyle = computed(() => ({
  width: addUnit(props.titleWidth),
  height: '16px',
  backgroundColor: '#f2f3f5',
  borderRadius: roundRadius.value,
  marginBottom: '0px',
  opacity: props.animate ? '0.6' : '1',
}));

function getRowWidth(index: number): string {
  const { rowWidth } = props;

  // When rowWidth is default and it's the last row, use 60%
  if (rowWidth === DEFAULT_ROW_WIDTH && index === +props.row - 1) {
    return DEFAULT_LAST_ROW_WIDTH;
  }

  if (Array.isArray(rowWidth)) {
    return addUnit(rowWidth[index]) || DEFAULT_ROW_WIDTH;
  }

  return addUnit(rowWidth);
}

function getRowStyle(index: number) {
  const showTitle = props.title;
  return {
    width: getRowWidth(index),
    height: '16px',
    backgroundColor: '#f2f3f5',
    borderRadius: roundRadius.value,
    marginTop: index > 0 || showTitle ? '12px' : '0px',
    opacity: props.animate ? '0.6' : '1',
  };
}

// First title+paragraph gap should be 20px (matching Vant's SkeletonTitle + SkeletonParagraph margin)
function getFirstRowMarginTop() {
  return props.title ? '20px' : '0px';
}

const rows = computed(() => {
  const result: number[] = [];
  for (let i = 0; i < +props.row; i++) {
    result.push(i);
  }
  return result;
});
</script>

<template>
  <template v-if="loading">
    <view :style="containerStyle">
      <!-- Template slot replaces everything -->
      <slot name="template">
        <!-- Avatar -->
        <view v-if="avatar" :style="avatarStyle" />

        <!-- Content -->
        <view :style="contentStyle">
          <!-- Title -->
          <view v-if="title" :style="titleStyle" />

          <!-- Rows -->
          <view
            v-for="(index, i) in rows"
            :key="index"
            :style="{
              ...getRowStyle(index),
              marginTop: i === 0 ? getFirstRowMarginTop() : '12px',
            }"
          />
        </view>
      </slot>
    </view>
  </template>

  <!-- Default slot (shown when not loading) -->
  <slot v-else />
</template>
