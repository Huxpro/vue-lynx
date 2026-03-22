<!--
  Lynx Limitations:
  - role="radiogroup": Lynx has no ARIA
  - div tag: always renders <view>
-->
<script setup lang="ts">
import { computed, watch, provide, reactive } from 'vue-lynx';
import { createNamespace } from '../../utils';
import type { RadioShape, RadioGroupDirection, RadioGroupProvide } from '../Radio/types';
import './index.less';

export interface RadioGroupProps {
  modelValue?: unknown;
  disabled?: boolean;
  direction?: RadioGroupDirection;
  iconSize?: number | string;
  checkedColor?: string;
  shape?: RadioShape;
}

const [, bem] = createNamespace('radio-group');

const props = withDefaults(defineProps<RadioGroupProps>(), {
  disabled: false,
  direction: undefined,
  iconSize: undefined,
  checkedColor: undefined,
  shape: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: unknown];
  change: [value: unknown];
}>();

function updateValue(value: unknown) {
  emit('update:modelValue', value);
}

watch(
  () => props.modelValue,
  (value) => {
    emit('change', value);
  },
);

provide<RadioGroupProvide>('vanRadioGroup', reactive({
  props,
  updateValue,
}));

const rootClass = computed(() => bem([props.direction]));
</script>

<template>
  <view :class="rootClass">
    <slot />
  </view>
</template>
