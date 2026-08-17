<script setup lang="ts">
import { assetUrl } from '../../lib/api';

/** Port of FilePreview's zoom overlay (Teleport + AnimatePresence -> root overlay). */
defineProps<{ url: string; name?: string }>();

const emit = defineEmits<{ close: [result: false] }>();
</script>

<template>
  <view class="absolute inset-0 z-50 items-center justify-center flex" @tap="emit('close', false)">
    <view class="absolute inset-0 z-40 lightbox-backdrop" />
    <image :src="assetUrl(url)" class="lightbox-image rounded-md z-50" resize="contain" />
  </view>
</template>

<style>
.lightbox-backdrop {
  background-color: rgba(0, 0, 0, 0.75);
}
.lightbox-image {
  width: 90%;
  height: 85%;
}
</style>
