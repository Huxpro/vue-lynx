<!--
  Lynx Limitations:
  - role/aria-checked/tabindex: Lynx has no ARIA or keyboard focus
  - cursor: Lynx is touch-only, no cursor styling
  - ::before pseudo-element: icon uses <text> with font-family instead
  - dot shape: not supported (requires complex CSS pseudo-element)
-->
<script setup lang="ts">
import { computed, inject, watch, onMounted, onBeforeUnmount } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import Icon from '../Icon/index.vue';
import type { CheckboxShape, CheckboxLabelPosition, CheckboxGroupProvide } from './types';
import './index.less';

export type { CheckboxShape, CheckboxLabelPosition, CheckboxExpose, CheckboxThemeVars } from './types';

export interface CheckboxProps {
  modelValue?: boolean;
  name?: unknown;
  shape?: CheckboxShape;
  disabled?: boolean;
  labelDisabled?: boolean;
  labelPosition?: CheckboxLabelPosition;
  iconSize?: number | string;
  checkedColor?: string;
  bindGroup?: boolean;
  indeterminate?: boolean | null;
}

const [, bem] = createNamespace('checkbox');

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  shape: undefined,
  disabled: false,
  labelDisabled: false,
  labelPosition: undefined,
  iconSize: undefined,
  checkedColor: undefined,
  bindGroup: true,
  indeterminate: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
  click: [event: any];
}>();

// Inject group context
const group = inject<CheckboxGroupProvide | null>('checkboxGroup', null);
const registerChild = inject<((child: any) => () => void) | null>('checkboxGroupRegister', null);

const inGroup = computed(() => props.bindGroup && group !== null);

const isChecked = computed(() => {
  if (inGroup.value && props.name !== undefined) {
    return (group!.props.modelValue as unknown[]).indexOf(props.name) !== -1;
  }
  return !!props.modelValue;
});

const isDisabled = computed(() => {
  if (inGroup.value) {
    if (group!.props.disabled) return true;
    if (!isChecked.value) {
      const max = group!.props.max;
      if (max && (group!.props.modelValue as unknown[]).length >= +max) {
        return true;
      }
    }
  }
  return props.disabled;
});

const direction = computed(() => {
  if (inGroup.value) return group!.props.direction;
  return undefined;
});

const resolvedShape = computed(() => {
  return props.shape || (inGroup.value ? group!.props.shape : undefined) || 'round';
});

const resolvedIconSize = computed(() => {
  return props.iconSize || (inGroup.value ? group!.props.iconSize : undefined);
});

const resolvedCheckedColor = computed(() => {
  return props.checkedColor || (inGroup.value ? group!.props.checkedColor : undefined);
});

// Inline style only for dynamic checkedColor prop
const iconColorStyle = computed(() => {
  const color = resolvedCheckedColor.value;
  if (color && (isChecked.value || props.indeterminate) && !isDisabled.value) {
    return { borderColor: color, backgroundColor: color };
  }
  return undefined;
});

const iconSizeStyle = computed(() => {
  const size = resolvedIconSize.value;
  if (size) return { fontSize: addUnit(size) };
  return undefined;
});

const iconClass = computed(() =>
  bem('icon', [
    resolvedShape.value,
    {
      disabled: isDisabled.value,
      checked: isChecked.value,
      indeterminate: !!props.indeterminate,
    },
  ]),
);

const labelClass = computed(() =>
  bem('label', [
    props.labelPosition,
    { disabled: isDisabled.value },
  ]),
);

const rootClass = computed(() =>
  bem([
    {
      disabled: isDisabled.value,
      'label-disabled': props.labelDisabled,
    },
    direction.value,
  ]),
);

function setParentValue(checked: boolean) {
  const { name } = props;
  const value = [...(group!.props.modelValue as unknown[])];

  if (checked) {
    const max = group!.props.max;
    const overlimit = max && value.length >= +max;
    if (!overlimit && !value.includes(name)) {
      value.push(name);
      group!.updateValue(value);
    }
  } else {
    const index = value.indexOf(name);
    if (index !== -1) {
      value.splice(index, 1);
      group!.updateValue(value);
    }
  }
}

function toggle(newValue?: boolean) {
  const val = newValue !== undefined ? newValue : !isChecked.value;
  if (inGroup.value) {
    setParentValue(val);
  } else {
    emit('update:modelValue', val);
  }
  if (props.indeterminate !== null) emit('change', val);
}

function onClick(event: any) {
  if (isDisabled.value) {
    emit('click', event);
    return;
  }
  // Determine if icon was tapped or label was tapped
  // We always emit click; toggle only when allowed
  emit('click', event);
}

function onIconTap(event: any) {
  if (!isDisabled.value) {
    toggle();
  }
  emit('click', event);
}

function onLabelTap(event: any) {
  if (!isDisabled.value && !props.labelDisabled) {
    toggle();
  }
  emit('click', event);
}

watch(
  () => props.modelValue,
  (value) => {
    if (props.indeterminate === null) emit('change', value);
  },
);

// Register with parent CheckboxGroup for toggleAll support
let unregister: (() => void) | null = null;
onMounted(() => {
  if (inGroup.value && registerChild) {
    unregister = registerChild({ toggle, props, checked: isChecked });
  }
});
onBeforeUnmount(() => {
  unregister?.();
});

defineExpose({ toggle, checked: isChecked });
</script>

<template>
  <view :class="rootClass">
    <view
      v-if="labelPosition === 'left'"
      :class="labelClass"
      @tap="onLabelTap"
    >
      <slot :checked="isChecked" :disabled="isDisabled" />
    </view>
    <view :class="iconClass" :style="iconSizeStyle" @tap="onIconTap">
      <slot name="icon" :checked="isChecked" :disabled="isDisabled">
        <Icon
          :name="indeterminate ? 'minus' : 'success'"
          :style="iconColorStyle"
          class="van-icon"
        />
      </slot>
    </view>
    <view
      v-if="labelPosition !== 'left'"
      :class="labelClass"
      @tap="onLabelTap"
    >
      <slot :checked="isChecked" :disabled="isDisabled" />
    </view>
  </view>
</template>
