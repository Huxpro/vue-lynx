<script setup lang="ts">
import { computed, ref, watch } from 'vue-lynx';
import { useRouter } from 'vue-router';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query';
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

const { data: items, isLoading, isFetching, isError } = useQuery({
  queryKey: computed(() => ['feed', props.feed, props.page]),
  queryFn: () => fetchFeed(props.feed, props.page),
  staleTime: 5 * 60 * 1000,
  placeholderData: keepPreviousData,
});

// Track slide direction: "next" slides left, "prev" slides right
const slideDirection = ref<'slide-left' | 'slide-right'>('slide-left');

// Prefetch adjacent pages + track direction
watch(
  () => [props.feed, props.page] as const,
  ([feed, page], old) => {
    // Determine slide direction from page change
    if (old) {
      const [oldFeed, oldPage] = old;
      slideDirection.value = (feed !== oldFeed || page >= oldPage) ? 'slide-left' : 'slide-right';
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
  <view class="flex flex-col flex-1">
    <!-- Pagination nav -->
    <view
      class="bg-hn-card flex flex-row items-center justify-center border-b border-hn-border"
      :style="{ padding: '15px 30px', gap: '1em' }"
    >
      <text
        :style="{
          fontSize: '15px',
          color: hasPrev ? '#3eaf7c' : '#595959',
          opacity: hasPrev ? 1 : 0.5,
        }"
        @tap="goPrev"
      >
        &lt; prev
      </text>
      <text :style="{ fontSize: '15px', color: '#2e495e' }">
        {{ page }}/{{ maxPage }}
      </text>
      <text
        :style="{
          fontSize: '15px',
          color: hasNext ? '#3eaf7c' : '#595959',
          opacity: hasNext ? 1 : 0.5,
        }"
        @tap="goNext"
      >
        more &gt;
      </text>
    </view>

    <!-- Item list -->
    <scroll-view class="flex-1" scroll-orientation="vertical">
      <!-- Full loading (no cached data) -->
      <view v-if="isLoading" class="items-center" :style="{ padding: '40px' }">
        <Spinner :show="true" />
      </view>

      <view v-else-if="isError" class="items-center" :style="{ padding: '40px' }">
        <text :style="{ fontSize: '15px', color: '#e53e3e' }">Failed to load stories.</text>
      </view>

      <template v-else>
        <!-- Background refetch indicator -->
        <view v-if="isFetching && !isLoading" class="items-center" :style="{ paddingTop: '12px' }">
          <Spinner :show="true" />
        </view>

        <!-- Slide transition: direction flips based on prev/next -->
        <Transition :name="slideDirection" mode="out-in" :duration="300">
          <view class="bg-hn-card" :key="feed + '-' + page" :style="{ marginTop: '10px' }">
            <NewsItem
              v-for="item in items"
              :key="item.id"
              :item="item"
            />
          </view>
        </Transition>
      </template>
    </scroll-view>
  </view>
</template>

<style>
/* Slide left: next page (enter from right, leave to left) */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 300ms cubic-bezier(0.55, 0, 0.1, 1), transform 300ms cubic-bezier(0.55, 0, 0.1, 1);
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
/* Slide right: prev page (enter from left, leave to right) */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
