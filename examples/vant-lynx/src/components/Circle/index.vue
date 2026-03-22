<!--
  Lynx Limitations:
  - SVG inline children: Lynx uses <svg content="..."> attribute instead of nested SVG elements.
    We generate the SVG XML as a string and pass it via the content prop.
  - Gradient color: linearGradient works within SVG content string
  - raf/cancelRaf: Uses setTimeout-based animation (no @vant/use raf helper)
-->
<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit } from '../../utils/format';
import type { CircleProps, CircleStartPosition } from './types';
import './index.less';

const [name, bem] = createNamespace('circle');

let uid = 0;
const id = `van-circle-${uid++}`;

const PERIMETER = 3140;

const format = (rate: string | number) => Math.min(Math.max(+rate, 0), 100);

function getPath(clockwise: boolean, viewBoxSize: number) {
  const sweepFlag = clockwise ? 1 : 0;
  return `M ${viewBoxSize / 2} ${viewBoxSize / 2} m 0, -500 a 500, 500 0 1, ${sweepFlag} 0, 1000 a 500, 500 0 1, ${sweepFlag} 0, -1000`;
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

const viewBoxSize = computed(() => +props.strokeWidth + 1000);

const path = computed(() => getPath(props.clockwise, viewBoxSize.value));

const svgStyle = computed(() => {
  const ROTATE_ANGLE_MAP: Record<CircleStartPosition, number> = {
    top: 0,
    right: 90,
    bottom: 180,
    left: 270,
  };
  const angleValue = ROTATE_ANGLE_MAP[props.startPosition];
  if (angleValue) {
    return `transform: rotate(${angleValue}deg);`;
  }
  return '';
});

// Animation via watch on rate
let animTimer: ReturnType<typeof setTimeout> | null = null;

function clearAnimTimer() {
  if (animTimer !== null) {
    clearTimeout(animTimer);
    animTimer = null;
  }
}

watch(
  () => props.rate,
  (rate) => {
    clearAnimTimer();

    const startTime = Date.now();
    const startRate = props.currentRate;
    const endRate = format(rate);
    const duration = Math.abs(((startRate - endRate) * 1000) / +props.speed);

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const currentRate = progress * (endRate - startRate) + startRate;

      emit('update:currentRate', format(parseFloat(currentRate.toFixed(1))));

      if (endRate > startRate ? currentRate < endRate : currentRate > endRate) {
        animTimer = setTimeout(animate, 16);
      }
    };

    if (props.speed) {
      animTimer = setTimeout(animate, 16);
    } else {
      emit('update:currentRate', endRate);
    }
  },
  { immediate: true },
);

onUnmounted(clearAnimTimer);

// Build SVG content string
const svgContent = computed(() => {
  const vbs = viewBoxSize.value;
  const d = path.value;
  const { strokeWidth, currentRate, strokeLinecap, fill, layerColor, color } = props;
  const offset = (PERIMETER * currentRate) / 100;

  const isGradient = typeof color === 'object' && color !== null;
  const strokeColor = isGradient ? `url(#${id})` : (color || '');

  // Build gradient defs if needed
  let gradientDefs = '';
  if (isGradient) {
    const stops = Object.keys(color)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .map(key => `<stop offset="${key}" stop-color="${(color as Record<string, string>)[key]}" />`)
      .join('');
    gradientDefs = `<defs><linearGradient id="${id}" x1="100%" y1="0%" x2="0%" y2="0%">${stops}</linearGradient></defs>`;
  }

  // Layer path (background circle)
  const layerStroke = layerColor || '';
  const layerPath = `<path d="${d}" style="fill: ${fill}; stroke: ${layerStroke}; stroke-width: ${strokeWidth}px;" />`;

  // Hover path (progress arc)
  const hoverStyle = [
    `stroke: ${strokeColor}`,
    `stroke-width: ${+strokeWidth + 1}px`,
    strokeLinecap ? `stroke-linecap: ${strokeLinecap}` : '',
    `stroke-dasharray: ${offset}px ${PERIMETER}px`,
    'fill: none',
  ].filter(Boolean).join('; ');
  const hoverPath = `<path d="${d}" style="${hoverStyle}" />`;

  return `<svg viewBox="0 0 ${vbs} ${vbs}" style="${svgStyle.value}">${gradientDefs}${layerPath}${hoverPath}</svg>`;
});

// Container size style
const sizeStyle = computed(() => {
  const size = props.size ? addUnit(props.size) : undefined;
  if (size) {
    return { width: size, height: size };
  }
  return undefined;
});
</script>

<template>
  <view :class="bem()" :style="sizeStyle">
    <svg :content="svgContent" :style="{ position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%' }" />
    <view :class="bem('text')">
      <slot>
        <text v-if="text">{{ text }}</text>
      </slot>
    </view>
  </view>
</template>
