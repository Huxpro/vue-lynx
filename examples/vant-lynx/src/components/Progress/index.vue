<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface ProgressProps {
  percentage?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  pivotText?: string;
  showPivot?: boolean;
}

const props = withDefaults(defineProps<ProgressProps>(), {
  percentage: 0,
  strokeWidth: 4,
  color: '#1989fa',
  trackColor: '#e5e5e5',
  showPivot: true,
});

const clampedPercentage = computed(() =>
  Math.min(100, Math.max(0, props.percentage))
);

const trackStyle = computed(() => ({
  width: '100%',
  height: props.strokeWidth,
  backgroundColor: props.trackColor,
  borderRadius: props.strokeWidth / 2,
  overflow: 'hidden' as const,
}));

const portionStyle = computed(() => ({
  width: `${clampedPercentage.value}%`,
  height: props.strokeWidth,
  backgroundColor: props.color,
  borderRadius: props.strokeWidth / 2,
}));

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  width: '100%',
}));

const pivotStyle = computed(() => ({
  backgroundColor: props.color,
  borderRadius: 8,
  paddingLeft: 5,
  paddingRight: 5,
  paddingTop: 1,
  paddingBottom: 1,
  marginLeft: 5,
}));

const pivotTextStyle = computed(() => ({
  fontSize: 10,
  color: '#fff',
  lineHeight: 14,
  textAlign: 'center' as const,
}));

const displayText = computed(() =>
  props.pivotText !== undefined ? props.pivotText : `${clampedPercentage.value}%`
);
</script>

<template>
  <view :style="containerStyle">
    <view :style="{ flex: 1 }">
      <view :style="trackStyle">
        <view :style="portionStyle" />
      </view>
    </view>
    <view v-if="showPivot" :style="pivotStyle">
      <text :style="pivotTextStyle">{{ displayText }}</text>
    </view>
  </view>
</template>
