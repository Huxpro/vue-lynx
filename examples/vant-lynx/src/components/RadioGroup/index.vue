<!--
  Vant Feature Parity Report:
  - Props: 6/6 supported (modelValue, direction, disabled, iconSize, checkedColor, shape)
  - Events: 2/2 supported (update:modelValue, change)
  - Slots: 1/1 supported (default)
  - Gaps: none — full feature parity with Vant RadioGroup
-->
<script setup lang="ts">
import { computed, provide, toRef, watch } from 'vue-lynx';
import type { RadioShape } from '../Radio/index.vue';

export interface RadioGroupProps {
  modelValue?: any;
  direction?: 'horizontal' | 'vertical';
  disabled?: boolean;
  iconSize?: number | string;
  checkedColor?: string;
  shape?: RadioShape;
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
}

// Vant fires 'change' only when the value actually changes (via watch),
// not on every click. This matters when the user clicks the already-selected radio.
watch(
  () => props.modelValue,
  (value) => {
    emit('change', value);
  },
);

provide('radioGroup', {
  modelValue: toRef(props, 'modelValue'),
  disabled: toRef(props, 'disabled'),
  direction: toRef(props, 'direction'),
  iconSize: toRef(props, 'iconSize'),
  checkedColor: toRef(props, 'checkedColor'),
  shape: toRef(props, 'shape'),
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
