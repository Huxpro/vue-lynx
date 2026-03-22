<!--
  Lynx Limitations:
  - role/tablist: Not applicable in Lynx
  - overflow-y: auto: Lynx scrolling differs from web
  - -webkit-overflow-scrolling: Not applicable in Lynx
  - CSS variable theming: Lynx uses inline styles instead of CSS custom properties
-->
<script setup lang="ts">
import { computed, provide, ref } from 'vue-lynx';
import { SIDEBAR_KEY } from './types';

export interface SidebarProps {
  modelValue?: number | string;
}

const props = withDefaults(defineProps<SidebarProps>(), {
  modelValue: 0,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

const getActive = () => +props.modelValue;

const setActive = (value: number) => {
  if (value !== getActive()) {
    emit('update:modelValue', value);
    emit('change', value);
  }
};

const childCount = ref(0);
function getNextIndex(): number {
  return childCount.value++;
}

provide(SIDEBAR_KEY, {
  getActive,
  setActive,
  getNextIndex,
});

const sidebarStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  width: '80px',
  backgroundColor: '#f7f8fa',
  overflow: 'hidden',
}));
</script>

<template>
  <view :style="sidebarStyle">
    <slot />
  </view>
</template>
