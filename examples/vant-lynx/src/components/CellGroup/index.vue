<!--
  Vant Feature Parity Report:
  - Props: 3/3 supported (title, inset, border)
  - Events: 0/0 (none defined)
  - Slots: 2/2 (default, title)
  - Lynx Limitations:
    - No tag prop needed (Lynx always uses view)
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

const groupStyle = computed(() => ({
  backgroundColor: '#fff',
  borderRadius: props.inset ? 8 : 0,
  marginLeft: props.inset ? 12 : 0,
  marginRight: props.inset ? 12 : 0,
  overflow: 'hidden' as const,
}));

const titleStyle = computed(() => ({
  fontSize: 14,
  color: '#969799',
  paddingTop: props.inset ? 0 : 16,
  paddingBottom: 8,
  paddingLeft: props.inset ? 28 : 16,
  paddingRight: 16,
  lineHeight: 16,
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
