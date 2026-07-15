<script setup lang="ts">
// Ported from elk: app/components/status/StatusPoll.vue.
// Read-only rendering (voting requires auth; option rows show share bars
// like Elk's). Vote submission is wired when a token is present.
import type { mastodon } from 'masto';
import { computed, ref } from 'vue-lynx';
import { formatCompactNumber } from '../composables/format';
import { useMastoClient } from '../composables/masto';
import { checkLogin } from '../composables/users';

const props = defineProps<{
  poll: mastodon.v1.Poll;
}>();

const poll = ref({ ...props.poll });

const totalVotes = computed(() => poll.value.votersCount ?? poll.value.votesCount ?? 0);

function percentage(option: mastodon.v1.PollOption): number {
  const total = totalVotes.value;
  if (!total || option.votesCount == null)
    return 0;
  return Math.round((option.votesCount / total) * 100);
}

const expired = computed(() =>
  poll.value.expired || (poll.value.expiresAt && new Date(poll.value.expiresAt).getTime() < Date.now()),
);

async function vote(index: number) {
  if (!checkLogin() || poll.value.voted || expired.value)
    return;
  const result = await useMastoClient().v1.polls.$select(poll.value.id).votes.create({ choices: [index] });
  poll.value = { ...result };
}
</script>

<template>
  <view class="status-poll">
    <view
      v-for="(option, i) in poll.options"
      :key="i"
      class="status-poll-option"
      @tap="vote(i)"
    >
      <view class="status-poll-bar" :style="{ width: `${Math.max(percentage(option), 1)}%` }" />
      <view class="status-poll-row">
        <text class="status-poll-pct">{{ percentage(option) }}%</text>
        <text class="status-poll-title">{{ option.title }}</text>
      </view>
    </view>
    <text class="status-poll-meta">
      {{ formatCompactNumber(totalVotes) }} votes{{ expired ? ' · Closed' : '' }}
    </text>
  </view>
</template>

<style>
.status-poll {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  gap: 6px;
}

.status-poll-option {
  position: relative;
  border-radius: 6px;
  background-color: var(--c-bg-card);
  overflow: hidden;
}

.status-poll-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background-color: var(--c-primary-fade);
  border-radius: 6px;
}

.status-poll-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
}

.status-poll-pct {
  font-size: 13px;
  font-weight: 700;
  color: var(--c-primary);
  width: 38px;
}

.status-poll-title {
  font-size: 14px;
  color: var(--c-text-base);
  flex: 1;
}

.status-poll-meta {
  font-size: 12px;
  color: var(--c-text-secondary);
  margin-top: 2px;
}
</style>
