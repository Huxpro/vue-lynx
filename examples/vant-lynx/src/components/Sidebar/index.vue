<!--
  Lynx Limitations:
  - role/tablist: Not applicable in Lynx (no ARIA)
  - overflow-y: auto: Lynx does not support overflow scroll natively
  - -webkit-overflow-scrolling: Not applicable in Lynx
-->
<script setup lang="ts">
import { provide, ref } from 'vue-lynx';
import { createNamespace } from '../../utils';
import { SIDEBAR_KEY } from './types';
import './index.less';

const [, bem] = createNamespace('sidebar');

export interface SidebarProps {
  modelValue?: number | string;
}

const props = withDefaults(defineProps<SidebarProps>(), {
  modelValue: 0,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

const getActive = () => +props.modelValue;

const setActive = (value: number) => {
  if (value !== getActive()) {
    emit('update:modelValue', value);
    emit('change', value);
  }
};

const childCount = ref(0);
function getNextIndex(): number {
  return childCount.value++;
}

provide(SIDEBAR_KEY, {
  getActive,
  setActive,
  getNextIndex,
});
</script>

<template>
  <view :class="bem()">
    <slot />
  </view>
</template>
