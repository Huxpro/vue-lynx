<!--
  Vant Feature Parity Report:
  - Props: 6/6 supported (type, color, size, textSize, textColor, vertical)
  - Slots: 1/1 supported (default - text content)
  - Types: circular (border-based spinner), spinner (dotted ring - SVG not available in Lynx)
  - Lynx Adaptations:
    - No SVG support, so circular uses a border-based rotating ring
    - Spinner type uses a dotted border ring (distinct visual from circular)
    - No CSS animations in Lynx, spinners are static visual indicators
    - Uses view/text elements with inline styles only
  - CSS Variables: Not supported (Lynx limitation)
  - Gaps:
    - No rotation animation (Lynx does not support CSS keyframes)
    - Spinner type cannot render 12 individual bars (no SVG/CSS animation)
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';

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
  vertical: false,
});

const slots = useSlots();

const spinnerSize = computed(() => {
  if (typeof props.size === 'string') return parseInt(props.size, 10) || 30;
  return props.size;
});

const resolvedTextSize = computed(() => {
  if (props.textSize == null) return 14;
  if (typeof props.textSize === 'string') return parseInt(props.textSize, 10) || 14;
  return props.textSize;
});

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.vertical ? ('column' as const) : ('row' as const),
  alignItems: 'center',
}));

const spinnerStyle = computed(() => {
  const sz = spinnerSize.value;

  if (props.type === 'spinner') {
    // Spinner type: dotted border to visually distinguish from circular
    return {
      width: sz,
      height: sz,
      borderRadius: sz / 2,
      borderWidth: Math.max(2, sz / 8),
      borderStyle: 'dotted' as const,
      borderColor: props.color,
    };
  }

  // Circular type: solid ring with one transparent side (classic spinner look)
  return {
    width: sz,
    height: sz,
    borderRadius: sz / 2,
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
  color: props.textColor || '#969799',
  lineHeight: Math.round(resolvedTextSize.value * 1.4),
}));
</script>

<template>
  <view :style="containerStyle">
    <view :style="spinnerStyle" />
    <view v-if="hasSlotContent" :style="textWrapperStyle">
      <text :style="slotTextStyle"><slot /></text>
    </view>
  </view>
</template>
