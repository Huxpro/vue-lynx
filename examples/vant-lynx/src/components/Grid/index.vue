<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as view (Lynx has no HTML elements)
  - ::after hairline border: uses direct 0.5px CSS border instead of pseudo-element
-->
<script setup lang="ts">
import { computed, provide, ref } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import { GRID_KEY, type GridDirection } from './types';
import './index.less';

export interface GridProps {
  square?: boolean;
  center?: boolean;
  border?: boolean;
  gutter?: number | string;
  reverse?: boolean;
  iconSize?: number | string;
  direction?: GridDirection;
  clickable?: boolean;
  columnNum?: number | string;
}

const props = withDefaults(defineProps<GridProps>(), {
  center: true,
  border: true,
  columnNum: 4,
});

const [, bem] = createNamespace('grid');

// Simple child index registration (mirrors Vant's useChildren index)
const childCount = ref(0);
function registerChild(): number {
  return childCount.value++;
}

provide(GRID_KEY, { props, registerChild });

const gridClass = computed(() => [
  bem(),
  { 'van-hairline--top': props.border && !props.gutter },
]);

const gridStyle = computed(() => {
  if (props.gutter) {
    return { paddingLeft: addUnit(props.gutter) };
  }
  return undefined;
});
</script>

<template>
  <view :class="gridClass" :style="gridStyle">
    <slot />
  </view>
</template>
