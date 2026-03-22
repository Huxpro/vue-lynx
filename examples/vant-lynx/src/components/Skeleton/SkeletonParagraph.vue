<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils';
import type { SkeletonParagraphProps } from './types';

const DEFAULT_ROW_WIDTH = '100%';

const [, bem] = createNamespace('skeleton-paragraph');

const props = withDefaults(defineProps<SkeletonParagraphProps>(), {
  round: false,
  rowWidth: DEFAULT_ROW_WIDTH,
});

const paragraphClass = computed(() => bem([{ round: props.round }]));

const paragraphStyle = computed(() => {
  return props.rowWidth ? { width: String(props.rowWidth) } : undefined;
});
</script>

<template>
  <view :class="paragraphClass" :style="paragraphStyle" />
</template>
