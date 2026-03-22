<!--
  Lynx Limitations:
  - SVG rendering: Lynx has no SVG support; Vant renders watermark as tiled SVG background-image.
    This implementation uses repeated view elements in a flex-wrap grid instead.
  - Canvas/Blob: No document.createElement('canvas'), no Blob, no URL.createObjectURL.
    Image watermarks rendered directly via <image> elements.
  - MutationObserver: No DOM tamper protection (Lynx has no MutationObserver).
  - content slot: Vant renders slot content inside SVG foreignObject; we render it directly
    in each grid cell since there's no SVG.
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import type { WatermarkProps } from './types';
import './index.less';

const [, bem] = createNamespace('watermark');

const props = withDefaults(defineProps<WatermarkProps>(), {
  gapX: 0,
  gapY: 0,
  width: 100,
  height: 100,
  rotate: -22,
  fullPage: true,
  textColor: '#dcdee0',
});

const slots = useSlots();

const cellWidth = computed(() => props.width + props.gapX);
const cellHeight = computed(() => props.height + props.gapY);

// Generate enough cells to cover visible area
// Use a generous estimate since we can't measure container in Lynx
const SCREEN_WIDTH = 500;
const SCREEN_HEIGHT = 1000;

const gridItems = computed(() => {
  const cols = Math.ceil(SCREEN_WIDTH / cellWidth.value) + 1;
  const rows = Math.ceil(SCREEN_HEIGHT / cellHeight.value) + 1;
  const items: Array<{ key: string }> = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      items.push({ key: `${row}-${col}` });
    }
  }
  return items;
});

const rootStyle = computed(() => {
  const style: Record<string, string | number> = {};
  if (props.zIndex !== undefined) {
    style.zIndex = Number(props.zIndex);
  }
  return style;
});

const cellStyle = computed(() => {
  const style: Record<string, string | number> = {
    width: `${props.width}px`,
    height: `${props.height}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: `rotate(${props.rotate}deg)`,
  };
  // gapX/gapY as margin
  if (props.gapX > 0) {
    style.marginRight = `${props.gapX}px`;
  }
  if (props.gapY > 0) {
    style.marginBottom = `${props.gapY}px`;
  }
  if (props.opacity !== undefined) {
    style.opacity = Number(props.opacity);
  }
  return style;
});

const textStyle = computed(() => ({
  color: props.textColor,
  fontSize: '14px',
}));

const hasContentSlot = computed(() => !!slots.content);
</script>

<template>
  <view :class="bem([{ full: fullPage }])" :style="rootStyle">
    <view :class="bem('wrapper')">
      <view
        v-for="item in gridItems"
        :key="item.key"
        :style="cellStyle"
      >
        <slot v-if="hasContentSlot" name="content" />
        <image
          v-else-if="image"
          :src="image"
          :style="{ width: `${width}px`, height: `${height}px` }"
        />
        <text v-else-if="content" :style="textStyle">{{ content }}</text>
      </view>
    </view>
  </view>
</template>
