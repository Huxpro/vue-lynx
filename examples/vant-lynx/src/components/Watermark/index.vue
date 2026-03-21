<!--
  Vant Feature Parity Report:
  - Props: 11/11 supported (with naming adaptation)
    - width: number (default 100) - watermark cell width
    - height: number (default 100) - watermark cell height
    - content: string (default '') - text content for watermark
    - image: string (default '') - image URL for watermark
    - rotate: Numeric (default -22) - rotation angle in degrees
    - fullPage: boolean (default true) - cover full page vs container
    - gapX: number (default 0) - horizontal gap between cells
    - gapY: number (default 0) - vertical gap between cells
    - zIndex: Numeric (default 100) - z-index of watermark layer
    - opacity: Numeric (default 0.15) - opacity of watermark items
    - textColor: string (default '#dcdee0') - Vant prop name; mapped to fontColor internally
      Also accepts extended font props: fontSize, fontFamily, fontWeight, fontStyle, textAlign
  - Events: 0/0 (Vant has no events for Watermark)
  - Slots: 1/1 supported
    - content: custom watermark content per cell
  - Lynx Adaptations:
    - No SVG support in Lynx; Vant renders watermark as tiled SVG background-image
    - This implementation uses absolutely-positioned view elements in a grid
    - No Canvas/SVG for image-to-base64 conversion
    - No MutationObserver for tamper protection (Lynx limitation)
    - pointerEvents: 'none' may not be supported in all Lynx versions
    - Grid dimensions use configurable screenWidth/screenHeight props for flexibility
  - Gaps:
    - No SVG-based rendering (uses repeated view elements instead)
    - No MutationObserver tamper protection (Vant re-renders if DOM is modified)
    - No image-to-base64 conversion (image rendered directly via <image> element)
    - Performance: many absolutely-positioned views vs single background-image
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';

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
  /** Vant uses textColor; we accept both textColor and fontColor */
  textColor?: string;
  fontColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  /** Lynx-specific: screen width for grid calculation (default 400) */
  screenWidth?: number;
  /** Lynx-specific: screen height for grid calculation (default 800) */
  screenHeight?: number;
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
  textColor: '',
  fontColor: '',
  fontSize: 14,
  fontFamily: '',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'center',
  screenWidth: 400,
  screenHeight: 800,
});

const slots = useSlots();

// Resolve text color: prefer Vant's textColor, fall back to fontColor, then default
const resolvedTextColor = computed(() =>
  props.textColor || props.fontColor || '#dcdee0',
);

const cellWidth = computed(() => props.width + props.gapX);
const cellHeight = computed(() => props.height + props.gapY);

// Generate grid of watermark items
const gridItems = computed(() => {
  const cols = Math.ceil(props.screenWidth / cellWidth.value) + 1;
  const rows = Math.ceil(props.screenHeight / cellHeight.value) + 1;
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

const hasContentSlot = computed(() => !!slots.content);

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
  color: resolvedTextColor.value,
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
      <!-- Content slot for custom watermark content (Vant parity) -->
      <slot v-if="hasContentSlot" name="content" />
      <text v-else-if="content" :style="textStyle">{{ content }}</text>
      <image v-else-if="image" :src="image" :style="{ width: width, height: height }" />
    </view>
  </view>
</template>
