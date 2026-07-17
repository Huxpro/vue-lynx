<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/public/{index,local}.vue and
// home.vue — one page, three timeline sources.
import { computed, ref } from 'vue-lynx';
import AppIcon from '../components/AppIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import TimelinePaginator from '../components/TimelinePaginator.vue';
import { useMastoClient } from '../composables/masto';

const props = defineProps<{
  kind: 'home' | 'public' | 'local';
}>();

// Elk prepends streamed statuses live; without WebSocket the equivalent
// is an explicit refresh that recreates the paginator.
const refreshTick = ref(0);
const refreshing = ref(false);

function refresh() {
  if (refreshing.value)
    return;
  refreshing.value = true;
  refreshTick.value++;
  setTimeout(() => {
    refreshing.value = false;
  }, 450);
}

const titles = {
  home: { title: 'Home', icon: 'home-5-line' },
  public: { title: 'Federated Timeline', icon: 'earth-line' },
  local: { title: 'Local Timeline', icon: 'group-2-line' },
} as const;

const paginator = computed(() => {
  void refreshTick.value; // recreate on refresh
  const client = useMastoClient();
  switch (props.kind) {
    case 'home':
      return client.v1.timelines.home.list({ limit: 30 });
    case 'public':
      return client.v1.timelines.public.list({ limit: 30 });
    case 'local':
      return client.v1.timelines.public.list({ limit: 30, local: true });
  }
});
</script>

<template>
  <view class="page">
    <PageHeader :title="titles[kind].title" :icon="titles[kind].icon">
      <view class="timeline-refresh" :class="refreshing ? 'timeline-refreshing' : ''" @tap="refresh">
        <AppIcon name="refresh-line" :size="20" color="#686868" />
      </view>
    </PageHeader>
    <TimelinePaginator
      :key="`${kind}-${refreshTick}`"
      :paginator="paginator"
      :context="kind === 'home' ? 'home' : 'public'"
    />
  </view>
</template>

<style>
.timeline-refresh {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--motion-fast) var(--ease-out-quart), opacity var(--motion-fast) var(--ease-out-quart);
}

.timeline-refreshing {
  animation-name: timeline-refresh-spin;
  animation-duration: 450ms;
  animation-timing-function: var(--ease-out-quart);
}

@keyframes timeline-refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
.page {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
}
</style>
