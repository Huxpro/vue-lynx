<script setup lang="ts">
import { computed, provide, toRef } from 'vue-lynx';

export interface StepsProps {
  active?: number;
  direction?: 'horizontal' | 'vertical';
  activeColor?: string;
  inactiveColor?: string;
  activeIcon?: string;
  finishIcon?: string;
}

const props = withDefaults(defineProps<StepsProps>(), {
  active: 0,
  direction: 'horizontal',
  activeColor: '#07c160',
  inactiveColor: '#969799',
});

const emit = defineEmits<{
  'click-step': [index: number];
}>();

function onClickStep(index: number) {
  emit('click-step', index);
}

provide('steps', {
  active: toRef(props, 'active'),
  direction: toRef(props, 'direction'),
  activeColor: toRef(props, 'activeColor'),
  inactiveColor: toRef(props, 'inactiveColor'),
  activeIcon: toRef(props, 'activeIcon'),
  finishIcon: toRef(props, 'finishIcon'),
  onClickStep,
});

const stepsStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.direction === 'horizontal' ? ('row' as const) : ('column' as const),
  padding: 10,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
}));
</script>

<template>
  <view :style="stepsStyle">
    <slot />
  </view>
</template>
