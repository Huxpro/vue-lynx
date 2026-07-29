<script setup lang="ts">
// Ported from elk: app/pages/[[server]]/explore/{index,tags,links}.vue —
// trending posts + hashtags + news. Tabs use TabPager; each pane keeps its
// own <list> + paginator so swipe preserves data and scroll position.
import type { mastodon } from 'masto';
import { computed, reactive, ref, watch } from 'vue-lynx';
import { useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import Spinner from '../components/Spinner.vue';
import TabPager from '../components/TabPager.vue';
import TimelinePaginator from '../components/TimelinePaginator.vue';
import { formatCompactNumber } from '../composables/format';
import { useMastoClient } from '../composables/masto';
import { type PaginatorState, usePaginator } from '../composables/paginator';
import { getTagRoute } from '../composables/routes';

const router = useRouter();

const tabs = [
  { key: 'posts', label: 'Posts' },
  { key: 'tags', label: 'Hashtags' },
  { key: 'links', label: 'News' },
] as const;

type TabKey = typeof tabs[number]['key'];

const tab = ref<TabKey>('posts');
const showIntro = ref(true);

const postsPaginator = computed(() =>
  useMastoClient().v1.trends.statuses.list({ limit: 20 }),
);

const tagFeed = reactive<{
  items: mastodon.v1.Tag[];
  state: PaginatorState;
}>({ items: [], state: 'idle' });
const linkFeed = reactive<{
  items: mastodon.v1.TrendLink[];
  state: PaginatorState;
}>({ items: [], state: 'idle' });

let tagsPager: ReturnType<typeof usePaginator<mastodon.v1.Tag, any>> | null = null;
let linksPager: ReturnType<typeof usePaginator<mastodon.v1.TrendLink, any>> | null = null;

async function loadMoreTags() {
  tagsPager ??= usePaginator<mastodon.v1.Tag, any>(
    useMastoClient().v1.trends.tags.list({ limit: 20 }),
  );
  await tagsPager.loadNext();
  tagFeed.items = [...tagsPager.items.value];
  tagFeed.state = tagsPager.state.value;
}

async function loadMoreLinks() {
  linksPager ??= usePaginator<mastodon.v1.TrendLink, any>(
    useMastoClient().v1.trends.links.list({ limit: 20 }),
  );
  await linksPager.loadNext();
  linkFeed.items = [...linksPager.items.value];
  linkFeed.state = linksPager.state.value;
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

    <TabPager v-model="tab" :tabs="tabs">
      <template #posts>
        <view v-if="showIntro" class="explore-intro">
          <AppIcon name="information-line" :size="20" color="#cc7d24" />
          <text class="explore-intro-text">These posts from this and other servers in the decentralized network are gaining traction on this server right now.</text>
          <view class="explore-intro-close" @tap="showIntro = false">
            <AppIcon name="close-line" :size="18" color="#686868" />
          </view>
        </view>
        <TimelinePaginator
          :paginator="postsPaginator"
          context="public"
        />
      </template>

      <template #tags>
        <list
          class="explore-list"
          scroll-orientation="vertical"
          :lower-threshold-item-count="4"
          @scrolltolower="loadMoreTags"
        >
          <list-item
            v-for="(tag, i) in tagFeed.items"
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
              <Spinner v-if="tagFeed.state === 'loading'" />
              <text v-else-if="tagFeed.state === 'done'" class="explore-end-text">End of trends</text>
            </view>
          </list-item>
        </list>
      </template>

      <template #links>
        <list
          class="explore-list"
          scroll-orientation="vertical"
          :lower-threshold-item-count="4"
          @scrolltolower="loadMoreLinks"
        >
          <list-item
            v-for="link in linkFeed.items"
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
              <Spinner v-if="linkFeed.state === 'loading'" />
              <text v-else-if="linkFeed.state === 'done'" class="explore-end-text">End of news</text>
            </view>
          </list-item>
        </list>
      </template>
    </TabPager>
  </view>
</template>

<style>
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
  flex: 1;
  width: 100%;
  min-height: 0;
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
