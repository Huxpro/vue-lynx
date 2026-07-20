<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/explore/{index,tags,links}.vue —
// trending posts + trending hashtags + news. Upstream drives each tab with
// TimelinePaginator / TagCardPaginator / CommonPaginator; here every feed is
// a Lynx <list> + usePaginator (posts reuse TimelinePaginator).
import type { mastodon } from 'masto';
import { computed, ref, watch } from 'vue-lynx';
import { useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import Spinner from '../components/Spinner.vue';
import TimelinePaginator from '../components/TimelinePaginator.vue';
import { formatCompactNumber } from '../composables/format';
import { useMastoClient } from '../composables/masto';
import { type PaginatorState, usePaginator } from '../composables/paginator';
import { getTagRoute } from '../composables/routes';

const router = useRouter();

const tab = ref<'posts' | 'tags' | 'links'>('posts');
const showIntro = ref(true);

const postsPaginator = computed(() =>
  useMastoClient().v1.trends.statuses.list({ limit: 20 }),
);

let tagsPager: ReturnType<typeof usePaginator<mastodon.v1.Tag, any>> | null = null;
let linksPager: ReturnType<typeof usePaginator<mastodon.v1.TrendLink, any>> | null = null;

const tags = ref<mastodon.v1.Tag[]>([]);
const tagsState = ref<PaginatorState>('idle');
const links = ref<mastodon.v1.TrendLink[]>([]);
const linksState = ref<PaginatorState>('idle');

async function loadMoreTags() {
  tagsPager ??= usePaginator<mastodon.v1.Tag, any>(
    useMastoClient().v1.trends.tags.list({ limit: 20 }),
  );
  await tagsPager.loadNext();
  tags.value = [...tagsPager.items.value];
  tagsState.value = tagsPager.state.value;
}

async function loadMoreLinks() {
  linksPager ??= usePaginator<mastodon.v1.TrendLink, any>(
    useMastoClient().v1.trends.links.list({ limit: 20 }),
  );
  await linksPager.loadNext();
  links.value = [...linksPager.items.value];
  linksState.value = linksPager.state.value;
}

watch(tab, (next) => {
  if (next === 'tags' && !tagsPager)
    loadMoreTags();
  else if (next === 'links' && !linksPager)
    loadMoreLinks();
});

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
        <view class="explore-tab-underline" :class="tab === 'posts' ? 'explore-tab-underline-active' : ''" />
      </view>
      <view class="explore-tab" @tap="tab = 'tags'">
        <text class="explore-tab-text" :class="tab === 'tags' ? 'explore-tab-active' : ''">Hashtags</text>
        <view class="explore-tab-underline" :class="tab === 'tags' ? 'explore-tab-underline-active' : ''" />
      </view>
      <view class="explore-tab" @tap="tab = 'links'">
        <text class="explore-tab-text" :class="tab === 'links' ? 'explore-tab-active' : ''">News</text>
        <view class="explore-tab-underline" :class="tab === 'links' ? 'explore-tab-underline-active' : ''" />
      </view>
    </view>

    <view v-if="tab === 'posts' && showIntro" class="explore-intro">
      <AppIcon name="information-line" :size="20" color="#cc7d24" />
      <text class="explore-intro-text">These posts from this and other servers in the decentralized network are gaining traction on this server right now.</text>
      <view class="explore-intro-close" @tap="showIntro = false">
        <AppIcon name="close-line" :size="18" color="#686868" />
      </view>
    </view>

    <TimelinePaginator
      v-if="tab === 'posts'"
      :key="'explore-posts'"
      :paginator="postsPaginator"
      context="public"
    />

    <list
      v-else-if="tab === 'tags'"
      class="explore-list"
      scroll-orientation="vertical"
      :lower-threshold-item-count="4"
      @scrolltolower="loadMoreTags"
    >
      <list-item
        v-for="(tag, i) in tags"
        :key="tag.name"
        :item-key="tag.name"
        :estimated-main-axis-size-px="64"
      >
        <view
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
      </list-item>
      <list-item item-key="__footer" :estimated-main-axis-size-px="60">
        <view class="explore-footer">
          <Spinner v-if="tagsState === 'loading' || (!tags.length && tagsState !== 'done' && tagsState !== 'error')" />
          <text v-else-if="tagsState === 'done'" class="explore-end-text">End of trends</text>
        </view>
      </list-item>
    </list>

    <list
      v-else
      class="explore-list"
      scroll-orientation="vertical"
      :lower-threshold-item-count="4"
      @scrolltolower="loadMoreLinks"
    >
      <list-item
        v-for="link in links"
        :key="link.url"
        :item-key="link.url"
        :estimated-main-axis-size-px="96"
      >
        <view class="explore-link">
          <image v-if="link.image" :src="link.image" class="explore-link-img" mode="aspectFill" />
          <view class="explore-link-body">
            <text class="explore-link-host">{{ link.providerName || link.url.replace(/^https?:\/\//, '').split('/')[0] }}</text>
            <text class="explore-link-title" :text-maxline="2">{{ link.title }}</text>
            <text v-if="link.description" class="explore-link-desc" :text-maxline="2">{{ link.description }}</text>
          </view>
        </view>
      </list-item>
      <list-item item-key="__footer" :estimated-main-axis-size-px="60">
        <view class="explore-footer">
          <Spinner v-if="linksState === 'loading' || (!links.length && linksState !== 'done' && linksState !== 'error')" />
          <text v-else-if="linksState === 'done'" class="explore-end-text">End of news</text>
        </view>
      </list-item>
    </list>
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
  transition: color var(--motion-state) var(--ease-out-quart), opacity var(--motion-state) var(--ease-out-quart);
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
  opacity: 0;
  transform: scaleX(0.35);
  transition: transform var(--motion-state) var(--ease-out-quart), opacity var(--motion-state) var(--ease-out-quart);
}

.explore-tab-underline-active {
  opacity: 1;
  transform: scaleX(1);
}

.explore-intro {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 10px 12px 16px;
  background-color: var(--c-primary-fade);
  border-bottom: 1px solid var(--c-border);
}

.explore-intro-text {
  flex: 1;
  color: var(--c-text-secondary);
  font-size: 13px;
  line-height: 18px;
}

.explore-intro-close {
  width: 40px;
  height: 40px;
  margin-top: -10px;
  margin-right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.explore-list {
  width: 100%;
  flex: 1;
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

.explore-footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

.explore-end-text {
  font-size: 13px;
  color: var(--c-text-secondary-light);
}
</style>
