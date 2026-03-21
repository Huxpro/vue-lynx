<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface CheckboxProps {
  modelValue?: boolean;
  name?: string;
  shape?: 'square' | 'round';
  disabled?: boolean;
  labelPosition?: 'left' | 'right';
  iconSize?: number | string;
  checkedColor?: string;
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  shape: 'round',
  disabled: false,
  labelPosition: 'right',
  iconSize: 20,
  checkedColor: '#1989fa',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
  click: [event: any];
}>();

const groupProps = inject<{
  modelValue: Ref<any[]>;
  disabled: Ref<boolean>;
  max: Ref<number>;
  toggleItem: (name: string) => void;
} | null>('checkboxGroup', null);

const isChecked = computed(() => {
  if (groupProps && props.name) {
    return groupProps.modelValue.value.includes(props.name);
  }
  return props.modelValue;
});

const isDisabled = computed(() => {
  if (groupProps?.disabled.value) return true;
  return props.disabled;
});

const iconSizeNum = computed(() => {
  if (typeof props.iconSize === 'string') return parseInt(props.iconSize, 10) || 20;
  return props.iconSize;
});

const iconStyle = computed(() => ({
  width: iconSizeNum.value,
  height: iconSizeNum.value,
  borderRadius: props.shape === 'round' ? iconSizeNum.value / 2 : 3,
  borderWidth: 1,
  borderStyle: 'solid' as const,
  borderColor: isChecked.value ? props.checkedColor : '#c8c9cc',
  backgroundColor: isChecked.value ? props.checkedColor : '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: isDisabled.value ? 0.5 : 1,
}));

function onTap(event: any) {
  if (isDisabled.value) return;
  if (groupProps && props.name) {
    groupProps.toggleItem(props.name);
  } else {
    const newValue = !props.modelValue;
    emit('update:modelValue', newValue);
    emit('change', newValue);
  }
  emit('click', event);
}
</script>

<template>
  <view
    :style="{ display: 'flex', flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row', alignItems: 'center' }"
    @tap="onTap"
  >
    <view :style="iconStyle">
      <text v-if="isChecked" :style="{ fontSize: iconSizeNum * 0.7, color: '#fff', lineHeight: iconSizeNum }">&#10003;</text>
    </view>
    <view :style="{ marginLeft: labelPosition === 'right' ? 8 : 0, marginRight: labelPosition === 'left' ? 8 : 0 }">
      <slot />
    </view>
  </view>
</template>
