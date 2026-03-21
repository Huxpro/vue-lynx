<!--
  Vant Feature Parity Report:
  - Props: 8/11 supported (width, height, content, image, rotate, fullPage, gapX, gapY, zIndex, opacity; missing: textColor mapped to fontColor instead)
  - Events: 0/0 supported (Vant has no emits)
  - Slots: 0/1 supported (missing: content slot)
  - Gaps: no content slot, no SVG-based watermark rendering (uses repeated view elements), textColor prop renamed to fontColor with extra font props (fontFamily, fontWeight, fontStyle, textAlign), no MutationObserver tamper protection
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface WatermarkProps {
  width?: number;
  height?: number;
  content?: string;
  image?: string;
  rotate?: number;
  fullPage?: boolean;
  gapX?: number;
  gapY?: number;
  zIndex?: number;
  opacity?: number;
  fontColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
}

const props = withDefaults(defineProps<WatermarkProps>(), {
  width: 100,
  height: 100,
  content: '',
  image: '',
  rotate: -22,
  fullPage: true,
  gapX: 0,
  gapY: 0,
  zIndex: 100,
  opacity: 0.15,
  fontColor: '#000',
  fontSize: 14,
  fontFamily: '',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'center',
});

const cellWidth = computed(() => props.width + props.gapX);
const cellHeight = computed(() => props.height + props.gapY);

// Generate grid of watermark items
const gridItems = computed(() => {
  const cols = Math.ceil(400 / cellWidth.value) + 1;
  const rows = Math.ceil(800 / cellHeight.value) + 1;
  const items: Array<{ key: string; left: number; top: number }> = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      items.push({
        key: `${row}-${col}`,
        left: col * cellWidth.value,
        top: row * cellHeight.value,
      });
    }
  }
  return items;
});

const containerStyle = computed(() => ({
  position: (props.fullPage ? 'fixed' : 'absolute') as 'fixed' | 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: props.zIndex,
  overflow: 'hidden',
  pointerEvents: 'none' as const,
}));

const itemStyle = computed(() => ({
  position: 'absolute' as const,
  width: props.width,
  height: props.height,
  display: 'flex',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  opacity: props.opacity,
  transform: `rotate(${props.rotate}deg)`,
}));

const textStyle = computed(() => ({
  fontSize: props.fontSize,
  color: props.fontColor,
  fontFamily: props.fontFamily || undefined,
  fontWeight: props.fontWeight,
  fontStyle: props.fontStyle,
  textAlign: props.textAlign as any,
}));
</script>

<template>
  <view :style="containerStyle">
    <view
      v-for="item in gridItems"
      :key="item.key"
      :style="{
        ...itemStyle,
        left: item.left,
        top: item.top,
      }"
    >
      <text v-if="content" :style="textStyle">{{ content }}</text>
      <image v-else-if="image" :src="image" :style="{ width: width, height: height }" />
    </view>
  </view>
</template>
