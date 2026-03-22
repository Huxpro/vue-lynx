<!--
  Lynx Limitations:
  - overflow: hidden not fully supported; Lynx uses clipping differently
-->
<script setup lang="ts">
import { createNamespace } from '../../utils';
import { useChildren } from '../../composables/useChildren';
import { STEPS_KEY, type StepsDirection } from './types';
import './index.less';

const [, bem] = createNamespace('steps');

const props = withDefaults(
  defineProps<{
    active?: number | string;
    direction?: StepsDirection;
    activeIcon?: string;
    iconPrefix?: string;
    finishIcon?: string;
    activeColor?: string;
    inactiveIcon?: string;
    inactiveColor?: string;
  }>(),
  {
    active: 0,
    direction: 'horizontal',
    activeIcon: 'checked',
  },
);

const emit = defineEmits<{
  clickStep: [index: number];
}>();

const onClickStep = (index: number) => emit('clickStep', index);

const { linkChildren } = useChildren(STEPS_KEY);

linkChildren({
  props,
  onClickStep,
});
</script>

<template>
  <view :class="bem([direction])">
    <view :class="bem('items')">
      <slot />
    </view>
  </view>
</template>
