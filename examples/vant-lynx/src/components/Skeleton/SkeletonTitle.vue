<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import type { SkeletonTitleProps } from './types';

const [, bem] = createNamespace('skeleton-title');

const props = withDefaults(defineProps<SkeletonTitleProps>(), {
  round: false,
});

const titleClass = computed(() => bem([{ round: props.round }]));

const titleStyle = computed(() => {
  const width = addUnit(props.titleWidth);
  return width ? { width } : undefined;
});
</script>

<template>
  <view :class="titleClass" :style="titleStyle" />
</template>
