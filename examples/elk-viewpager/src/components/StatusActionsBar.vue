<script setup lang="ts">
// Ported from elk: app/components/status/StatusActions.vue.
// Same four actions + counts with Elk's active colors (boost green,
// favourite amber, bookmark primary); optimistic updates via the ported
// useStatusActions composable.
import type { mastodon } from 'masto';
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import { formatCompactNumber } from '../composables/format';
import { useStatusActions } from '../composables/status-actions';
import AppIcon from './AppIcon.vue';

const props = defineProps<{
  status: mastodon.v1.Status;
}>();

const router = useRouter();
const pressedAction = ref<string | null>(null);

const { status, toggleReblog, toggleFavourite, toggleBookmark } = useStatusActions({
  status: props.status,
});

function reply() {
  router.push(`/compose?replyTo=${status.value.id}`);
}

function press(action: string) {
  pressedAction.value = action;
}

function release() {
  pressedAction.value = null;
}
</script>

<template>
  <view class="status-actions">
    <view
      class="status-action status-action-reply"
      :class="pressedAction === 'reply' ? 'status-action-pressed' : ''"
      @touchstart="press('reply')"
      @touchend="release"
      @touchcancel="release"
      @tap="reply"
    >
      <view class="status-action-icon status-action-icon-reply">
        <AppIcon name="chat-1-line" :size="20" color="#686868" />
      </view>
      <text v-if="status.repliesCount" class="status-action-count">{{ formatCompactNumber(status.repliesCount) }}</text>
    </view>
    <view
      class="status-action status-action-reblog"
      :class="pressedAction === 'reblog' ? 'status-action-pressed' : ''"
      @touchstart="press('reblog')"
      @touchend="release"
      @touchcancel="release"
      @tap="toggleReblog"
    >
      <view class="status-action-icon status-action-icon-reblog">
        <AppIcon name="repeat-fill" :size="20" :color="status.reblogged ? '#16a34a' : '#686868'" />
      </view>
      <text
        v-if="status.reblogsCount"
        class="status-action-count"
        :style="status.reblogged ? { color: '#16a34a' } : undefined"
      >{{ formatCompactNumber(status.reblogsCount) }}</text>
    </view>
    <view
      class="status-action status-action-favourite"
      :class="pressedAction === 'favourite' ? 'status-action-pressed' : ''"
      @touchstart="press('favourite')"
      @touchend="release"
      @touchcancel="release"
      @tap="toggleFavourite"
    >
      <view class="status-action-icon status-action-icon-favourite">
        <AppIcon :name="status.favourited ? 'heart-3-fill' : 'heart-3-line'" :size="20" :color="status.favourited ? '#f43f5e' : '#686868'" />
      </view>
      <text
        v-if="status.favouritesCount"
        class="status-action-count"
        :style="status.favourited ? { color: '#f43f5e' } : undefined"
      >{{ formatCompactNumber(status.favouritesCount) }}</text>
    </view>
    <view
      class="status-action status-action-bookmark"
      :class="pressedAction === 'bookmark' ? 'status-action-pressed' : ''"
      @touchstart="press('bookmark')"
      @touchend="release"
      @touchcancel="release"
      @tap="toggleBookmark"
    >
      <view class="status-action-icon status-action-icon-bookmark">
        <AppIcon :name="status.bookmarked ? 'bookmark-fill' : 'bookmark-line'" :size="20" :color="status.bookmarked ? '#cc7d24' : '#686868'" />
      </view>
    </view>
  </view>
</template>

<style>
.status-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.status-action {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 40px;
  min-height: 40px;
  transition: transform var(--motion-fast) var(--ease-out-quart), opacity var(--motion-fast) var(--ease-out-quart);
}

.status-action-pressed {
  transform: scale(0.92);
  opacity: 0.78;
}

.status-action-reply {
  justify-content: flex-start;
}

.status-action-reblog,
.status-action-favourite {
  justify-content: center;
}

.status-action-bookmark {
  justify-content: flex-end;
}

.status-action-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-action-pressed .status-action-icon-reply {
  background-color: rgba(59, 130, 246, 0.12);
}

.status-action-pressed .status-action-icon-reblog {
  background-color: rgba(22, 163, 74, 0.12);
}

.status-action-pressed .status-action-icon-favourite {
  background-color: rgba(244, 63, 94, 0.12);
}

.status-action-pressed .status-action-icon-bookmark {
  background-color: var(--c-primary-fade);
}

.status-action-count {
  font-size: 13px;
  color: var(--c-text-secondary);
}
</style>
