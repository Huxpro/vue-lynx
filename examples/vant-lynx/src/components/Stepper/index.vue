<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface StepperProps {
  modelValue?: number;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  disabled?: boolean;
  inputWidth?: number;
  buttonSize?: number;
  theme?: 'default' | 'round';
}

const props = withDefaults(defineProps<StepperProps>(), {
  modelValue: 1,
  min: 1,
  max: Infinity,
  step: 1,
  integer: false,
  disabled: false,
  inputWidth: 32,
  buttonSize: 28,
  theme: 'default',
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
  plus: [];
  minus: [];
}>();

const isMinDisabled = computed(() => props.disabled || props.modelValue <= props.min);
const isMaxDisabled = computed(() => props.disabled || props.modelValue >= props.max);

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
}));

const isRound = computed(() => props.theme === 'round');

const minusButtonStyle = computed(() => ({
  width: props.buttonSize,
  height: props.buttonSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: isRound.value ? '#1989fa' : '#f2f3f5',
  borderRadius: isRound.value ? props.buttonSize / 2 : 2,
  opacity: isMinDisabled.value ? 0.4 : 1,
}));

const plusButtonStyle = computed(() => ({
  width: props.buttonSize,
  height: props.buttonSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: isRound.value ? '#1989fa' : '#f2f3f5',
  borderRadius: isRound.value ? props.buttonSize / 2 : 2,
  opacity: isMaxDisabled.value ? 0.4 : 1,
}));

const buttonTextStyle = computed(() => ({
  fontSize: props.buttonSize * 0.6,
  color: isRound.value ? '#fff' : '#323233',
  textAlign: 'center' as const,
  lineHeight: props.buttonSize,
  fontWeight: 'bold' as const,
}));

const inputStyle = computed(() => ({
  width: props.inputWidth,
  height: props.buttonSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f2f3f5',
  marginLeft: 2,
  marginRight: 2,
}));

const inputTextStyle = computed(() => ({
  fontSize: 14,
  color: props.disabled ? '#c8c9cc' : '#323233',
  textAlign: 'center' as const,
  lineHeight: props.buttonSize,
}));

function clamp(value: number): number {
  return Math.min(Math.max(value, props.min), props.max);
}

function onMinus() {
  if (isMinDisabled.value) return;
  let newValue = props.modelValue - props.step;
  if (props.integer) newValue = Math.round(newValue);
  newValue = clamp(newValue);
  emit('update:modelValue', newValue);
  emit('change', newValue);
  emit('minus');
}

function onPlus() {
  if (isMaxDisabled.value) return;
  let newValue = props.modelValue + props.step;
  if (props.integer) newValue = Math.round(newValue);
  newValue = clamp(newValue);
  emit('update:modelValue', newValue);
  emit('change', newValue);
  emit('plus');
}
</script>

<template>
  <view :style="containerStyle">
    <view :style="minusButtonStyle" @tap="onMinus">
      <text :style="{ ...buttonTextStyle, opacity: isMinDisabled ? 0.4 : 1 }">-</text>
    </view>
    <view :style="inputStyle">
      <text :style="inputTextStyle">{{ modelValue }}</text>
    </view>
    <view :style="plusButtonStyle" @tap="onPlus">
      <text :style="{ ...buttonTextStyle, opacity: isMaxDisabled ? 0.4 : 1 }">+</text>
    </view>
  </view>
</template>
