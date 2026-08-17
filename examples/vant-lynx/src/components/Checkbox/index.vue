<!--
  Vant Feature Parity Report:
  - Props: 7/8 supported (name, shape, disabled, labelDisabled, labelPosition, iconSize, checkedColor, bindGroup)
    Missing: indeterminate
  - Events: 3/3 supported (update:modelValue, change, click)
  - Slots: 2/2 supported (default, icon)
  - Gaps: indeterminate prop not implemented
-->
<script setup lang="ts">
import { computed, inject, watch, type Ref } from 'vue-lynx';

export interface CheckboxProps {
  modelValue?: boolean;
  name?: string;
  shape?: 'square' | 'round';
  disabled?: boolean;
  labelDisabled?: boolean;
  labelPosition?: 'left' | 'right';
  iconSize?: number | string;
  checkedColor?: string;
  bindGroup?: boolean;
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  shape: undefined,
  disabled: false,
  labelDisabled: false,
  labelPosition: 'right',
  iconSize: undefined,
  checkedColor: undefined,
  bindGroup: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
  click: [event: any];
}>();

// Inject group context (provided by CheckboxGroup)
const groupProps = inject<{
  modelValue: Ref<any[]>;
  disabled: Ref<boolean>;
  max: Ref<number>;
  iconSize: Ref<number | string | undefined>;
  checkedColor: Ref<string | undefined>;
  shape: Ref<'square' | 'round' | undefined>;
  toggleItem: (name: string) => void;
  updateValue: (value: any[]) => void;
} | null>('checkboxGroup', null);

// Whether this checkbox participates in group
const inGroup = computed(() => props.bindGroup && groupProps !== null);

const isChecked = computed(() => {
  if (inGroup.value && props.name !== undefined) {
    return groupProps!.modelValue.value.includes(props.name);
  }
  return props.modelValue;
});

const isDisabled = computed(() => {
  if (inGroup.value) {
    // If group is disabled, this checkbox is disabled
    if (groupProps!.disabled.value) return true;

    // Vant behavior: when max is reached, unchecked items become disabled
    const max = groupProps!.max.value;
    if (max > 0 && !isChecked.value) {
      const checkedCount = groupProps!.modelValue.value.length;
      if (checkedCount >= max) return true;
    }
  }
  return props.disabled;
});

// Resolve iconSize: props > group > default
const resolvedIconSize = computed(() => {
  if (props.iconSize !== undefined) return props.iconSize;
  if (inGroup.value && groupProps!.iconSize.value !== undefined) {
    return groupProps!.iconSize.value;
  }
  return 20;
});

// Resolve checkedColor: props > group > default
const resolvedCheckedColor = computed(() => {
  if (props.checkedColor !== undefined) return props.checkedColor;
  if (inGroup.value && groupProps!.checkedColor.value !== undefined) {
    return groupProps!.checkedColor.value;
  }
  return '#1989fa';
});

// Resolve shape: props > group > default
const resolvedShape = computed(() => {
  if (props.shape !== undefined) return props.shape;
  if (inGroup.value && groupProps!.shape.value !== undefined) {
    return groupProps!.shape.value;
  }
  return 'round';
});

const iconSizeNum = computed(() => {
  const size = resolvedIconSize.value;
  if (typeof size === 'string') return parseInt(size, 10) || 20;
  return size;
});

const iconStyle = computed(() => ({
  width: iconSizeNum.value,
  height: iconSizeNum.value,
  borderRadius: resolvedShape.value === 'round' ? iconSizeNum.value / 2 : 3,
  borderWidth: 1,
  borderStyle: 'solid' as const,
  borderColor: isChecked.value && !isDisabled.value ? resolvedCheckedColor.value : '#c8c9cc',
  backgroundColor: isChecked.value
    ? isDisabled.value
      ? '#c8c9cc'
      : resolvedCheckedColor.value
    : isDisabled.value
      ? '#ebedf0'
      : '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: isDisabled.value ? 0.5 : 1,
}));

const labelStyle = computed(() => ({
  marginLeft: props.labelPosition === 'right' ? 8 : 0,
  marginRight: props.labelPosition === 'left' ? 8 : 0,
  opacity: isDisabled.value ? 0.5 : 1,
}));

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.labelPosition === 'left' ? ('row-reverse' as const) : ('row' as const),
  alignItems: 'center',
}));

function toggle(newValue?: boolean) {
  const val = newValue !== undefined ? newValue : !isChecked.value;
  if (inGroup.value && props.name !== undefined) {
    // In group mode, toggle via group
    const current = [...groupProps!.modelValue.value];
    const index = current.indexOf(props.name);
    if (val && index === -1) {
      const max = groupProps!.max.value;
      if (max > 0 && current.length >= max) return;
      current.push(props.name);
      groupProps!.updateValue(current);
    } else if (!val && index > -1) {
      current.splice(index, 1);
      groupProps!.updateValue(current);
    }
  } else {
    emit('update:modelValue', val);
  }
}

function onIconTap(event: any) {
  if (isDisabled.value) return;
  toggle();
  emit('click', event);
}

function onLabelTap(event: any) {
  if (isDisabled.value) return;
  if (props.labelDisabled) return;
  toggle();
  emit('click', event);
}

// Watch standalone modelValue to emit change
watch(
  () => props.modelValue,
  (value) => {
    if (!inGroup.value) {
      emit('change', value);
    }
  },
);

defineExpose({ toggle, checked: isChecked });
</script>

<template>
  <view :style="containerStyle">
    <view :style="iconStyle" @tap="onIconTap">
      <slot name="icon" :checked="isChecked" :disabled="isDisabled">
        <text
          v-if="isChecked"
          :style="{
            fontSize: iconSizeNum * 0.7,
            color: '#fff',
            lineHeight: iconSizeNum,
          }"
        >&#10003;</text>
      </slot>
    </view>
    <view :style="labelStyle" @tap="onLabelTap">
      <slot :checked="isChecked" :disabled="isDisabled" />
    </view>
  </view>
</template>
