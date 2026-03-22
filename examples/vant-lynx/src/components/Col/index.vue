<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view (Lynx has no HTML elements)
  - CSS class-based BEM styling replaced with inline styles
  - 24-column grid uses percentage-based width/margin-left via inline styles
-->
<script setup lang="ts">
import { computed, inject } from 'vue-lynx';
import { ROW_KEY } from '../Row/types';

export interface ColProps {
  tag?: string;
  span?: number | string;
  offset?: number | string;
}

const props = withDefaults(defineProps<ColProps>(), {
  tag: 'div',
  span: 0,
});

const parent = inject(ROW_KEY, undefined);

const spanValue = computed(() => Number(props.span) || 0);
const offsetValue = computed(() => Number(props.offset) || 0);

const colStyle = computed(() => {
  const gutter = parent?.gutterH.value || 0;
  const gutterV = parent?.gutterV.value || 0;
  const widthPercent = (spanValue.value / 24) * 100;
  const offsetPercent = (offsetValue.value / 24) * 100;

  const style: Record<string, string | number | undefined> = {};

  if (spanValue.value) {
    style.width = `${widthPercent}%`;
  }

  if (offsetValue.value) {
    style.marginLeft = `${offsetPercent}%`;
  }

  if (gutter) {
    style.paddingLeft = `${gutter / 2}px`;
    style.paddingRight = `${gutter / 2}px`;
  }

  if (gutterV) {
    style.marginBottom = `${gutterV}px`;
  }

  return style;
});
</script>

<template>
  <view :style="colStyle">
    <slot />
  </view>
</template>
