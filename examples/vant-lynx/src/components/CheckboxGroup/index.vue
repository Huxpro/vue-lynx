<script setup lang="ts">
import { computed, provide, toRef } from 'vue-lynx';

export interface CheckboxGroupProps {
  modelValue?: any[];
  max?: number;
  direction?: 'horizontal' | 'vertical';
  disabled?: boolean;
}

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
  modelValue: () => [],
  max: 0,
  direction: 'vertical',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: any[]];
  change: [value: any[]];
}>();

function toggleItem(name: string) {
  const current = [...props.modelValue];
  const index = current.indexOf(name);
  if (index > -1) {
    current.splice(index, 1);
  } else {
    if (props.max > 0 && current.length >= props.max) return;
    current.push(name);
  }
  emit('update:modelValue', current);
  emit('change', current);
}

provide('checkboxGroup', {
  modelValue: toRef(props, 'modelValue'),
  disabled: toRef(props, 'disabled'),
  max: toRef(props, 'max'),
  toggleItem,
});

const groupStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.direction === 'horizontal' ? ('row' as const) : ('column' as const),
  flexWrap: 'wrap' as const,
  gap: 12,
}));
</script>

<template>
  <view :style="groupStyle">
    <slot />
  </view>
</template>
