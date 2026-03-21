<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface ColProps {
  span?: number | string;
  offset?: number | string;
}

const props = withDefaults(defineProps<ColProps>(), {
  span: 0,
  offset: 0,
});

const rowGutter = inject<Ref<number>>('rowGutter');

const spanValue = computed(() => {
  if (typeof props.span === 'string') return parseInt(props.span, 10) || 0;
  return props.span;
});

const offsetValue = computed(() => {
  if (typeof props.offset === 'string') return parseInt(props.offset, 10) || 0;
  return props.offset;
});

const colStyle = computed(() => {
  const gutter = rowGutter?.value || 0;
  const widthPercent = (spanValue.value / 24) * 100;
  const offsetPercent = (offsetValue.value / 24) * 100;

  return {
    width: `${widthPercent}%`,
    marginLeft: offsetPercent ? `${offsetPercent}%` : undefined,
    paddingLeft: gutter ? gutter / 2 : 0,
    paddingRight: gutter ? gutter / 2 : 0,
  };
});
</script>

<template>
  <view :style="colStyle">
    <slot />
  </view>
</template>
