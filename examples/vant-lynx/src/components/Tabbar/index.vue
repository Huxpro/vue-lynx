<script setup lang="ts">
import { computed, provide, toRef } from 'vue-lynx';

export interface TabbarProps {
  modelValue?: number | string;
  fixed?: boolean;
  border?: boolean;
  zIndex?: number;
  activeColor?: string;
  inactiveColor?: string;
}

const props = withDefaults(defineProps<TabbarProps>(), {
  modelValue: 0,
  fixed: true,
  border: true,
  zIndex: 1,
  activeColor: '#1989fa',
  inactiveColor: '#7d7e80',
});

const emit = defineEmits<{
  'update:modelValue': [value: number | string];
  change: [value: number | string];
}>();

function setActive(value: number | string) {
  if (value !== props.modelValue) {
    emit('update:modelValue', value);
    emit('change', value);
  }
}

provide('tabbar', {
  modelValue: toRef(props, 'modelValue'),
  activeColor: toRef(props, 'activeColor'),
  inactiveColor: toRef(props, 'inactiveColor'),
  setActive,
});

const tabbarStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  height: 50,
  backgroundColor: '#fff',
  position: props.fixed ? ('fixed' as const) : ('relative' as const),
  bottom: props.fixed ? 0 : undefined,
  left: props.fixed ? 0 : undefined,
  right: props.fixed ? 0 : undefined,
  zIndex: props.zIndex,
  borderTopWidth: props.border ? 0.5 : 0,
  borderTopStyle: 'solid' as const,
  borderTopColor: '#ebedf0',
}));
</script>

<template>
  <view :style="tabbarStyle">
    <slot />
  </view>
</template>
