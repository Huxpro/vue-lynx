<script setup lang="ts">
import type { Picture } from '../Pictures/furnituresPictures';

defineProps<{
  picture: Picture;
}>();
</script>

<template>
  <view class="picture-wrapper">
    <image
      :style="{ width: '100%', aspectRatio: picture.width / picture.height }"
      :src="picture.src"
    />
  </view>
</template>
