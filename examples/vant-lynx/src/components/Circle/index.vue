<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface CircleProps {
  currentRate?: number;
  rate?: number;
  size?: number;
  color?: string;
  layerColor?: string;
  strokeWidth?: number;
  text?: string;
  clockwise?: boolean;
}

const props = withDefaults(defineProps<CircleProps>(), {
  currentRate: 0,
  rate: 100,
  size: 100,
  color: '#1989fa',
  layerColor: '#fff',
  strokeWidth: 4,
  clockwise: true,
});

const clampedRate = computed(() =>
  Math.min(100, Math.max(0, (props.currentRate / props.rate) * 100))
);

const outerStyle = computed(() => ({
  width: props.size,
  height: props.size,
  borderRadius: props.size / 2,
  borderWidth: props.strokeWidth,
  borderStyle: 'solid' as const,
  borderColor: props.layerColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  position: 'relative' as const,
}));

const progressBorderStyle = computed(() => {
  const percent = clampedRate.value;

  // Simplified circular progress: use border coloring to show progress
  // Top, right, bottom, left borders represent 25% each
  const topColor = percent > 0 ? props.color : props.layerColor;
  const rightColor = percent > 25 ? props.color : props.layerColor;
  const bottomColor = percent > 50 ? props.color : props.layerColor;
  const leftColor = percent > 75 ? props.color : props.layerColor;

  if (props.clockwise) {
    return {
      width: props.size,
      height: props.size,
      borderRadius: props.size / 2,
      borderWidth: props.strokeWidth,
      borderStyle: 'solid' as const,
      borderTopColor: topColor,
      borderRightColor: rightColor,
      borderBottomColor: bottomColor,
      borderLeftColor: leftColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute' as const,
      top: -(props.strokeWidth),
      left: -(props.strokeWidth),
    };
  }

  return {
    width: props.size,
    height: props.size,
    borderRadius: props.size / 2,
    borderWidth: props.strokeWidth,
    borderStyle: 'solid' as const,
    borderTopColor: topColor,
    borderLeftColor: rightColor,
    borderBottomColor: bottomColor,
    borderRightColor: leftColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute' as const,
    top: -(props.strokeWidth),
    left: -(props.strokeWidth),
  };
});

const centerStyle = computed(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const textStyle = computed(() => ({
  fontSize: props.size * 0.22,
  color: '#323233',
  textAlign: 'center' as const,
  fontWeight: 'bold' as const,
  lineHeight: props.size * 0.3,
}));

const displayText = computed(() => {
  if (props.text !== undefined) return props.text;
  return `${Math.round(clampedRate.value)}%`;
});
</script>

<template>
  <view :style="outerStyle">
    <view :style="progressBorderStyle" />
    <view :style="centerStyle">
      <text :style="textStyle">{{ displayText }}</text>
    </view>
  </view>
</template>
