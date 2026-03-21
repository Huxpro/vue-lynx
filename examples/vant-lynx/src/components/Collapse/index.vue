<script setup lang="ts">
import { provide, toRef } from 'vue-lynx';

export interface CollapseProps {
  modelValue?: (string | number)[] | string | number;
  accordion?: boolean;
  border?: boolean;
}

const props = withDefaults(defineProps<CollapseProps>(), {
  modelValue: () => [],
  accordion: false,
  border: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[] | string | number];
  change: [value: (string | number)[] | string | number];
}>();

function toggleItem(name: string | number) {
  if (props.accordion) {
    const newValue = props.modelValue === name ? '' : name;
    emit('update:modelValue', newValue);
    emit('change', newValue);
  } else {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = current.indexOf(name);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(name);
    }
    emit('update:modelValue', current);
    emit('change', current);
  }
}

provide('collapse', {
  modelValue: toRef(props, 'modelValue'),
  accordion: toRef(props, 'accordion'),
  toggleItem,
});

const collapseStyle = {
  borderTopWidth: props.border ? 0.5 : 0,
  borderTopStyle: 'solid' as const,
  borderTopColor: '#ebedf0',
  borderBottomWidth: props.border ? 0.5 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};
</script>

<template>
  <view :style="collapseStyle">
    <slot />
  </view>
</template>
