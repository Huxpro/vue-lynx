<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/public/{index,local}.vue and
// home.vue — one page, three timeline sources.
import { computed } from 'vue-lynx';
import PageHeader from '../components/PageHeader.vue';
import TimelinePaginator from '../components/TimelinePaginator.vue';
import { useMastoClient } from '../composables/masto';
import { currentServer } from '../composables/users';

const props = defineProps<{
  kind: 'home' | 'public' | 'local';
}>();

const titles = {
  home: 'Home',
  public: 'Federated',
  local: 'Local',
} as const;

const paginator = computed(() => {
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
    <PageHeader :title="titles[kind]" :subtitle="currentServer" />
    <TimelinePaginator
      :key="kind"
      :paginator="paginator"
      :context="kind === 'home' ? 'home' : 'public'"
    />
  </view>
</template>

<style>
.page {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
}
</style>
