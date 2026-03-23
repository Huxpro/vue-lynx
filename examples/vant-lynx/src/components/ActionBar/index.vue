<!--
  Lynx Limitations:
  - placeholder: Uses fixed height spacer; no getBoundingClientRect to auto-measure
  - safeAreaInsetBottom: env(safe-area-inset-bottom) may not work in Lynx; class applied for compat
  - position: fixed: Works in Lynx but promotes under root node
-->
<script setup lang="ts">
import { provide, shallowReactive } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { ACTION_BAR_KEY, type ActionBarChild } from './types';
import './index.less';

export interface ActionBarProps {
  placeholder?: boolean;
  safeAreaInsetBottom?: boolean;
}

const props = withDefaults(defineProps<ActionBarProps>(), {
  placeholder: false,
  safeAreaInsetBottom: true,
});

const [, bem] = createNamespace('action-bar');

const children = shallowReactive<ActionBarChild[]>([]);

const registerChild = (child: ActionBarChild): number => {
  const index = children.length;
  children.push(child);
  return index;
};

provide(ACTION_BAR_KEY, {
  registerChild,
  children,
});
</script>

<template>
  <view v-if="placeholder" class="van-action-bar__placeholder" />
  <view :class="[bem(), { 'van-safe-area-bottom': safeAreaInsetBottom }]">
    <slot />
  </view>
</template>
