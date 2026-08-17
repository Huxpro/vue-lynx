<script setup lang="ts">
// Ported from elk: app/components/timeline/TimelinePaginator.vue +
// common/CommonPaginator.vue. Elk virtualizes with virtua's DOM
// WindowVirtualizer and triggers loads from an end-anchor's bounding box;
// here the native Lynx <list> recycles items and its scrolltolower event
// drives usePaginator.loadNext().
import type { mastodon } from 'masto';
import { onMounted } from 'vue-lynx';
import { usePaginator } from '../composables/paginator';
import { filterAndReorderTimeline } from '../composables/timeline';
import Spinner from './Spinner.vue';
import StatusCard from './StatusCard.vue';

const props = withDefaults(defineProps<{
  paginator: mastodon.Paginator<mastodon.v1.Status[], any>;
  context?: mastodon.v1.FilterContext;
}>(), {
  context: 'public',
});

const { items, state, loadNext } = usePaginator<mastodon.v1.Status, any>(
  props.paginator,
  statuses => filterAndReorderTimeline([...statuses] as mastodon.v1.Status[], props.context),
);

onMounted(() => loadNext());
</script>

<template>
  <view v-if="state === 'loading' && !items.length" class="timeline-loading">
    <Spinner />
  </view>
  <view v-else-if="state === 'error' && !items.length" class="timeline-loading">
    <text class="timeline-error-text">Failed to load timeline.</text>
    <view class="timeline-retry" @tap="state = 'idle'; loadNext()">
      <text class="timeline-retry-text">Retry</text>
    </view>
  </view>
  <list
    v-else
    class="timeline-list"
    scroll-orientation="vertical"
    :lower-threshold-item-count="4"
    @scrolltolower="loadNext"
  >
    <list-item
      v-for="status in items"
      :key="status.id"
      :item-key="status.id"
      :estimated-main-axis-size-px="160"
    >
      <StatusCard :status="status" />
    </list-item>
    <list-item item-key="__footer" :estimated-main-axis-size-px="60">
      <view class="timeline-footer">
        <Spinner v-if="state === 'loading'" />
        <text v-else-if="state === 'done'" class="timeline-end-text">End of the timeline</text>
      </view>
    </list-item>
  </list>
</template>

<style>
.timeline-list {
  width: 100%;
  flex: 1;
}

.timeline-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
  gap: 12px;
}

.timeline-error-text {
  font-size: 14px;
  color: var(--c-danger);
}

.timeline-retry {
  border: 1px solid var(--c-border);
  border-radius: 6px;
  padding: 4px 14px;
}

.timeline-retry-text {
  font-size: 14px;
  color: var(--c-text-secondary);
}

.timeline-footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

.timeline-end-text {
  font-size: 13px;
  color: var(--c-text-secondary-light);
}
</style>
