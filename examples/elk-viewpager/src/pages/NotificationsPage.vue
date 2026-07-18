<script setup lang="ts">
// Ported from elk: app/pages/notifications.vue +
// components/notification/NotificationCard.vue. Requires a signed-in
// session (guest mode shows the sign-in hint like Elk does).
// The All / Mentions filter tabs (Elk: pages/notifications/[filter].vue)
// are backed by the native viewpager (TabPager): each filter keeps its
// own list + paginator, and panes swipe horizontally.
import type { mastodon } from 'masto';
import { onMounted, reactive, ref, watch } from 'vue-lynx';
import { useRouter } from 'vue-router';
import AccountAvatar from '../components/AccountAvatar.vue';
import AccountDisplayName from '../components/AccountDisplayName.vue';
import AppIcon from '../components/AppIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import Spinner from '../components/Spinner.vue';
import StatusCard from '../components/StatusCard.vue';
import TabPager from '../components/TabPager.vue';
import { useMastoClient } from '../composables/masto';
import { type PaginatorState, usePaginator } from '../composables/paginator';
import { getAccountRoute } from '../composables/routes';
import { checkLogin } from '../composables/users';

const router = useRouter();
const signedIn = checkLogin();

const iconFor: Record<string, { icon: string; color: string; label: string }> = {
  follow: { icon: 'user-3-line', color: '#0ea5e9', label: 'followed you' },
  favourite: { icon: 'star-line', color: '#eab308', label: 'favourited your post' },
  reblog: { icon: 'repeat-fill', color: '#16a34a', label: 'boosted your post' },
  mention: { icon: 'at-line', color: '#cc7d24', label: 'mentioned you' },
  poll: { icon: 'bar-chart-fill', color: '#8b5cf6', label: 'poll ended' },
  update: { icon: 'quill-pen-line', color: '#686868', label: 'edited a post' },
};

type Filter = 'all' | 'mention';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'mention', label: 'Mentions' },
] as const;

const filter = ref<Filter>('all');

function makePaginator(kind: Filter) {
  return usePaginator<mastodon.v1.Notification, any>(
    useMastoClient().v1.notifications.list({
      limit: 30,
      types: kind === 'mention' ? ['mention'] : undefined,
    }),
  );
}

// One feed per filter tab so both viewpager panes keep their scroll
// position and data while swiping between them.
const feeds = reactive<Record<Filter, {
  items: mastodon.v1.Notification[];
  state: PaginatorState | 'idle';
}>>({
  all: { items: [], state: 'idle' },
  mention: { items: [], state: 'idle' },
});
const pagers: Partial<Record<Filter, ReturnType<typeof makePaginator>>> = {};

async function loadNext(kind: Filter) {
  if (!signedIn)
    return;
  const pager = (pagers[kind] ??= makePaginator(kind));
  await pager.loadNext();
  feeds[kind].items = [...pager.items.value];
  feeds[kind].state = pager.state.value;
}

// Lazy-load a pane's feed the first time it becomes active.
watch(filter, (kind) => {
  if (!pagers[kind])
    loadNext(kind);
});

onMounted(() => loadNext('all'));
</script>

<template>
  <view class="page">
    <PageHeader title="Notifications" icon="notification-4-line" />

    <view v-if="!signedIn" class="notif-empty">
      <AppIcon name="notification-4-line" :size="40" color="#919191" />
      <text class="notif-empty-text">Sign in (Settings → token) to see your notifications.</text>
    </view>

    <TabPager v-else v-model="filter" :tabs="filters">
      <template v-for="f in filters" :key="f.key" #[f.key]>
        <list
          class="timeline-list"
          scroll-orientation="vertical"
          :lower-threshold-item-count="4"
          @scrolltolower="loadNext(f.key)"
        >
          <list-item
            v-for="n in feeds[f.key].items"
            :key="n.id"
            :item-key="n.id"
            :estimated-main-axis-size-px="100"
          >
            <view class="notif-card">
              <view class="notif-head" @tap="router.push(getAccountRoute(n.account))">
                <AppIcon
                  :name="(iconFor[n.type] ?? iconFor.update).icon"
                  :size="16"
                  :color="(iconFor[n.type] ?? iconFor.update).color"
                />
                <AccountAvatar :account="n.account" :size="22" />
                <AccountDisplayName :account="n.account" :font-size="13" />
                <text class="notif-label">{{ (iconFor[n.type] ?? iconFor.update).label }}</text>
              </view>
              <StatusCard v-if="n.status" :status="n.status" :show-actions="n.type === 'mention'" />
            </view>
          </list-item>
          <list-item item-key="__footer" :estimated-main-axis-size-px="60">
            <view class="notif-footer">
              <Spinner v-if="feeds[f.key].state === 'loading'" />
              <text v-else-if="feeds[f.key].state === 'done'" class="notif-end">That's all</text>
            </view>
          </list-item>
        </list>
      </template>
    </TabPager>
  </view>
</template>

<style>
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 32px;
  gap: 12px;
}

.notif-empty-text {
  font-size: 14px;
  color: var(--c-text-secondary);
  text-align: center;
}

.notif-card {
  display: flex;
  flex-direction: column;
}

.notif-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 0;
}

.notif-label {
  font-size: 13px;
  color: var(--c-text-secondary);
}

.notif-footer {
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 16px 0;
}

.notif-end {
  font-size: 13px;
  color: var(--c-text-secondary-light);
}
</style>
