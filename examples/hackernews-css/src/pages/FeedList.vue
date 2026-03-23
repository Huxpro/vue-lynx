<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';
import { useRouter } from 'vue-router';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { fetchFeed } from '../api';
import NewsItem from '../components/NewsItem.vue';
import Spinner from '../components/Spinner.vue';

const props = defineProps<{
  feed: string;
  page: number;
  maxPage: number;
}>();

const router = useRouter();
const queryClient = useQueryClient();
const slideDirection = ref<'slide-left' | 'slide-right'>('slide-left');

const { data: items, isLoading, isFetching, isError } = useQuery({
  queryKey: computed(() => ['feed', props.feed, props.page]),
  queryFn: () => fetchFeed(props.feed, props.page),
  staleTime: 5 * 60 * 1000,
  placeholderData: keepPreviousData,
});

watch(
  () => [props.feed, props.page] as const,
  ([feed, page], oldValue) => {
    if (oldValue) {
      const [oldFeed, oldPage] = oldValue;
      slideDirection.value =
        feed !== oldFeed || page >= oldPage ? 'slide-left' : 'slide-right';
    }

    if (page < props.maxPage) {
      queryClient.prefetchQuery({
        queryKey: ['feed', feed, page + 1],
        queryFn: () => fetchFeed(feed, page + 1),
        staleTime: 5 * 60 * 1000,
      });
    }

    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: ['feed', feed, page - 1],
        queryFn: () => fetchFeed(feed, page - 1),
        staleTime: 5 * 60 * 1000,
      });
    }
  },
  { immediate: true },
);

const hasPrev = computed(() => props.page > 1);
const hasNext = computed(() => props.page < props.maxPage);

function goPrev() {
  if (hasPrev.value) {
    router.push(`/${props.feed}/${props.page - 1}`);
  }
}

function goNext() {
  if (hasNext.value) {
    router.push(`/${props.feed}/${props.page + 1}`);
  }
}
</script>

<template>
  <scroll-view class="view feed-view" scroll-orientation="vertical">
    <view class="news-list-nav">
      <text class="nav-button" :class="{ disabled: !hasPrev }" @tap="goPrev">
        &lt; prev
      </text>
      <text class="nav-page">{{ page }}/{{ maxPage }}</text>
      <text class="nav-button" :class="{ disabled: !hasNext }" @tap="goNext">
        more &gt;
      </text>
    </view>

    <view class="feed-content">
      <view v-if="isLoading" class="status-card">
        <Spinner :show="true" />
      </view>

      <view v-else-if="isError" class="status-card">
        <text class="status-error">Failed to load stories.</text>
      </view>

      <template v-else>
        <view v-if="isFetching" class="status-inline">
          <Spinner :show="true" />
        </view>

        <Transition :name="slideDirection" mode="out-in" :duration="300">
          <view :key="`${feed}-${page}`" class="news-list">
            <TransitionGroup name="item" tag="view" :duration="500">
              <NewsItem v-for="item in items" :key="item.id" :item="item" />
            </TransitionGroup>
          </view>
        </Transition>
      </template>
    </view>
  </scroll-view>
</template>

<style lang="scss">
.news-list-nav,
.news-list {
  background-color: #fff;
  border-radius: 2px;
}

.feed-view {
  height: 100%;
}

.feed-content {
  padding-top: 56px;
  padding-bottom: 30px;
}

.news-list-nav {
  position: fixed;
  top: 55px;
  z-index: 998;
  left: 0;
  right: 0;
  padding: 15px 30px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.nav-button {
  margin: 0 1em;
  color: #2e495e;
}

.nav-button.disabled {
  opacity: 0.8;
}

.nav-page {
  color: #2e495e;
}

.news-list {
  margin: 30px 0;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}

.status-card {
  background-color: #fff;
  border-radius: 2px;
  margin: 30px 0;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-inline {
  display: flex;
  justify-content: center;
  padding-top: 12px;
}

.status-error {
  color: #c53030;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.slide-left-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translate(30px, 0);
}

.slide-left-leave-to,
.slide-right-enter-from {
  opacity: 0;
  transform: translate(-30px, 0);
}

.item-move,
.item-enter-active,
.item-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.item-enter-from {
  opacity: 0;
  transform: translate(30px, 0);
}

.item-leave-to {
  position: absolute;
  opacity: 0;
  transform: translate(30px, 0);
}

@media (max-width: 600px) {
  .news-list {
    margin: 10px 0;
  }

  .news-list-nav {
    padding: 15px;
  }

  .feed-content {
    padding-top: 52px;
  }
}
</style>
