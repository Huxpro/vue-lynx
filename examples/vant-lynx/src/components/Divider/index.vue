<!--
  Vant Feature Parity Report:
  - Props: 3/4 supported (dashed, hairline, contentPosition)
  - Slots: 1/1 supported (default - text content between lines)
  - Content positioning: left/center/right via flex ratios
  - Hairline: default true, renders 0.5px border; false renders 1px
  - Dashed: renders dashed border style
  - Lynx Adaptations:
    - Uses view/text elements with inline styles (no CSS classes)
    - Lines are explicit <view> elements (no ::before/::after pseudo-elements)
    - Must use display:'flex' + flexDirection:'row' explicitly (Lynx default is linear/column)
    - Content position uses flex ratio (1:10 for left, 10:1 for right, 1:1 for center)
  - CSS Variables: Not supported (Lynx limitation)
  - Gaps:
    - vertical prop not implemented (Lynx inline-block behavior differs significantly)
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';

export interface DividerProps {
  contentPosition?: 'left' | 'center' | 'right';
  dashed?: boolean;
  hairline?: boolean;
}

const props = withDefaults(defineProps<DividerProps>(), {
  contentPosition: 'center',
  dashed: false,
  hairline: true,
});

const slots = useSlots();

const hasContent = computed(() => !!slots.default);

const containerStyle = computed(() => ({
  display: 'flex' as const,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  marginTop: 16,
  marginBottom: 16,
  marginLeft: 0,
  marginRight: 0,
}));

const baseLineStyle = computed(() => ({
  height: 0,
  borderTopWidth: props.hairline ? 0.5 : 1,
  borderTopStyle: props.dashed ? ('dashed' as const) : ('solid' as const),
  borderTopColor: '#ebedf0',
}));

const leftLineStyle = computed(() => {
  if (!hasContent.value) {
    return {
      ...baseLineStyle.value,
      flex: 1,
    };
  }
  return {
    ...baseLineStyle.value,
    flex: props.contentPosition === 'left' ? 1 : 10,
    marginRight: 16,
  };
});

const rightLineStyle = computed(() => {
  if (!hasContent.value) {
    return {
      ...baseLineStyle.value,
      flex: 0,
      width: 0,
    };
  }
  return {
    ...baseLineStyle.value,
    flex: props.contentPosition === 'right' ? 1 : 10,
    marginLeft: 16,
  };
});
</script>

<template>
  <view :style="containerStyle">
    <view :style="leftLineStyle" />
    <slot />
    <view v-if="hasContent" :style="rightLineStyle" />
  </view>
</template>
