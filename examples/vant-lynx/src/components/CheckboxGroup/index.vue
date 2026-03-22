<!--
  Lynx Limitations:
  - role/aria: Lynx has no ARIA attributes
  - useCustomFieldValue: not ported (Form integration requires @vant/use)
-->
<script setup lang="ts">
import { computed, provide, watch, reactive, shallowReactive, toRefs } from 'vue-lynx';
import { createNamespace } from '../../utils';
import type {
  CheckboxShape,
  CheckboxGroupDirection,
  CheckboxGroupToggleAllOptions,
  CheckboxGroupProvide,
} from './types';
import './index.less';

export interface CheckboxGroupProps {
  modelValue?: unknown[];
  max?: number | string;
  disabled?: boolean;
  iconSize?: number | string;
  direction?: CheckboxGroupDirection;
  checkedColor?: string;
  shape?: CheckboxShape;
}

const [, bem] = createNamespace('checkbox-group');

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
  modelValue: () => [],
  max: undefined,
  disabled: false,
  direction: undefined,
  shape: 'round',
});

const emit = defineEmits<{
  'update:modelValue': [value: unknown[]];
  change: [value: unknown[]];
}>();

// Child registration (mirrors Vant's useChildren pattern)
// Must use shallowReactive to avoid unwrapping computed refs inside child objects
const children: Array<{ toggle: (val?: boolean) => void; props: any; checked: { value: boolean } }> = shallowReactive([]);

function registerChild(child: { toggle: (val?: boolean) => void; props: any; checked: { value: boolean } }) {
  children.push(child);
  return () => {
    const idx = children.indexOf(child);
    if (idx !== -1) children.splice(idx, 1);
  };
}

function updateValue(value: unknown[]) {
  emit('update:modelValue', value);
}

function toggleAll(options: CheckboxGroupToggleAllOptions = {}) {
  if (typeof options === 'boolean') {
    options = { checked: options };
  }

  const { checked, skipDisabled } = options;

  const checkedChildren = children.filter((item: any) => {
    if (!item.props.bindGroup) return false;
    if (item.props.disabled && skipDisabled) {
      return item.checked.value;
    }
    return checked ?? !item.checked.value;
  });

  const names = checkedChildren.map((item: any) => item.props.name);
  updateValue(names);
}

watch(
  () => props.modelValue,
  (value) => emit('change', value),
);

const groupProvide: CheckboxGroupProvide = {
  props: reactive({
    ...toRefs(props),
  }) as any,
  updateValue,
};

provide('checkboxGroup', groupProvide);
provide('checkboxGroupRegister', registerChild);

defineExpose({ toggleAll });
</script>

<template>
  <view :class="bem([direction])">
    <slot />
  </view>
</template>
