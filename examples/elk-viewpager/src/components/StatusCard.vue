<script setup lang="ts">
// Ported from elk: app/components/status/StatusCard.vue + StatusBody.vue +
// StatusContent.vue collapsed into one card. Layout mirrors Elk: boost
// attribution line, avatar left, name row (display name · handle · time),
// rich content, media/poll/preview card, action bar.
import type { mastodon } from 'masto';
import { computed } from 'vue-lynx';
import { useRouter } from 'vue-router';
import { getServerName } from '../composables/account';
import { formatTimeAgo } from '../composables/format';
import { getAccountRoute, getStatusRoute } from '../composables/routes';
import AccountAvatar from './AccountAvatar.vue';
import AccountDisplayName from './AccountDisplayName.vue';
import AppIcon from './AppIcon.vue';
import ContentRich from './ContentRich';
import StatusActionsBar from './StatusActionsBar.vue';
import StatusMedia from './StatusMedia.vue';
import StatusPoll from './StatusPoll.vue';
import StatusPreviewCard from './StatusPreviewCard.vue';
import StatusSpoiler from './StatusSpoiler.vue';

const props = withDefaults(defineProps<{
  status: mastodon.v1.Status;
  // status detail page: bigger text, no tap-to-open, full actions
  main?: boolean;
  showActions?: boolean;
}>(), {
  main: false,
  showActions: true,
});

const router = useRouter();

// Handle boosts: the card shows the boosted status with attribution.
const isReblog = computed(() => !!props.status.reblog);
const status = computed(() => props.status.reblog ?? props.status);

// Elk shows the full @user@server handle in the timeline (getFullHandle)
const fullHandle = computed(() => {
  const acct = status.value.account.acct;
  return acct.includes('@') ? `@${acct}` : `@${acct}@${getServerName(status.value.account)}`;
});

// Mastodon 4.5 quotes: status.quote.quotedStatus when accepted
const quotedStatus = computed(() => {
  const quote = (status.value as any).quote;
  return quote?.state === 'accepted' ? quote.quotedStatus as mastodon.v1.Status : null;
});

const visibilityIcon = computed(() => {
  switch (status.value.visibility) {
    case 'unlisted': return 'lock-line';
    case 'private': return 'lock-line';
    case 'direct': return 'at-line';
    default: return null;
  }
});

function openStatus() {
  if (!props.main)
    router.push(getStatusRoute(status.value));
}

function openAccount() {
  router.push(getAccountRoute(status.value.account));
}
</script>

<template>
  <view class="status-card" :class="main ? 'status-card-main' : ''">
    <!-- boost attribution (Elk StatusCard reblog header) -->
    <view v-if="isReblog" class="status-reblog-line">
      <AppIcon name="repeat-fill" :size="14" color="#16a34a" />
      <AccountDisplayName :account="props.status.account" :bold="false" :font-size="13" />
      <text class="status-reblog-text">boosted</text>
    </view>

    <view class="status-row">
      <view @tap="openAccount">
        <AccountAvatar :account="status.account" :size="main ? 56 : 48" />
      </view>

      <view class="status-body">
        <!-- name block: Elk mobile stacks display name over the handle,
             with the timestamp pinned top-right -->
        <view class="status-name-row" @tap="openAccount">
          <view class="status-names">
            <view class="status-name-line">
              <AccountDisplayName :account="status.account" :font-size="main ? 16 : 15" />
              <AppIcon v-if="status.account.bot" name="robot-2-line" :size="14" color="#919191" />
              <AppIcon v-if="status.account.locked" name="lock-line" :size="13" color="#919191" />
            </view>
            <text class="status-handle" :text-maxline="1">{{ fullHandle }}</text>
          </view>
          <AppIcon v-if="visibilityIcon" :name="visibilityIcon" :size="14" color="#919191" />
          <text v-if="!main" class="status-time">{{ formatTimeAgo(status.createdAt) }}</text>
        </view>

        <!-- reply context (Elk StatusReplyingTo) -->
        <view v-if="status.inReplyToId" class="status-replying">
          <AppIcon name="chat-1-line" :size="12" color="#919191" />
          <text class="status-replying-text">replying to a thread</text>
        </view>

        <!-- content behind optional CW -->
        <view class="status-content" @tap="openStatus">
          <StatusSpoiler v-if="status.spoilerText" :spoiler-text="status.spoilerText">
            <ContentRich
              :content="status.content"
              :emojis="status.emojis"
              :mentions="status.mentions"
              :collapse-mention-link="true"
              :status="status"
            />
          </StatusSpoiler>
          <ContentRich
            v-else-if="status.content"
            :content="status.content"
            :emojis="status.emojis"
            :mentions="status.mentions"
            :collapse-mention-link="true"
            :status="status"
          />
        </view>

        <StatusMedia
          v-if="status.mediaAttachments?.length"
          :attachments="status.mediaAttachments"
          :sensitive="status.sensitive"
        />

        <!-- quote post (Mastodon 4.5; Elk StatusQuote nested card) -->
        <view
          v-if="quotedStatus"
          class="status-quote"
          @tap="router.push(getStatusRoute(quotedStatus))"
        >
          <view class="status-quote-head">
            <AccountAvatar :account="quotedStatus.account" :size="20" />
            <AccountDisplayName :account="quotedStatus.account" :font-size="13" />
            <text class="status-handle" :text-maxline="1">@{{ quotedStatus.account.acct }}</text>
          </view>
          <ContentRich
            v-if="quotedStatus.content"
            :content="quotedStatus.content"
            :emojis="quotedStatus.emojis"
            :mentions="quotedStatus.mentions"
          />
        </view>
        <StatusPoll v-if="status.poll" :poll="status.poll" />
        <StatusPreviewCard
          v-else-if="status.card && !status.mediaAttachments?.length"
          :card="status.card"
        />

        <StatusActionsBar v-if="showActions" :status="status" />
      </view>
    </view>
  </view>
</template>

<style>
.status-card {
  display: flex;
  flex-direction: column;
  padding: 12px 14px 8px;
  border-bottom: 1px solid var(--c-border);
  background-color: var(--c-bg-base);
}

.status-card-main {
  border-bottom-width: 0;
}

.status-reblog-line {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  padding-left: 32px;
}

.status-reblog-text {
  font-size: 13px;
  color: var(--c-text-secondary);
}

.status-row {
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.status-body {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.status-name-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 6px;
}

.status-names {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.status-name-line {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}

.status-handle {
  font-size: 13px;
  color: var(--c-text-secondary);
}

.status-time {
  font-size: 13px;
  color: var(--c-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.status-replying {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.status-replying-text {
  font-size: 12px;
  color: var(--c-text-secondary-light);
}

.status-content {
  margin-top: 4px;
}

.status-quote {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 10px 12px;
  gap: 4px;
}

.status-quote-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}
</style>
