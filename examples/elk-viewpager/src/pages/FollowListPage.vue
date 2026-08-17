<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/@[account]/index/{followers,following}.vue
// + account/AccountPaginator.vue — follower/following lists.
import type { mastodon } from 'masto';
import { onMounted, ref } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import AccountAvatar from '../components/AccountAvatar.vue';
import AccountDisplayName from '../components/AccountDisplayName.vue';
import PageHeader from '../components/PageHeader.vue';
import Spinner from '../components/Spinner.vue';
import { fetchAccountByHandle } from '../composables/cache';
import { useMastoClient } from '../composables/masto';
import { usePaginator } from '../composables/paginator';
import { getAccountRoute } from '../composables/routes';

const route = useRoute();
const router = useRouter();

const kind = route.path.endsWith('/following') ? 'following' : 'followers';
const title = kind === 'following' ? 'Following' : 'Followers';

const ready = ref(false);
let pager: ReturnType<typeof usePaginator<mastodon.v1.Account, any>> | null = null;
const items = ref<mastodon.v1.Account[]>([]);
const state = ref<'idle' | 'loading' | 'done' | 'error'>('loading');

async function setup() {
  try {
    const handle = (route.params.account as string).replace(/^@/, '');
    const account = await fetchAccountByHandle(handle);
    const api = useMastoClient().v1.accounts.$select(account.id);
    pager = usePaginator<mastodon.v1.Account, any>(
      kind === 'following' ? api.following.list({ limit: 40 }) : api.followers.list({ limit: 40 }),
    );
    items.value = pager.items.value;
    state.value = pager.state.value;
    // re-expose the paginator's refs
    ready.value = true;
    await pager.loadNext();
    items.value = pager.items.value;
    state.value = pager.state.value;
  }
  catch (e) {
    console.error(e);
    state.value = 'error';
  }
}

async function more() {
  if (!pager)
    return;
  await pager.loadNext();
  items.value = [...pager.items.value];
  state.value = pager.state.value;
}

onMounted(setup);
</script>

<template>
  <view class="page">
    <PageHeader :title="title" back />
    <view v-if="state === 'loading' && !items.length" class="follow-loading">
      <Spinner />
    </view>
    <list
      v-else
      class="timeline-list"
      scroll-orientation="vertical"
      :lower-threshold-item-count="6"
      @scrolltolower="more"
    >
      <list-item
        v-for="account in items"
        :key="account.id"
        :item-key="account.id"
        :estimated-main-axis-size-px="64"
      >
        <view class="follow-row" @tap="router.push(getAccountRoute(account))">
          <AccountAvatar :account="account" :size="44" />
          <view class="follow-names">
            <AccountDisplayName :account="account" :font-size="14" />
            <text class="follow-handle" :text-maxline="1">@{{ account.acct }}</text>
          </view>
        </view>
      </list-item>
      <list-item item-key="__footer" :estimated-main-axis-size-px="50">
        <view class="follow-footer">
          <Spinner v-if="state === 'loading'" />
        </view>
      </list-item>
    </list>
  </view>
</template>

<style>
.follow-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
}

.follow-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--c-border);
}

.follow-names {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.follow-handle {
  font-size: 13px;
  color: var(--c-text-secondary);
}

.follow-footer {
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 12px 0;
}
</style>
