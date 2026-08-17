<!--
  Vant Feature Parity Report:
  - Props: 7/7 supported (name, shape, disabled, labelDisabled, labelPosition, iconSize, checkedColor)
  - Events: 2/2 supported (update:modelValue, click)
  - Slots: 2/2 supported (default, icon)
  - Gaps: shape 'dot' is implemented via custom rendering (colored inner dot) rather than Vant Icon;
    no standalone modelValue support (Radio always requires RadioGroup or manual v-model binding)
-->
<script setup lang="ts">
import { computed, inject, type Ref } from 'vue-lynx';

export type RadioShape = 'dot' | 'square' | 'round';

export interface RadioProps {
  name?: string | number;
  shape?: RadioShape;
  disabled?: boolean;
  labelDisabled?: boolean;
  labelPosition?: 'left' | 'right';
  iconSize?: number | string;
  checkedColor?: string;
}

const props = withDefaults(defineProps<RadioProps>(), {
  disabled: false,
  labelDisabled: false,
  labelPosition: 'right',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined];
  click: [event: any];
}>();

// Inject from RadioGroup (if present)
const groupProps = inject<{
  modelValue: Ref<any>;
  disabled: Ref<boolean>;
  direction: Ref<string>;
  iconSize: Ref<number | string | undefined>;
  checkedColor: Ref<string | undefined>;
  shape: Ref<RadioShape | undefined>;
  updateValue: (name: any) => void;
} | null>('radioGroup', null);

// Resolved props: local prop wins, then group prop, then default
const resolvedShape = computed<RadioShape>(() => {
  return props.shape || groupProps?.shape.value || 'round';
});

const resolvedIconSize = computed(() => {
  const raw = props.iconSize ?? groupProps?.iconSize.value ?? 20;
  if (typeof raw === 'string') return parseInt(raw, 10) || 20;
  return raw;
});

const resolvedCheckedColor = computed(() => {
  return props.checkedColor || groupProps?.checkedColor.value || '#1989fa';
});

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

// --- Styles ---

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.labelPosition === 'left' ? 'row-reverse' as const : 'row' as const,
  alignItems: 'center',
  opacity: isDisabled.value ? 0.5 : 1,
}));

const iconWrapperStyle = computed(() => {
  const size = resolvedIconSize.value;
  const shape = resolvedShape.value;
  const checked = isChecked.value;
  const color = resolvedCheckedColor.value;

  if (shape === 'dot') {
    // Dot shape: a circle border, with a colored inner dot when checked
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: checked && !isDisabled.value ? color : '#c8c9cc',
      backgroundColor: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }

  // Round or square shape: filled background when checked
  return {
    width: size,
    height: size,
    borderRadius: shape === 'round' ? size / 2 : 3,
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: checked ? color : '#c8c9cc',
    backgroundColor: checked ? color : '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
});

const checkmarkStyle = computed(() => {
  const size = resolvedIconSize.value;
  return {
    fontSize: size * 0.7,
    color: '#fff',
    lineHeight: size,
  };
});

const dotInnerStyle = computed(() => {
  const size = resolvedIconSize.value;
  const color = resolvedCheckedColor.value;
  return {
    width: size * 0.5,
    height: size * 0.5,
    borderRadius: size * 0.25,
    backgroundColor: color,
  };
});

const labelStyle = computed(() => ({
  marginLeft: props.labelPosition === 'right' ? 8 : 0,
  marginRight: props.labelPosition === 'left' ? 8 : 0,
}));

// --- Events ---

function toggle() {
  if (groupProps) {
    groupProps.updateValue(props.name);
  } else {
    emit('update:modelValue', props.name);
  }
}

function onIconTap(event: any) {
  if (isDisabled.value) return;
  toggle();
  emit('click', event);
}

function onLabelTap(event: any) {
  if (isDisabled.value) return;
  if (props.labelDisabled) {
    // Only emit click, do not toggle
    emit('click', event);
    return;
  }
  toggle();
  emit('click', event);
}
</script>

<template>
  <view :style="containerStyle">
    <!-- Icon area -->
    <view :style="iconWrapperStyle" @tap="onIconTap">
      <slot name="icon" :checked="isChecked" :disabled="isDisabled">
        <!-- Default icon rendering based on shape -->
        <template v-if="resolvedShape === 'dot'">
          <view v-if="isChecked" :style="dotInnerStyle" />
        </template>
        <template v-else>
          <text v-if="isChecked" :style="checkmarkStyle">&#10003;</text>
        </template>
      </slot>
    </view>
    <!-- Label area -->
    <view :style="labelStyle" @tap="onLabelTap">
      <slot :checked="isChecked" :disabled="isDisabled" />
    </view>
  </view>
</template>
