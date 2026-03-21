<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export interface RadioProps {
  name?: string | number;
  shape?: 'square' | 'round';
  disabled?: boolean;
  labelPosition?: 'left' | 'right';
  iconSize?: number | string;
  checkedColor?: string;
}

const props = withDefaults(defineProps<RadioProps>(), {
  shape: 'round',
  disabled: false,
  labelPosition: 'right',
  iconSize: 20,
  checkedColor: '#1989fa',
});

const emit = defineEmits<{
  click: [event: any];
}>();

const groupProps = inject<{
  modelValue: Ref<any>;
  disabled: Ref<boolean>;
  updateValue: (name: any) => void;
} | null>('radioGroup', null);

const isChecked = computed(() => {
  if (groupProps) {
    return groupProps.modelValue.value === props.name;
  }
  return false;
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
  if (groupProps) {
    groupProps.updateValue(props.name);
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
      <view
        v-if="isChecked"
        :style="{
          width: iconSizeNum * 0.5,
          height: iconSizeNum * 0.5,
          borderRadius: iconSizeNum * 0.25,
          backgroundColor: '#fff',
        }"
      />
    </view>
    <view :style="{ marginLeft: labelPosition === 'right' ? 8 : 0, marginRight: labelPosition === 'left' ? 8 : 0 }">
      <slot />
    </view>
  </view>
</template>
