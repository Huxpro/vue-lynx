<!--
  Lynx Limitations:
  - BORDER_TOP_BOTTOM: Lynx has no ::after pseudo-elements, uses border-top/border-bottom instead
  - useScopeId: not applicable in Lynx
  - inheritAttrs: not applicable since Lynx uses view elements
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface CellGroupProps {
  title?: string;
  inset?: boolean;
  border?: boolean;
}

const props = withDefaults(defineProps<CellGroupProps>(), {
  inset: false,
  border: true,
});

const groupStyle = computed(() => {
  const style: Record<string, string> = {
    backgroundColor: '#fff',
  };

  if (props.inset) {
    style.marginLeft = '16px';
    style.marginRight = '16px';
    style.borderRadius = '8px';
    style.overflow = 'hidden';
  }

  if (props.border && !props.inset) {
    style.borderTopWidth = '0.5px';
    style.borderTopStyle = 'solid';
    style.borderTopColor = '#ebedf0';
    style.borderBottomWidth = '0.5px';
    style.borderBottomStyle = 'solid';
    style.borderBottomColor = '#ebedf0';
  }

  return style;
});

const titleStyle = computed(() => ({
  fontSize: '14px',
  color: '#969799',
  lineHeight: '16px',
  paddingTop: '16px',
  paddingRight: '16px',
  paddingBottom: '16px',
  paddingLeft: '16px',
}));
</script>

<template>
  <view>
    <slot name="title">
      <text v-if="title" :style="titleStyle">{{ title }}</text>
    </slot>
    <view :style="groupStyle">
      <slot />
    </view>
  </view>
</template>
