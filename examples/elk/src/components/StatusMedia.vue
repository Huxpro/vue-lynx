<script setup lang="ts">
// Ported from elk: app/components/status/StatusMedia.vue + StatusAttachment.vue.
// Images render in an aspect-ratio grid; video/gifv/audio show their static
// preview with a type badge (no inline media player element in Lynx —
// see PRD "Status card"). Blurhash placeholders are solid colors (no canvas).
import type { mastodon } from 'masto';
import { computed, ref } from 'vue-lynx';
import { openMediaPreview } from '../composables/media-preview';

const props = defineProps<{
  attachments: mastodon.v1.MediaAttachment[];
  sensitive?: boolean;
}>();

const revealed = ref(false);
const hidden = computed(() => props.sensitive && !revealed.value);

function onTapAttachment(att: mastodon.v1.MediaAttachment) {
  if (hidden.value) {
    revealed.value = true;
    return;
  }
  if (att.type === 'image' || att.type === 'gifv' || att.type === 'video')
    openMediaPreview(att.type === 'image' ? att : { ...att, url: att.previewUrl ?? att.url });
}

function typeBadge(att: mastodon.v1.MediaAttachment): string | null {
  if (att.type === 'video') return '▶ video';
  if (att.type === 'gifv') return 'GIF';
  if (att.type === 'audio') return '♪ audio';
  return null;
}

function attachmentSrc(att: mastodon.v1.MediaAttachment): string {
  return att.previewUrl || att.url || '';
}
</script>

<template>
  <view v-if="attachments.length" class="status-media" :class="attachments.length > 1 ? 'status-media-grid' : ''">
    <view
      v-for="att in attachments"
      :key="att.id"
      class="status-media-item"
      :class="attachments.length > 1 ? 'status-media-item-half' : ''"
      @tap="onTapAttachment(att)"
    >
      <image
        :src="attachmentSrc(att)"
        class="status-media-img"
        :style="{
          aspectRatio: String((attachments.length > 1 ? 1 : att.meta?.original?.aspect) || 1.618),
          filter: hidden ? 'blur(30px)' : 'none',
        }"
        mode="aspectFill"
      />
      <view v-if="hidden" class="status-media-sensitive">
        <text class="status-media-sensitive-text">Sensitive content</text>
        <text class="status-media-sensitive-sub">Tap to reveal</text>
      </view>
      <view v-else-if="typeBadge(att)" class="status-media-badge">
        <text class="status-media-badge-text">{{ typeBadge(att) }}</text>
      </view>
    </view>
  </view>
</template>

<style>
.status-media {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  border-radius: 12px;
  overflow: hidden;
  gap: 2px;
}

.status-media-grid {
  flex-direction: row;
  flex-wrap: wrap;
}

.status-media-item {
  position: relative;
  width: 100%;
}

.status-media-item-half {
  width: 49.6%;
}

.status-media-img {
  width: 100%;
  border-radius: 2px;
  background-color: var(--c-bg-active);
}

.status-media-sensitive {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.35);
}

.status-media-sensitive-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.status-media-sensitive-sub {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin-top: 2px;
}

.status-media-badge {
  position: absolute;
  left: 8px;
  bottom: 8px;
  background-color: rgba(0, 0, 0, 0.65);
  border-radius: 4px;
  padding: 2px 6px;
}

.status-media-badge-text {
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
}
</style>
