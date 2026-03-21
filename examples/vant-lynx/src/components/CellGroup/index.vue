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
</script>

<template>
  <view>
    <text
      v-if="title"
      :style="{
        fontSize: 14,
        color: '#969799',
        padding: 16,
        paddingTop: inset ? 0 : 16,
        paddingLeft: inset ? 28 : 16,
      }"
    >{{ title }}</text>
    <view :style="groupStyle">
      <slot />
    </view>
  </view>
</template>
