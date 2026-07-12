<script setup lang="ts">
// Ported from elk: app/components/modal/ModalMediaPreview.vue (reduced:
// single image + description, no carousel/zoom). Elk drives this through
// its dialog composable; here a module-level ref (openMediaPreview).
import { mediaPreview } from '../composables/media-preview';
import AppIcon from './AppIcon.vue';

function close() {
  mediaPreview.value = null;
}
</script>

<template>
  <Transition name="media-preview">
    <view v-if="mediaPreview" class="media-preview" @tap="close">
      <image
        :src="mediaPreview.url"
        class="media-preview-img"
        mode="aspectFit"
      />
      <view class="media-preview-close" @tap="close">
        <AppIcon name="close-line" :size="22" color="#ffffff" />
      </view>
      <view v-if="mediaPreview.description" class="media-preview-alt">
        <text class="media-preview-alt-text" :text-maxline="4">{{ mediaPreview.description }}</text>
      </view>
    </view>
  </Transition>
</template>

<style>
.media-preview {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.media-preview-img {
  width: 100%;
  height: 80%;
  transform: scale(1);
  transition: transform var(--motion-modal) var(--ease-out-quart);
}

.media-preview-close {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
}

.media-preview-alt {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 16px 24px;
  background-color: rgba(0, 0, 0, 0.6);
}

.media-preview-alt-text {
  color: #dddddd;
  font-size: 13px;
  line-height: 19px;
}

.media-preview-enter-active,
.media-preview-leave-active {
  transition: opacity var(--motion-modal) var(--ease-out-quart);
}

.media-preview-enter-from,
.media-preview-leave-to {
  opacity: 0;
}

.media-preview-enter-from .media-preview-img,
.media-preview-leave-to .media-preview-img {
  transform: scale(0.97);
}
</style>
