<script setup lang="ts">
// Ported from elk: app/components/status/StatusPreviewCard.vue (compact
// horizontal layout; the GitHub/StackBlitz special cards are out of scope).
import type { mastodon } from 'masto';

defineProps<{
  card: mastodon.v1.PreviewCard;
}>();

function hostOf(url: string): string {
  const m = url.match(/^https?:\/\/([^/]+)/);
  return m ? m[1].replace(/^www\./, '') : url;
}
</script>

<template>
  <view class="preview-card">
    <image
      v-if="card.image"
      :src="card.image"
      class="preview-card-img"
      mode="aspectFill"
    />
    <view class="preview-card-body">
      <text class="preview-card-host">{{ hostOf(card.url) }}</text>
      <text class="preview-card-title" :text-maxline="2">{{ card.title }}</text>
      <text v-if="card.description" class="preview-card-desc" :text-maxline="2">{{ card.description }}</text>
    </view>
  </view>
</template>

<style>
.preview-card {
  display: flex;
  flex-direction: row;
  margin-top: 8px;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  overflow: hidden;
}

.preview-card-img {
  width: 90px;
  height: 90px;
  background-color: var(--c-bg-active);
  flex-shrink: 0;
}

.preview-card-body {
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  flex: 1;
  justify-content: center;
}

.preview-card-host {
  font-size: 12px;
  color: var(--c-text-secondary);
}

.preview-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-base);
  margin-top: 2px;
}

.preview-card-desc {
  font-size: 12px;
  color: var(--c-text-secondary);
  margin-top: 2px;
}
</style>
