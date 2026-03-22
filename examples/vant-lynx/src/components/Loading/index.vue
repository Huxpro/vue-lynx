<!--
  Lynx Limitations:
  - No SVG support: circular spinner uses CSS border ring instead of SVG stroke-dasharray
  - No CSS @keyframes: spinners are static visual indicators (no rotation animation)
  - No ::before pseudo-elements: spinner type uses dotted border instead of 12 rotated bars
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';

export type LoadingType = 'circular' | 'spinner';

export interface LoadingProps {
  type?: LoadingType;
  color?: string;
  size?: string | number;
  textSize?: string | number;
  textColor?: string;
  vertical?: boolean;
}

const props = withDefaults(defineProps<LoadingProps>(), {
  type: 'circular',
});

const slots = useSlots();

// Defaults matching Vant's CSS variables
const DEFAULT_COLOR = '#c9c9c9'; // --van-loading-spinner-color → --van-gray-5
const DEFAULT_SIZE = 30; // --van-loading-spinner-size
const DEFAULT_TEXT_COLOR = '#969799'; // --van-loading-text-color → --van-text-color-2
const DEFAULT_TEXT_SIZE = 14; // --van-loading-text-font-size → --van-font-size-md

const addUnit = (value?: string | number): string | undefined => {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
};

const resolvedSize = computed(() => {
  if (props.size !== undefined) {
    if (typeof props.size === 'number') return props.size;
    const parsed = parseFloat(props.size);
    return isNaN(parsed) ? DEFAULT_SIZE : parsed;
  }
  return DEFAULT_SIZE;
});

const resolvedColor = computed(() => props.color || DEFAULT_COLOR);

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.vertical ? ('column' as const) : ('row' as const),
  alignItems: 'center',
}));

const spinnerStyle = computed(() => {
  const sz = resolvedSize.value;
  const color = resolvedColor.value;
  const borderWidth = Math.max(
    2,
    Math.round(props.type === 'spinner' ? sz / 8 : sz / 10),
  );

  return {
    width: `${sz}px`,
    height: `${sz}px`,
    borderRadius: `${sz / 2}px`,
    borderWidth: `${borderWidth}px`,
    borderStyle: (props.type === 'spinner' ? 'dotted' : 'solid') as const,
    borderColor:
      props.type === 'spinner'
        ? color
        : `${color} ${color} ${color} transparent`,
  };
});

const hasText = computed(() => !!slots.default);

const textWrapperStyle = computed(() => ({
  marginLeft: props.vertical ? '0px' : '8px',
  marginTop: props.vertical ? '8px' : '0px',
}));

const textStyle = computed(() => {
  const fontSize =
    props.textSize !== undefined
      ? typeof props.textSize === 'number'
        ? props.textSize
        : parseFloat(props.textSize) || DEFAULT_TEXT_SIZE
      : DEFAULT_TEXT_SIZE;

  return {
    fontSize: `${fontSize}px`,
    color: props.textColor ?? props.color ?? DEFAULT_TEXT_COLOR,
    lineHeight: `${Math.round(fontSize * 1.4)}px`,
  };
});
</script>

<template>
  <view :style="containerStyle">
    <slot name="icon">
      <view :style="spinnerStyle" />
    </slot>
    <view v-if="hasText" :style="textWrapperStyle">
      <text :style="textStyle"><slot /></text>
    </view>
  </view>
</template>
