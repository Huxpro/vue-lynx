<!--
  Lynx Limitations:
  - transform: translate(-X%, -50%): Lynx does not support percentage-based translate transforms,
    so pivot positioning uses marginLeft approximation instead of Vant's transform approach
  - word-break: keep-all: Not available in Lynx, pivot text may wrap differently
  - box-sizing on pivot: Lynx defaults to border-box already
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit } from '../../utils/format';
import type { ProgressProps } from './types';
import './index.less';

const [name, bem] = createNamespace('progress');

const props = withDefaults(defineProps<ProgressProps>(), {
  percentage: 0,
  showPivot: true,
  inactive: false,
});

// Clamp percentage to 0-100
function format(rate: number | string): number {
  const val = typeof rate === 'string' ? parseFloat(rate) : rate;
  return Math.min(100, Math.max(0, isNaN(val) ? 0 : val));
}

const safePercentage = computed(() => format(props.percentage));

// Track (root) inline style: only for dynamic strokeWidth and trackColor
const rootStyle = computed(() => {
  const style: Record<string, string | number> = {};
  if (props.strokeWidth) {
    const height = addUnit(props.strokeWidth);
    if (height) {
      style.height = height;
      style.borderRadius = height;
    }
  }
  if (props.trackColor) {
    style.background = props.trackColor;
  }
  return style;
});

// Portion inline style: dynamic width and color
const portionStyle = computed(() => {
  const style: Record<string, string> = {
    width: `${safePercentage.value}%`,
  };
  const bg = props.inactive ? undefined : props.color;
  if (bg) {
    style.background = bg;
  }
  return style;
});

// Pivot inline style: position + custom colors
// Vant uses transform: translate(-X%, -50%) for centering.
// Lynx doesn't support percentage-based translate, so we approximate
// with marginLeft. The pivot min-width is ~3.6em (~36px at 10px font).
const PIVOT_APPROX_WIDTH = 36;

const pivotStyle = computed(() => {
  const pct = safePercentage.value;
  const style: Record<string, string | number> = {
    left: `${pct}%`,
    marginLeft: `${-(pct / 100) * PIVOT_APPROX_WIDTH}px`,
    marginTop: `${-PIVOT_APPROX_WIDTH * 0.44}px`, // approx -50% of pivot height
  };
  if (props.textColor) {
    style.color = props.textColor;
  }
  const bg = props.pivotColor || (props.inactive ? undefined : props.color);
  if (bg) {
    style.background = bg;
  }
  return style;
});

const displayText = computed(() =>
  props.pivotText !== undefined ? props.pivotText : `${safePercentage.value}%`,
);
</script>

<template>
  <view :class="bem()" :style="rootStyle">
    <!-- Filled portion -->
    <view
      :class="bem('portion', { inactive })"
      :style="portionStyle"
    />
    <!-- Pivot label -->
    <view
      v-if="showPivot"
      :class="bem('pivot', { inactive })"
      :style="pivotStyle"
    >
      <slot name="pivot" :percentage="safePercentage">
        <text>{{ displayText }}</text>
      </slot>
    </view>
  </view>
</template>
