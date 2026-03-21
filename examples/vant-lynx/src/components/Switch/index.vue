<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface SwitchProps {
  modelValue?: boolean;
  loading?: boolean;
  disabled?: boolean;
  size?: number | string;
  activeColor?: string;
  inactiveColor?: string;
}

const props = withDefaults(defineProps<SwitchProps>(), {
  modelValue: false,
  loading: false,
  disabled: false,
  size: 26,
  activeColor: '#1989fa',
  inactiveColor: '#fff',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
  click: [event: any];
}>();

const sizeValue = computed(() => {
  if (typeof props.size === 'string') return parseInt(props.size, 10) || 26;
  return props.size;
});

const trackStyle = computed(() => ({
  width: sizeValue.value * 2,
  height: sizeValue.value + 4,
  borderRadius: (sizeValue.value + 4) / 2,
  backgroundColor: props.modelValue ? props.activeColor : props.inactiveColor,
  borderWidth: 1,
  borderStyle: 'solid' as const,
  borderColor: props.modelValue ? props.activeColor : '#e5e5e5',
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  opacity: props.disabled ? 0.5 : 1,
  padding: 2,
}));

const thumbStyle = computed(() => ({
  width: sizeValue.value,
  height: sizeValue.value,
  borderRadius: sizeValue.value / 2,
  backgroundColor: '#fff',
  marginLeft: props.modelValue ? sizeValue.value - 2 : 0,
  borderWidth: 0.5,
  borderStyle: 'solid' as const,
  borderColor: '#e5e5e5',
}));

function onTap(event: any) {
  if (props.disabled || props.loading) return;
  const newValue = !props.modelValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
  emit('click', event);
}
</script>

<template>
  <view :style="trackStyle" @tap="onTap">
    <view :style="thumbStyle">
      <text v-if="loading" :style="{ fontSize: 12, color: props.modelValue ? props.activeColor : '#c8c9cc', textAlign: 'center', lineHeight: sizeValue }">...</text>
    </view>
  </view>
</template>
