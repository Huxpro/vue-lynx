<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import type { SkeletonAvatarProps } from './types';

const [, bem] = createNamespace('skeleton-avatar');

const props = withDefaults(defineProps<SkeletonAvatarProps>(), {
  avatarShape: 'round',
});

const avatarClass = computed(() => bem([props.avatarShape]));

const avatarStyle = computed(() => {
  if (!props.avatarSize) return undefined;
  const size = addUnit(props.avatarSize);
  return size ? { width: size, height: size } : undefined;
});
</script>

<template>
  <view :class="avatarClass" :style="avatarStyle" />
</template>
