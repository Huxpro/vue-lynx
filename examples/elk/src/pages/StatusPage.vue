<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/status/[status].vue — thread view
// with ancestors above, the main status emphasized, descendants below.
import type { mastodon } from 'masto';
import { onMounted, ref, watch } from 'vue-lynx';
import { useRoute } from 'vue-router';
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
  padding: 0 16px 12px;
}

.thread-date {
  font-size: 13px;
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
