<!--
  Lynx Limitations:
  - SVG: Lynx has no SVG support, circular progress uses border-based rendering (4 quadrant resolution)
  - Gradient color: Record<string, string> gradient not supported (uses first color or string color)
  - strokeLinecap: not applicable (no SVG strokes)
  - fill: not applicable (no SVG fill)
  - startPosition: simplified (border quadrants don't map exactly to SVG rotation)
  - CSS transform: rotate() applied on view level
  - raf/cancelRaf animation: uses setInterval-based approximation for speed animation
  - Percentage-based transforms not supported in Lynx
-->
<script setup lang="ts">
import { computed, watch, onUnmounted, useSlots } from 'vue-lynx';
import type { Numeric, CircleStartPosition } from './types';
import './index.less';

export interface CircleProps {
  text?: string;
  size?: Numeric;
  fill?: string;
  rate?: Numeric;
  speed?: Numeric;
  color?: string | Record<string, string>;
  clockwise?: boolean;
  layerColor?: string;
  currentRate?: number;
  strokeWidth?: Numeric;
  strokeLinecap?: string;
  startPosition?: CircleStartPosition;
}

const props = withDefaults(defineProps<CircleProps>(), {
  fill: 'none',
  rate: 100,
  speed: 0,
  clockwise: true,
  currentRate: 0,
  strokeWidth: 40,
  startPosition: 'top',
});

const emit = defineEmits<{
  'update:currentRate': [value: number];
}>();

const slots = useSlots();

function addUnit(value: Numeric | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    return `${value}px`;
  }
  return String(value);
}

function format(rate: Numeric): number {
  return Math.min(Math.max(+rate, 0), 100);
}

function resolveColor(color: string | Record<string, string> | undefined): string {
  if (!color) return '#1989fa';
  if (typeof color === 'string') return color;
  // For gradient objects, use the last color as solid fallback
  const keys = Object.keys(color).sort((a, b) => parseFloat(a) - parseFloat(b));
  return color[keys[keys.length - 1]] || '#1989fa';
}

const resolvedColor = computed(() => resolveColor(props.color));
const resolvedSize = computed(() => props.size ? addUnit(props.size) : '100px');
const resolvedSizeNum = computed(() => {
  if (props.size === undefined) return 100;
  return typeof props.size === 'number' ? props.size : parseFloat(String(props.size)) || 100;
});
const resolvedStrokeWidth = computed(() => +props.strokeWidth);

// Scale factor for Vant's default strokeWidth (40 out of 1000 viewbox = 4%)
// Convert to actual px based on component size
const scaledStrokeWidth = computed(() => {
  return Math.max(2, (resolvedStrokeWidth.value / 1000) * resolvedSizeNum.value);
});

// Animation via watch on rate
let animTimer: ReturnType<typeof setInterval> | null = null;

function clearAnimTimer() {
  if (animTimer) {
    clearInterval(animTimer);
    animTimer = null;
  }
}

watch(
  () => props.rate,
  (rate) => {
    clearAnimTimer();

    const startRate = props.currentRate;
    const endRate = format(rate);
    const speed = +props.speed;

    if (!speed) {
      emit('update:currentRate', endRate);
      return;
    }

    const duration = Math.abs(((startRate - endRate) * 1000) / speed);
    const startTime = Date.now();

    animTimer = setInterval(() => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const currentRate = progress * (endRate - startRate) + startRate;
      const formatted = format(parseFloat(currentRate.toFixed(1)));

      emit('update:currentRate', formatted);

      if (progress >= 1) {
        clearAnimTimer();
      }
    }, 16);
  },
  { immediate: true },
);

onUnmounted(clearAnimTimer);

// Border-based circular progress rendering
// Each border side represents ~25% of the circle
const displayRate = computed(() => format(props.currentRate));

const containerStyle = computed(() => ({
  width: resolvedSize.value,
  height: resolvedSize.value,
  position: 'relative' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const outerStyle = computed(() => ({
  width: resolvedSize.value,
  height: resolvedSize.value,
  borderRadius: `${resolvedSizeNum.value / 2}px`,
  borderWidth: `${scaledStrokeWidth.value}px`,
  borderStyle: 'solid' as const,
  borderColor: props.layerColor || '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative' as const,
}));

const progressBorderStyle = computed(() => {
  const percent = displayRate.value;
  const color = resolvedColor.value;
  const layer = props.layerColor || '#fff';

  // Map percentage to quadrant borders
  // Clockwise from top: top -> right -> bottom -> left
  const topColor = percent > 0 ? color : layer;
  const rightColor = percent > 25 ? color : layer;
  const bottomColor = percent > 50 ? color : layer;
  const leftColor = percent > 75 ? color : layer;

  const borderColors = props.clockwise
    ? { borderTopColor: topColor, borderRightColor: rightColor, borderBottomColor: bottomColor, borderLeftColor: leftColor }
    : { borderTopColor: topColor, borderLeftColor: rightColor, borderBottomColor: bottomColor, borderRightColor: leftColor };

  return {
    width: resolvedSize.value,
    height: resolvedSize.value,
    borderRadius: `${resolvedSizeNum.value / 2}px`,
    borderWidth: `${scaledStrokeWidth.value}px`,
    borderStyle: 'solid' as const,
    ...borderColors,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute' as const,
    top: `-${scaledStrokeWidth.value}px`,
    left: `-${scaledStrokeWidth.value}px`,
  };
});

const textStyle = computed(() => ({
  fontSize: '14px',
  color: '#323233',
  textAlign: 'center' as const,
  fontWeight: 'bold' as const,
  lineHeight: '20px',
}));
</script>

<template>
  <view :style="containerStyle">
    <view :style="outerStyle">
      <view :style="progressBorderStyle" />
      <view :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <slot>
          <text v-if="text" :style="textStyle">{{ text }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>
