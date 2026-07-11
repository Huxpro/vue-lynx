<script setup lang="ts">
// Ported from elk: app/components/status/StatusActions.vue.
// Same four actions + counts with Elk's active colors (boost green,
// favourite amber, bookmark primary); optimistic updates via the ported
// useStatusActions composable.
import type { mastodon } from 'masto';
import { useRouter } from 'vue-router';
import { formatCompactNumber } from '../composables/format';
import { useStatusActions } from '../composables/status-actions';
import AppIcon from './AppIcon.vue';

const props = defineProps<{
  status: mastodon.v1.Status;
}>();

const router = useRouter();

const { status, toggleReblog, toggleFavourite, toggleBookmark } = useStatusActions({
  status: props.status,
});

function reply() {
  router.push(`/compose?replyTo=${status.value.id}`);
}
</script>

<template>
  <view class="status-actions">
    <view class="status-action" @tap="reply">
      <AppIcon name="chat-1-line" :size="18" color="#686868" />
      <text v-if="status.repliesCount" class="status-action-count">{{ formatCompactNumber(status.repliesCount) }}</text>
    </view>
    <view class="status-action" @tap="toggleReblog">
      <AppIcon name="repeat-fill" :size="18" :color="status.reblogged ? '#16a34a' : '#686868'" />
      <text
        v-if="status.reblogsCount"
        class="status-action-count"
        :style="status.reblogged ? { color: '#16a34a' } : undefined"
      >{{ formatCompactNumber(status.reblogsCount) }}</text>
    </view>
    <view class="status-action" @tap="toggleFavourite">
      <AppIcon :name="status.favourited ? 'heart-3-fill' : 'heart-3-line'" :size="18" :color="status.favourited ? '#f43f5e' : '#686868'" />
      <text
        v-if="status.favouritesCount"
        class="status-action-count"
        :style="status.favourited ? { color: '#f43f5e' } : undefined"
      >{{ formatCompactNumber(status.favouritesCount) }}</text>
    </view>
    <view class="status-action" @tap="toggleBookmark">
      <AppIcon :name="status.bookmarked ? 'bookmark-fill' : 'bookmark-line'" :size="18" :color="status.bookmarked ? '#cc7d24' : '#686868'" />
    </view>
  </view>
</template>

<style>
.status-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-right: 40px;
}

.status-action {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
}

.status-action-count {
  font-size: 13px;
  color: var(--c-text-secondary);
}
</style>
