<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/status/[status].vue — thread view
// with ancestors above, the main status emphasized, descendants below.
import type { mastodon } from 'masto';
import { onMounted, ref, watch } from 'vue-lynx';
import { useRoute } from 'vue-router';
import ContentRich from '../components/ContentRich';
import PageHeader from '../components/PageHeader.vue';
import Spinner from '../components/Spinner.vue';
import StatusCard from '../components/StatusCard.vue';
import { fetchStatus } from '../composables/cache';
import { formatFullDate } from '../composables/format';
import { useMastoClient } from '../composables/masto';

const route = useRoute();

const status = ref<mastodon.v1.Status | null>(null);
const ancestors = ref<mastodon.v1.Status[]>([]);
const descendants = ref<mastodon.v1.Status[]>([]);
const loading = ref(true);
const error = ref(false);

// Edit history (Elk: status/edit/StatusEditHistory + history API)
const history = ref<mastodon.v1.StatusEdit[] | null>(null);
const historyLoading = ref(false);

async function toggleHistory() {
  if (history.value) {
    history.value = null;
    return;
  }
  if (!status.value || historyLoading.value)
    return;
  historyLoading.value = true;
  try {
    const versions = await useMastoClient().v1.statuses.$select(status.value.id).history.list();
    // newest first, skip the current version (last item is the original)
    history.value = [...versions].reverse();
  }
  catch (e) {
    console.error(e);
  }
  historyLoading.value = false;
}

async function load() {
  const id = route.params.id as string;
  if (!id)
    return;
  loading.value = true;
  error.value = false;
  status.value = null;
  ancestors.value = [];
  descendants.value = [];
  try {
    status.value = await fetchStatus(id);
    const context = await useMastoClient().v1.statuses.$select(id).context.fetch();
    ancestors.value = context.ancestors;
    descendants.value = context.descendants;
  }
  catch (e) {
    console.error(e);
    error.value = true;
  }
  loading.value = false;
}

onMounted(load);
watch(() => route.params.id, load);
</script>

<template>
  <view class="page">
    <PageHeader title="Post" back />
    <view v-if="loading" class="thread-loading">
      <Spinner />
    </view>
    <view v-else-if="error || !status" class="thread-loading">
      <text class="thread-error">Failed to load post.</text>
    </view>
    <scroll-view v-else scroll-orientation="vertical" class="thread-scroll">
      <view v-for="a in ancestors" :key="a.id" class="thread-ancestor">
        <StatusCard :status="a" />
      </view>
      <StatusCard :status="status" main />
      <view class="thread-date-row">
        <text class="thread-date">{{ formatFullDate(status.createdAt) }}</text>
        <text
          v-if="status.editedAt"
          class="thread-edited"
          @tap="toggleHistory"
        >· Edited {{ formatFullDate(status.editedAt) }} ({{ history ? 'hide history' : 'view history' }})</text>
      </view>

      <!-- edit history versions -->
      <view v-if="history" class="thread-history">
        <view v-for="(edit, i) in history" :key="i" class="thread-history-item">
          <text class="thread-history-date">{{ i === 0 ? 'Latest' : formatFullDate(edit.createdAt) }}</text>
          <ContentRich :content="edit.content" :emojis="edit.emojis" />
        </view>
      </view>
      <view class="thread-divider" />
      <StatusCard v-for="d in descendants" :key="d.id" :status="d" />
      <view class="thread-bottom-pad" />
    </scroll-view>
  </view>
</template>

<style>
.thread-scroll {
  flex: 1;
  width: 100%;
}

.thread-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
}

.thread-error {
  font-size: 14px;
  color: var(--c-danger);
}

.thread-date-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 0 16px 12px;
  gap: 4px;
}

.thread-date {
  font-size: 13px;
  color: var(--c-text-secondary);
}

.thread-edited {
  font-size: 13px;
  color: var(--c-primary);
}

.thread-history {
  display: flex;
  flex-direction: column;
  margin: 0 16px 12px;
  border: 1px solid var(--c-border);
  border-radius: 10px;
}

.thread-history-item {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-bottom: 1px solid var(--c-border);
  gap: 4px;
}

.thread-history-date {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-secondary);
}

.thread-divider {
  height: 1px;
  background-color: var(--c-border);
}

.thread-bottom-pad {
  height: 40px;
}
</style>
