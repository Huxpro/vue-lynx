<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/explore/{index,tags}.vue —
// trending posts + trending hashtags tabs.
import type { mastodon } from 'masto';
import { onMounted, ref, watch } from 'vue-lynx';
import { useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import Spinner from '../components/Spinner.vue';
import StatusCard from '../components/StatusCard.vue';
import { formatCompactNumber } from '../composables/format';
import { useMastoClient } from '../composables/masto';
import { getTagRoute } from '../composables/routes';

const router = useRouter();

const tab = ref<'posts' | 'tags' | 'links'>('posts');
const statuses = ref<mastodon.v1.Status[]>([]);
const tags = ref<mastodon.v1.Tag[]>([]);
const links = ref<mastodon.v1.TrendLink[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    const client = useMastoClient();
    if (tab.value === 'posts' && !statuses.value.length) {
      const result = await client.v1.trends.statuses.list({ limit: 20 }).values().next();
      statuses.value = result.value ?? [];
    }
    else if (tab.value === 'tags' && !tags.value.length) {
      const result = await client.v1.trends.tags.list({ limit: 20 }).values().next();
      tags.value = result.value ?? [];
    }
    else if (tab.value === 'links' && !links.value.length) {
      const result = await client.v1.trends.links.list({ limit: 20 }).values().next();
      links.value = result.value ?? [];
    }
  }
  catch (e) {
    console.error(e);
  }
  loading.value = false;
}

onMounted(load);
watch(tab, load);

function tagUses(tag: mastodon.v1.Tag): number {
  return (tag.history ?? []).slice(0, 2).reduce((acc, h) => acc + Number(h.uses || 0), 0);
}
</script>

<template>
  <view class="page">
    <PageHeader title="Explore" icon="compass-3-line" />

    <view class="explore-tabs">
      <view class="explore-tab" @tap="tab = 'posts'">
        <text class="explore-tab-text" :class="tab === 'posts' ? 'explore-tab-active' : ''">Posts</text>
        <view v-if="tab === 'posts'" class="explore-tab-underline" />
      </view>
      <view class="explore-tab" @tap="tab = 'tags'">
        <text class="explore-tab-text" :class="tab === 'tags' ? 'explore-tab-active' : ''">Hashtags</text>
        <view v-if="tab === 'tags'" class="explore-tab-underline" />
      </view>
      <view class="explore-tab" @tap="tab = 'links'">
        <text class="explore-tab-text" :class="tab === 'links' ? 'explore-tab-active' : ''">News</text>
        <view v-if="tab === 'links'" class="explore-tab-underline" />
      </view>
    </view>

    <view v-if="loading" class="explore-loading">
      <Spinner />
    </view>

    <scroll-view v-else-if="tab === 'posts'" scroll-orientation="vertical" class="explore-scroll">
      <StatusCard v-for="s in statuses" :key="s.id" :status="s" />
      <view class="explore-bottom-pad" />
    </scroll-view>

    <scroll-view v-else-if="tab === 'links'" scroll-orientation="vertical" class="explore-scroll">
      <view v-for="link in links" :key="link.url" class="explore-link">
        <image v-if="link.image" :src="link.image" class="explore-link-img" mode="aspectFill" />
        <view class="explore-link-body">
          <text class="explore-link-host">{{ link.providerName || link.url.replace(/^https?:\/\//, '').split('/')[0] }}</text>
          <text class="explore-link-title" :text-maxline="2">{{ link.title }}</text>
          <text v-if="link.description" class="explore-link-desc" :text-maxline="2">{{ link.description }}</text>
        </view>
      </view>
      <view class="explore-bottom-pad" />
    </scroll-view>

    <scroll-view v-else scroll-orientation="vertical" class="explore-scroll">
      <view
        v-for="(tag, i) in tags"
        :key="tag.name"
        class="explore-tag"
        @tap="router.push(getTagRoute(tag.name))"
      >
        <text class="explore-tag-rank">{{ i + 1 }}</text>
        <view class="explore-tag-names">
          <text class="explore-tag-name">#{{ tag.name }}</text>
          <text class="explore-tag-uses">{{ formatCompactNumber(tagUses(tag)) }} people in the past 2 days</text>
        </view>
        <AppIcon name="fire-line" :size="18" color="#cc7d24" />
      </view>
      <view class="explore-bottom-pad" />
    </scroll-view>
  </view>
</template>

<style>
.explore-tabs {
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid var(--c-border);
}

.explore-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding-top: 10px;
}

.explore-tab-text {
  font-size: 14px;
  color: var(--c-text-secondary);
  padding-bottom: 8px;
}

.explore-tab-active {
  color: var(--c-text-base);
  font-weight: 600;
}

.explore-tab-underline {
  height: 3px;
  width: 50%;
  border-radius: 2px;
  background-color: var(--c-primary);
}

.explore-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
}

.explore-scroll {
  flex: 1;
  width: 100%;
}

.explore-tag {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--c-border);
  gap: 12px;
}

.explore-tag-rank {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text-secondary-light);
  width: 22px;
}

.explore-tag-names {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.explore-tag-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--c-text-base);
}

.explore-tag-uses {
  font-size: 12px;
  color: var(--c-text-secondary);
}

.explore-bottom-pad {
  height: 40px;
}

.explore-link {
  display: flex;
  flex-direction: row;
  padding: 12px 16px;
  border-bottom: 1px solid var(--c-border);
  gap: 12px;
}

.explore-link-img {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  background-color: var(--c-bg-active);
  flex-shrink: 0;
}

.explore-link-body {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.explore-link-host {
  font-size: 12px;
  color: var(--c-text-secondary);
}

.explore-link-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-base);
  margin-top: 2px;
}

.explore-link-desc {
  font-size: 12px;
  color: var(--c-text-secondary);
  margin-top: 2px;
}
</style>
