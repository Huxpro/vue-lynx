<!--
  Vant Feature Parity Report:
  - Props: 3/3 supported (span, offset, tag)
  - Events: 1/1 (click)
  - Slots: 1/1 (default)
  - inject: rowGutter from Row parent
  - Lynx Limitations:
    - tag: accepted for API compat but always renders as view
    - 24-column grid uses percentage-based width/margin-left
-->
<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface ColProps {
  span?: number | string;
  offset?: number | string;
  tag?: string;
}

const props = withDefaults(defineProps<ColProps>(), {
  span: 0,
  offset: 0,
  tag: 'div',
});

const emit = defineEmits<{
  click: [event: any];
}>();

const rowGutter = inject<Ref<number>>('rowGutter');
const rowGutterV = inject<Ref<number>>('rowGutterV', undefined);

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
  const gutterV = rowGutterV?.value || 0;
  const widthPercent = (spanValue.value / 24) * 100;
  const offsetPercent = (offsetValue.value / 24) * 100;

  return {
    width: `${widthPercent}%`,
    marginLeft: offsetPercent ? `${offsetPercent}%` : undefined,
    paddingLeft: gutter ? gutter / 2 : 0,
    paddingRight: gutter ? gutter / 2 : 0,
    marginBottom: gutterV || undefined,
  };
});

function onTap(event: any) {
  emit('click', event);
}
</script>

<template>
  <view :style="colStyle" @tap="onTap">
    <slot />
  </view>
</template>
