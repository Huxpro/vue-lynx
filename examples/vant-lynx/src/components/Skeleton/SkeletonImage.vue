<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import Icon from '../Icon/index.vue';
import type { SkeletonImageProps } from './types';

const [, bem] = createNamespace('skeleton-image');

const props = withDefaults(defineProps<SkeletonImageProps>(), {
  imageShape: 'square',
});

const imageClass = computed(() => bem([props.imageShape]));
const iconClass = bem('icon');

const imageStyle = computed(() => {
  if (!props.imageSize) return undefined;
  const size = addUnit(props.imageSize);
  return size ? { width: size, height: size } : undefined;
});
</script>

<template>
  <view :class="imageClass" :style="imageStyle">
    <Icon name="photo" :class="iconClass" />
  </view>
</template>
