<!--
  Lynx Limitations:
  - role/aria-checked: Lynx has no ARIA attributes
  - tabindex: Lynx has no keyboard focus model
  - cursor: Lynx is touch-only, no cursor styling
  - box-shadow on node: Lynx may not support box-shadow; uses CSS variable fallback
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import Loading from '../Loading/index.vue';
import './index.less';

export type { SwitchThemeVars } from './types';

export interface SwitchProps {
  modelValue?: unknown;
  loading?: boolean;
  disabled?: boolean;
  size?: string | number;
  activeColor?: string;
  inactiveColor?: string;
  activeValue?: unknown;
  inactiveValue?: unknown;
}

const [, bem] = createNamespace('switch');

const props = withDefaults(defineProps<SwitchProps>(), {
  modelValue: false,
  loading: false,
  disabled: false,
  activeValue: true,
  inactiveValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: unknown];
  change: [value: unknown];
}>();

const slots = useSlots();

const isChecked = computed(() => props.modelValue === props.activeValue);

const rootClass = computed(() =>
  bem([{ on: isChecked.value, loading: props.loading, disabled: props.disabled }]),
);

const rootStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.size) {
    style.fontSize = addUnit(props.size) || '';
  }
  if (isChecked.value && props.activeColor) {
    style.backgroundColor = props.activeColor;
  } else if (!isChecked.value && props.inactiveColor) {
    style.backgroundColor = props.inactiveColor;
  }
  return Object.keys(style).length > 0 ? style : undefined;
});

const loadingColor = computed(() => {
  if (isChecked.value) {
    return props.activeColor || undefined;
  }
  return props.inactiveColor || undefined;
});

function onClick() {
  if (props.disabled || props.loading) return;
  const newValue = isChecked.value ? props.inactiveValue : props.activeValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
}
</script>

<template>
  <view :class="rootClass" :style="rootStyle" @tap="onClick">
    <view :class="bem('node')">
      <Loading
        v-if="loading"
        :class="bem('loading')"
        :color="loadingColor"
      />
      <slot v-else name="node" />
    </view>
    <slot name="background" />
  </view>
</template>
