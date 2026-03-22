<!--
  Lynx Limitations:
  - role/aria-checked/tabindex: Lynx has no ARIA or keyboard focus
  - cursor: Lynx is touch-only, no cursor styling
  - ::before pseudo-element: icon uses <text> with font-family instead
  - overflow: hidden: Lynx default is visible, not critical for radio
-->
<script setup lang="ts">
import { computed, inject } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import { iconCharMap } from '../Icon/icon-map';
import type { RadioShape, RadioLabelPosition, RadioGroupProvide } from './types';
import './index.less';

export type { RadioShape, RadioLabelPosition, RadioThemeVars } from './types';

export interface RadioProps {
  name?: unknown;
  shape?: RadioShape;
  disabled?: boolean;
  labelDisabled?: boolean;
  labelPosition?: RadioLabelPosition;
  iconSize?: number | string;
  modelValue?: unknown;
  checkedColor?: string;
}

const [, bem] = createNamespace('radio');

const props = withDefaults(defineProps<RadioProps>(), {
  shape: undefined,
  disabled: false,
  labelDisabled: false,
  labelPosition: undefined,
  iconSize: undefined,
  modelValue: undefined,
  checkedColor: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: unknown];
  click: [event: any];
}>();

// Inject from RadioGroup (if present)
const group = inject<RadioGroupProvide | null>('vanRadioGroup', null);

const getParentProp = <T extends keyof RadioGroupProvide['props']>(name: T) => {
  if (group) return group.props[name];
};

const isChecked = computed(() => {
  const value = group ? group.props.modelValue : props.modelValue;
  return value === props.name;
});

const isDisabled = computed(() => {
  return getParentProp('disabled') || props.disabled;
});

const direction = computed(() => getParentProp('direction'));

const resolvedShape = computed<RadioShape>(() => {
  return props.shape || (getParentProp('shape') as RadioShape | undefined) || 'round';
});

// Inline style only for dynamic checkedColor prop (matching Vant's Checker)
const iconColorStyle = computed(() => {
  const checkedColor = props.checkedColor || getParentProp('checkedColor');
  if (checkedColor && isChecked.value && !isDisabled.value) {
    return {
      borderColor: checkedColor,
      backgroundColor: checkedColor,
    };
  }
  return undefined;
});

const iconSizeStyle = computed(() => {
  const iconSize = props.iconSize || getParentProp('iconSize');
  if (iconSize) {
    if (resolvedShape.value === 'dot') {
      return { width: addUnit(iconSize), height: addUnit(iconSize) };
    }
    return { fontSize: addUnit(iconSize) };
  }
  return undefined;
});

// Dot shape border color style (for dot, checkedColor affects the outer border)
const dotBorderStyle = computed(() => {
  const checkedColor = props.checkedColor || getParentProp('checkedColor');
  if (resolvedShape.value === 'dot' && checkedColor && isChecked.value && !isDisabled.value) {
    return { borderColor: checkedColor };
  }
  return undefined;
});

// Dot inner icon background style
const dotIconStyle = computed(() => {
  const checkedColor = props.checkedColor || getParentProp('checkedColor');
  if (checkedColor && isChecked.value && !isDisabled.value) {
    return { backgroundColor: checkedColor };
  }
  return undefined;
});

const iconClass = computed(() =>
  bem('icon', [
    resolvedShape.value,
    {
      disabled: isDisabled.value,
      checked: isChecked.value,
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

function toggle() {
  if (group) {
    group.updateValue(props.name);
  } else {
    emit('update:modelValue', props.name);
  }
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

const iconChar = computed(() => iconCharMap['success'] || '\ue728');
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
    <view
      v-if="resolvedShape !== 'dot'"
      :class="iconClass"
      :style="iconSizeStyle"
      @tap="onIconTap"
    >
      <slot name="icon" :checked="isChecked" :disabled="isDisabled">
        <view :class="['van-icon', 'van-icon-success']" :style="iconColorStyle">
          <text class="van-icon__font">{{ iconChar }}</text>
        </view>
      </slot>
    </view>
    <view
      v-else
      :class="iconClass"
      :style="[iconSizeStyle, dotBorderStyle]"
      @tap="onIconTap"
    >
      <slot name="icon" :checked="isChecked" :disabled="isDisabled">
        <view :class="bem('icon', ['dot__icon'])" :style="dotIconStyle" />
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
