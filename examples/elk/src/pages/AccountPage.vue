<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/@[account]/index.vue +
// app/components/account/AccountHeader.vue — banner, avatar, names, bio,
// fields, stats, posts/replies/media tabs.
import type { mastodon } from 'masto';
import { computed, onMounted, ref, watch } from 'vue-lynx';
import { useRoute, useRouter } from 'vue-router';
import AccountAvatar from '../components/AccountAvatar.vue';
import AccountDisplayName from '../components/AccountDisplayName.vue';
import ContentRich from '../components/ContentRich';
import PageHeader from '../components/PageHeader.vue';
import Spinner from '../components/Spinner.vue';
import StatusCard from '../components/StatusCard.vue';
import { fetchAccountByHandle } from '../composables/cache';
import { formatCompactNumber } from '../composables/format';
import { useMastoClient } from '../composables/masto';
import { createProfileLoadGuard } from '../composables/profile-load';

const route = useRoute();
const router = useRouter();

const account = ref<mastodon.v1.Account | null>(null);
const statuses = ref<mastodon.v1.Status[]>([]);
const loading = ref(true);
const error = ref(false);
const tab = ref<'posts' | 'replies' | 'media'>('posts');
const statusesLoading = ref(false);
const loadGuard = createProfileLoadGuard();

const tabs = [
  { key: 'posts', label: 'Posts' },
  { key: 'replies', label: 'Posts & Replies' },
  { key: 'media', label: 'Media' },
] as const;

async function loadStatuses() {
  if (!account.value)
    return;
  statusesLoading.value = true;
  statuses.value = [];
  try {
    const paginator = useMastoClient().v1.accounts.$select(account.value.id).statuses.list({
      limit: 30,
      excludeReplies: tab.value === 'posts',
      onlyMedia: tab.value === 'media',
    });
    const result = await paginator.values().next();
    statuses.value = result.value ?? [];
  }
  catch (e) {
    console.error(e);
  }
  statusesLoading.value = false;
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
    await loadStatuses();
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
watch(tab, loadStatuses);

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
    <scroll-view v-else scroll-orientation="vertical" class="account-scroll">
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

      <!-- tabs -->
      <view class="account-tabs">
        <view
          v-for="t in tabs"
          :key="t.key"
          class="account-tab"
          @tap="tab = t.key"
        >
          <text class="account-tab-text" :class="tab === t.key ? 'account-tab-active' : ''">{{ t.label }}</text>
          <view class="account-tab-underline" :class="tab === t.key ? 'account-tab-underline-active' : ''" />
        </view>
      </view>

      <view v-if="statusesLoading" class="account-loading">
        <Spinner />
      </view>
      <StatusCard v-for="s in statuses" :key="s.id" :status="s" />
      <view class="account-bottom-pad" />
    </scroll-view>
  </view>
</template>

<style>
.account-scroll {
  flex: 1;
  width: 100%;
}

.account-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
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

.account-tabs {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid var(--c-border);
}

.account-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 10px 0 0;
}

.account-tab-text {
  font-size: 14px;
  color: var(--c-text-secondary);
  padding-bottom: 8px;
  transition: color var(--motion-state) var(--ease-out-quart), opacity var(--motion-state) var(--ease-out-quart);
}

.account-tab-active {
  color: var(--c-text-base);
  font-weight: 600;
}

.account-tab-underline {
  height: 3px;
  width: 60%;
  border-radius: 2px;
  background-color: var(--c-primary);
  opacity: 0;
  transform: scaleX(0.35);
  transition: transform var(--motion-state) var(--ease-out-quart), opacity var(--motion-state) var(--ease-out-quart);
}

.account-tab-underline-active {
  opacity: 1;
  transform: scaleX(1);
}

.account-bottom-pad {
  height: 40px;
}
</style>
