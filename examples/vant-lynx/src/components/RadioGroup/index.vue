<script setup lang="ts">
import { computed, provide, toRef } from 'vue-lynx';

export interface RadioGroupProps {
  modelValue?: any;
  direction?: 'horizontal' | 'vertical';
  disabled?: boolean;
}

const props = withDefaults(defineProps<RadioGroupProps>(), {
  direction: 'vertical',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: any];
  change: [value: any];
}>();

function updateValue(name: any) {
  emit('update:modelValue', name);
  emit('change', name);
}

provide('radioGroup', {
  modelValue: toRef(props, 'modelValue'),
  disabled: toRef(props, 'disabled'),
  updateValue,
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
