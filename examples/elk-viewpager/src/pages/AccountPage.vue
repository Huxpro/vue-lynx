<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/@[account]/index.vue +
// app/components/account/AccountHeader.vue — banner, avatar, names, bio,
// fields, stats, posts/replies/media tabs.
//
// This variant gives the profile a native feel: the header collapses and
// the tab bar sticks to the top on scroll (StickyTabView / scroll-coordinator),
// while the Posts / Replies / Media panes below page horizontally and each
// keep their own feed and scroll position.
import type { mastodon } from 'masto';
import { computed, onMounted, reactive, ref, watch } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import AccountAvatar from '../components/AccountAvatar.vue';
import AccountDisplayName from '../components/AccountDisplayName.vue';
import ContentRich from '../components/ContentRich';
import PageHeader from '../components/PageHeader.vue';
import Spinner from '../components/Spinner.vue';
import StatusCard from '../components/StatusCard.vue';
import StickyTabView from '../components/StickyTabView.vue';
import { fetchAccountByHandle } from '../composables/cache';
import { formatCompactNumber } from '../composables/format';
import { useMastoClient } from '../composables/masto';
import { createProfileLoadGuard } from '../composables/profile-load';

type TabKey = 'posts' | 'replies' | 'media';

const route = useRoute();
const router = useRouter();

const account = ref<mastodon.v1.Account | null>(null);
const loading = ref(true);
const error = ref(false);
const tab = ref<TabKey>('posts');
const loadGuard = createProfileLoadGuard();

const tabs = [
  { key: 'posts', label: 'Posts' },
  { key: 'replies', label: 'Posts & Replies' },
  { key: 'media', label: 'Media' },
] as const;

// One feed per tab so all three panes keep their own data and scroll
// position while the pager swipes between them; panes load lazily the first
// time they become active.
const feeds = reactive<Record<TabKey, {
  items: mastodon.v1.Status[];
  loading: boolean;
  loaded: boolean;
}>>({
  posts: { items: [], loading: false, loaded: false },
  replies: { items: [], loading: false, loaded: false },
  media: { items: [], loading: false, loaded: false },
});

function resetFeeds() {
  for (const kind of ['posts', 'replies', 'media'] as const) {
    feeds[kind].items = [];
    feeds[kind].loading = false;
    feeds[kind].loaded = false;
  }
}

async function loadFeed(kind: TabKey) {
  if (!account.value)
    return;
  const feed = feeds[kind];
  feed.loading = true;
  try {
    const paginator = useMastoClient().v1.accounts.$select(account.value.id).statuses.list({
      limit: 30,
      excludeReplies: kind === 'posts',
      onlyMedia: kind === 'media',
    });
    const result = await paginator.values().next();
    feed.items = result.value ?? [];
    feed.loaded = true;
  }
  catch (e) {
    console.error(e);
  }
  feed.loading = false;
}

async function load() {
  const handle = (route.params.account as string) ?? '';
  if (!handle)
    return;
  const request = loadGuard.begin();
  loading.value = true;
  error.value = false;
  account.value = null;
  try {
    const loadedAccount = await fetchAccountByHandle(handle.replace(/^@/, ''));
    if (!loadGuard.isCurrent(request))
      return;
    account.value = loadedAccount;
    resetFeeds();
    await loadFeed(tab.value);
  }
  catch (e) {
    console.error(e);
    if (loadGuard.isCurrent(request))
      error.value = true;
  }
  if (loadGuard.isCurrent(request))
    loading.value = false;
}

onMounted(load);
watch(() => route.params.account, load);

// Lazy-load a pane's feed the first time it becomes active.
watch(tab, (kind) => {
  if (!feeds[kind].loaded && !feeds[kind].loading)
    loadFeed(kind);
});

const joinDate = computed(() => {
  if (!account.value)
    return '';
  const d = new Date(account.value.createdAt);
  return `Joined ${d.toLocaleDateString?.('en-US', { month: 'long', year: 'numeric' }) ?? d.getFullYear()}`;
});
</script>

<template>
  <view class="page">
    <PageHeader :title="account ? account.displayName || account.username : 'Profile'" back />
    <view v-if="loading" class="account-loading">
      <Spinner />
    </view>
    <view v-else-if="error || !account" class="account-loading">
      <text class="account-error">Failed to load profile.</text>
      <view class="account-retry" @tap="load">
        <text class="account-retry-text">Try again</text>
      </view>
    </view>
    <StickyTabView v-else v-model="tab" :tabs="tabs" class="account-stv">
      <template #header>
        <!-- banner -->
        <image :src="account.header" class="account-banner" mode="aspectFill" />

        <view class="account-head">
          <view class="account-avatar-row">
            <view class="account-avatar-ring">
              <AccountAvatar :account="account" :size="72" />
            </view>
          </view>

          <AccountDisplayName :account="account" :font-size="20" />
          <text class="account-handle">@{{ account.acct }}</text>

          <view v-if="account.note" class="account-note">
            <ContentRich :content="account.note" :emojis="account.emojis" />
          </view>

          <!-- fields (Elk AccountHeader fields table) -->
          <view v-if="account.fields?.length" class="account-fields">
            <view
              v-for="field in account.fields"
              :key="field.name"
              class="account-field"
              :class="field.verifiedAt ? 'account-field-verified' : ''"
            >
              <text class="account-field-name">{{ field.name }}</text>
              <view class="account-field-value">
                <ContentRich :content="field.value" :emojis="account.emojis" markdown />
              </view>
            </view>
          </view>

          <text class="account-joined">{{ joinDate }}</text>

          <!-- stats row -->
          <view class="account-stats">
            <view class="account-stat">
              <text class="account-stat-num">{{ formatCompactNumber(account.statusesCount) }}</text>
              <text class="account-stat-label">Posts</text>
            </view>
            <view class="account-stat" @tap="router.push(`${route.path.replace(/\/$/, '')}/following`)">
              <text class="account-stat-num">{{ formatCompactNumber(account.followingCount) }}</text>
              <text class="account-stat-label">Following</text>
            </view>
            <view class="account-stat" @tap="router.push(`${route.path.replace(/\/$/, '')}/followers`)">
              <text class="account-stat-num">{{ formatCompactNumber(account.followersCount) }}</text>
              <text class="account-stat-label">Followers</text>
            </view>
          </view>
        </view>
      </template>

      <template #posts>
        <view class="account-pane">
          <view v-if="feeds.posts.loading" class="account-loading">
            <Spinner />
          </view>
          <StatusCard v-for="s in feeds.posts.items" :key="s.id" :status="s" />
          <view v-if="feeds.posts.loaded && !feeds.posts.loading && !feeds.posts.items.length" class="account-empty">
            <text class="account-empty-text">No posts yet.</text>
          </view>
          <view class="account-bottom-pad" />
        </view>
      </template>

      <template #replies>
        <view class="account-pane">
          <view v-if="feeds.replies.loading" class="account-loading">
            <Spinner />
          </view>
          <StatusCard v-for="s in feeds.replies.items" :key="s.id" :status="s" />
          <view v-if="feeds.replies.loaded && !feeds.replies.loading && !feeds.replies.items.length" class="account-empty">
            <text class="account-empty-text">No posts yet.</text>
          </view>
          <view class="account-bottom-pad" />
        </view>
      </template>

      <template #media>
        <view class="account-pane">
          <view v-if="feeds.media.loading" class="account-loading">
            <Spinner />
          </view>
          <StatusCard v-for="s in feeds.media.items" :key="s.id" :status="s" />
          <view v-if="feeds.media.loaded && !feeds.media.loading && !feeds.media.items.length" class="account-empty">
            <text class="account-empty-text">No media yet.</text>
          </view>
          <view class="account-bottom-pad" />
        </view>
      </template>
    </StickyTabView>
  </view>
</template>

<style>
.account-stv {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.account-pane {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.account-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
}

.account-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.account-empty-text {
  font-size: 14px;
  color: var(--c-text-secondary);
}

.account-error {
  font-size: 14px;
  color: var(--c-danger);
}

.account-retry {
  min-width: 96px;
  min-height: 40px;
  margin-top: 14px;
  padding: 0 16px;
  border-radius: 6px;
  background-color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-retry-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.account-banner {
  width: 100%;
  height: 130px;
  background-color: var(--c-bg-active);
}

.account-head {
  display: flex;
  flex-direction: column;
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--c-border);
}

.account-avatar-row {
  margin-top: -36px;
  margin-bottom: 8px;
}

.account-avatar-ring {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background-color: var(--c-bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-handle {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin-top: 2px;
}

.account-note {
  margin-top: 10px;
}

.account-fields {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  border: 1px solid var(--c-border);
  border-radius: 8px;
  overflow: hidden;
}

.account-field {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid var(--c-border);
  padding: 6px 10px;
  gap: 10px;
}

.account-field-verified {
  background-color: rgba(103, 194, 58, 0.1);
}

.account-field-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-secondary);
  width: 90px;
  flex-shrink: 0;
}

.account-field-value {
  flex: 1;
}

.account-joined {
  font-size: 13px;
  color: var(--c-text-secondary);
  margin-top: 10px;
}

.account-stats {
  display: flex;
  flex-direction: row;
  gap: 24px;
  margin-top: 10px;
}

.account-stat {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}

.account-stat-num {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text-base);
}

.account-stat-label {
  font-size: 13px;
  color: var(--c-text-secondary);
}

.account-bottom-pad {
  height: 40px;
}
</style>
