<!--
  Vant Feature Parity Report:
  - Props: 6/6 supported (type, color, size, textSize, textColor, vertical)
  - Events: 0/0 (none defined in Vant API)
  - Slots: 2/2 supported (default - text content, icon - custom spinner)
  - Lynx Limitations:
    - No CSS @keyframes; uses JS-driven rotation via CSS transition + setTimeout
    - Spinner type: dotted border ring (no SVG for 12-bar spinner)
    - Circular type: border-based ring with transparent segment
-->
<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, useSlots } from 'vue-lynx';

export interface LoadingProps {
  type?: 'circular' | 'spinner';
  color?: string;
  size?: string | number;
  textSize?: string | number;
  textColor?: string;
  vertical?: boolean;
}

const props = withDefaults(defineProps<LoadingProps>(), {
  type: 'circular',
  color: '#c9c9c9',
  size: 30,
  textSize: 14,
  textColor: '#c9c9c9',
  vertical: false,
});

const slots = useSlots();

const spinnerSize = computed(() => {
  if (typeof props.size === 'string') return parseInt(props.size, 10) || 30;
  return props.size;
});

const resolvedTextSize = computed(() => {
  if (typeof props.textSize === 'string') return parseInt(props.textSize, 10) || 14;
  return props.textSize;
});

// JS-driven rotation: CSS transition smoothly rotates 360° every 800ms
const rotation = ref(0);
let rotationTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRotation() {
  rotationTimer = setTimeout(() => {
    rotation.value += 360;
    scheduleRotation();
  }, 800);
}

onMounted(() => {
  setTimeout(() => {
    rotation.value = 360;
    scheduleRotation();
  }, 16);
});

onBeforeUnmount(() => {
  if (rotationTimer) {
    clearTimeout(rotationTimer);
    rotationTimer = null;
  }
});

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.vertical ? ('column' as const) : ('row' as const),
  alignItems: 'center',
}));

const spinnerStyle = computed(() => {
  const sz = spinnerSize.value;
  const base: Record<string, any> = {
    width: sz,
    height: sz,
    borderRadius: sz / 2,
    transform: `rotate(${rotation.value}deg)`,
    transition: 'transform 0.8s linear',
  };

  if (props.type === 'spinner') {
    return {
      ...base,
      borderWidth: Math.max(2, sz / 8),
      borderStyle: 'dotted' as const,
      borderColor: props.color,
    };
  }

  return {
    ...base,
    borderWidth: Math.max(2, sz / 10),
    borderStyle: 'solid' as const,
    borderColor: `${props.color} ${props.color} ${props.color} transparent`,
  };
});

const hasSlotContent = computed(() => !!slots.default);

const textWrapperStyle = computed(() => ({
  marginLeft: props.vertical ? 0 : 8,
  marginTop: props.vertical ? 8 : 0,
}));

const slotTextStyle = computed(() => ({
  fontSize: resolvedTextSize.value,
  color: props.textColor,
  lineHeight: Math.round(resolvedTextSize.value * 1.4),
}));
</script>

<template>
  <view :style="containerStyle">
    <slot name="icon">
      <view :style="spinnerStyle" />
    </slot>
    <view v-if="hasSlotContent" :style="textWrapperStyle">
      <text :style="slotTextStyle"><slot /></text>
    </view>
  </view>
</template>
