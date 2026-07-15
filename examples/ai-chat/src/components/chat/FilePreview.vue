<script setup lang="ts">
import { useOverlay } from '../../composables/useOverlay';
import { assetUrl } from '../../lib/api';
import { fileIcon } from '../../lib/file-icon';
import Icon from '../ui/Icon.vue';

/**
 * Port of app/components/chat/FilePreview.vue: thumbnail chip with
 * uploading/error state, remove button, and tap-to-zoom (fullscreen
 * lightbox overlay instead of Teleport + motion springs).
 */
const props = withDefaults(
  defineProps<{
    name: string;
    type: string;
    previewUrl?: string;
    size?: number;
    status?: 'idle' | 'uploading' | 'uploaded' | 'error';
    removable?: boolean;
  }>(),
  { status: 'idle', removable: false, size: 56 },
);

const emit = defineEmits<{ remove: [] }>();

const overlay = useOverlay();

function openZoom() {
  if (props.type.startsWith('image/') && props.previewUrl) {
    overlay.open('lightbox', { url: props.previewUrl, name: props.name });
  }
}
</script>

<template>
  <view class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <view
      class="rounded-lg overflow-hidden bg-elevated items-center justify-center flex w-full h-full"
      :class="status === 'uploading' ? 'opacity-50' : ''"
      @tap="openZoom"
    >
      <image
        v-if="type.startsWith('image/') && previewUrl"
        :src="assetUrl(previewUrl)"
        resize="cover"
        class="w-full h-full"
      />
      <Icon v-else :name="fileIcon(type, name)" tone="muted" :size="Math.round(size * 0.4)" />
    </view>

    <view
      v-if="status === 'uploading'"
      class="absolute inset-0 items-center justify-center flex rounded-lg uploading-scrim"
    >
      <Icon name="i-lucide-loader-circle" tone="white" :size="20" class="spin" />
    </view>

    <view
      v-if="removable && status !== 'uploading'"
      class="absolute remove-btn rounded-full bg-inverted items-center justify-center flex"
      @tap="emit('remove')"
    >
      <Icon name="i-lucide-x" tone="inverted" :size="10" />
    </view>
  </view>
</template>

<style>
.uploading-scrim {
  background-color: rgba(0, 0, 0, 0.5);
}
.remove-btn {
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
}
</style>
