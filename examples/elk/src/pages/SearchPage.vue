<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/search.vue + components/search/*.
// Debounced multi-type search via the ported useSearch composable.
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import AccountAvatar from '../components/AccountAvatar.vue';
import AccountDisplayName from '../components/AccountDisplayName.vue';
import AppIcon from '../components/AppIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import Spinner from '../components/Spinner.vue';
import StatusCard from '../components/StatusCard.vue';
import { formatCompactNumber } from '../composables/format';
import { useSearch } from '../composables/search';

const router = useRouter();
const query = ref('');
const { accounts, hashtags, statuses, loading } = useSearch(query);

function onInput(e: { detail?: { value?: string } }) {
  query.value = e.detail?.value ?? '';
}

function totalUses(tag: { history?: { uses: string }[] }): number {
  return (tag.history ?? []).reduce((acc, h) => acc + Number(h.uses || 0), 0);
}
</script>

<template>
  <view class="page">
    <PageHeader title="Search" />
    <view class="search-box">
      <AppIcon name="search-line" :size="18" color="#919191" />
      <input
        class="search-input"
        type="text"
        placeholder="Search people, hashtags, posts"
        :value="query"
        @input="onInput"
      />
    </view>

    <scroll-view scroll-orientation="vertical" class="search-results">
      <view v-if="loading" class="search-loading">
        <Spinner />
      </view>

      <view v-else-if="!query" class="search-hint">
        <text class="search-hint-text">Search for people, hashtags and posts</text>
      </view>

      <template v-else>
        <view v-if="accounts.length" class="search-section">
          <text class="search-section-title">People</text>
          <view
            v-for="result in accounts.slice(0, 5)"
            :key="result.id"
            class="search-account"
            @tap="router.push(result.to)"
          >
            <AccountAvatar :account="result.data" :size="40" />
            <view class="search-account-names">
              <AccountDisplayName :account="result.data" :font-size="14" />
              <text class="search-account-handle">@{{ result.data.acct }}</text>
            </view>
          </view>
        </view>

        <view v-if="hashtags.length" class="search-section">
          <text class="search-section-title">Hashtags</text>
          <view
            v-for="result in hashtags.slice(0, 5)"
            :key="result.id"
            class="search-tag"
            @tap="router.push(result.to)"
          >
            <AppIcon name="hashtag" :size="18" color="#686868" />
            <text class="search-tag-name">{{ result.data.name }}</text>
            <text class="search-tag-uses">{{ formatCompactNumber(totalUses(result.data)) }} recent uses</text>
          </view>
        </view>

        <view v-if="statuses.length" class="search-section">
          <text class="search-section-title">Posts</text>
          <StatusCard v-for="result in statuses" :key="result.id" :status="result.data" />
        </view>

        <view
          v-if="!accounts.length && !hashtags.length && !statuses.length"
          class="search-hint"
        >
          <text class="search-hint-text">No results for "{{ query }}"</text>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<style>
.search-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 10px 16px;
  padding: 0 12px;
  height: 40px;
  border: 1px solid var(--c-border);
  border-radius: 20px;
  background-color: var(--c-bg-card);
  gap: 8px;
}

.search-input {
  flex: 1;
  height: 38px;
  font-size: 15px;
  color: var(--c-text-base);
}

.search-results {
  flex: 1;
  width: 100%;
}

.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
}

.search-hint {
  display: flex;
  align-items: center;
  padding: 48px 16px;
}

.search-hint-text {
  font-size: 14px;
  color: var(--c-text-secondary-light);
}

.search-section {
  display: flex;
  flex-direction: column;
  padding-top: 8px;
}

.search-section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text-secondary);
  padding: 6px 16px;
}

.search-account {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
}

.search-account-names {
  display: flex;
  flex-direction: column;
}

.search-account-handle {
  font-size: 13px;
  color: var(--c-text-secondary);
}

.search-tag {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
}

.search-tag-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--c-text-base);
}

.search-tag-uses {
  font-size: 13px;
  color: var(--c-text-secondary);
  margin-left: auto;
}
</style>
