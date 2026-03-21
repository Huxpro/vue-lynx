<!--
  Vant Feature Parity Report:
  - Props: 6/6 supported (modelValue, max, disabled, iconSize, direction, checkedColor, shape)
  - Events: 2/2 supported (update:modelValue, change)
  - Slots: 1/1 supported (default)
  - Gaps: toggleAll only supports checked:false (clear); checked:true requires child registration
    (useChildren) which is not available in this Lynx adaptation. skipDisabled option in toggleAll
    is not functional without child refs.
-->
<script setup lang="ts">
import { computed, provide, toRef, watch } from 'vue-lynx';

export interface CheckboxGroupProps {
  modelValue?: any[];
  max?: number;
  disabled?: boolean;
  direction?: 'horizontal' | 'vertical';
  iconSize?: number | string;
  checkedColor?: string;
  shape?: 'square' | 'round';
}

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
  modelValue: () => [],
  max: 0,
  direction: 'vertical',
  disabled: false,
  shape: 'round',
});

const emit = defineEmits<{
  'update:modelValue': [value: any[]];
  change: [value: any[]];
}>();

function updateValue(value: any[]) {
  emit('update:modelValue', value);
  emit('change', value);
}

function toggleItem(name: string) {
  const current = [...props.modelValue];
  const index = current.indexOf(name);
  if (index > -1) {
    current.splice(index, 1);
  } else {
    if (props.max > 0 && current.length >= props.max) return;
    current.push(name);
  }
  updateValue(current);
}

/**
 * Toggle all checkboxes.
 * @param options - boolean or { checked?: boolean, skipDisabled?: boolean }
 *   - true/false: check/uncheck all
 *   - { checked: true/false }: check/uncheck all
 *   - { skipDisabled: true }: skip disabled items during toggle
 */
function toggleAll(options: boolean | { checked?: boolean; skipDisabled?: boolean } = {}) {
  // This is exposed via defineExpose for parent component access.
  // In group context, we emit the new value through updateValue.
  // Note: without useChildren, we can only toggle based on current modelValue.
  if (typeof options === 'boolean') {
    options = { checked: options };
  }
  const { checked } = options;
  if (checked === true) {
    // Check all - we don't know all names without child registration,
    // so this is a best-effort. The parent should pass names if needed.
    // For now, keep current value (parent can use v-model directly).
  } else if (checked === false) {
    updateValue([]);
  }
}

watch(
  () => props.modelValue,
  (value) => emit('change', value),
);

provide('checkboxGroup', {
  modelValue: toRef(props, 'modelValue'),
  disabled: toRef(props, 'disabled'),
  max: toRef(props, 'max'),
  iconSize: toRef(props, 'iconSize'),
  checkedColor: toRef(props, 'checkedColor'),
  shape: toRef(props, 'shape'),
  toggleItem,
  updateValue,
});

const groupStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.direction === 'horizontal' ? ('row' as const) : ('column' as const),
  flexWrap: 'wrap' as const,
  gap: 12,
}));

defineExpose({ toggleAll });
</script>

<template>
  <view :style="groupStyle">
    <slot />
  </view>
</template>
