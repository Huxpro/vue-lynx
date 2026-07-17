<script setup lang="ts">
// Ported from elk: app/pages/{bookmarks,favourites}.vue +
// timeline/Timeline{Bookmarks,Favourites}.vue. Requires a signed-in
// session; guests get the sign-in hint like Elk.
import { computed } from 'vue-lynx';
import AppIcon from '../components/AppIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import TimelinePaginator from '../components/TimelinePaginator.vue';
import { useMastoClient } from '../composables/masto';
import { checkLogin } from '../composables/users';

const props = defineProps<{
  kind: 'bookmarks' | 'favourites';
}>();

const meta = {
  bookmarks: { title: 'Bookmarks', icon: 'bookmark-line' },
  favourites: { title: 'Favourites', icon: 'heart-3-line' },
} as const;

const signedIn = checkLogin();

const paginator = computed(() => {
  const client = useMastoClient();
  return props.kind === 'bookmarks'
    ? client.v1.bookmarks.list({ limit: 30 })
    : client.v1.favourites.list({ limit: 30 });
});
</script>

<template>
  <view class="page">
    <PageHeader :title="meta[kind].title" :icon="meta[kind].icon" back />
    <view v-if="!signedIn" class="collection-empty">
      <AppIcon :name="meta[kind].icon" :size="40" color="#919191" />
      <text class="collection-empty-text">Sign in (Settings → token) to see your {{ meta[kind].title.toLowerCase() }}.</text>
    </view>
    <TimelinePaginator v-else :key="kind" :paginator="paginator" context="account" />
  </view>
</template>

<style>
.collection-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 32px;
  gap: 12px;
}

.collection-empty-text {
  font-size: 14px;
  color: var(--c-text-secondary);
  text-align: center;
}
</style>
