<script setup lang="ts">
import { ref, onMounted, nextTick, useTemplateRef } from 'vue-lynx';
import type { ShadowElement } from 'vue-lynx';

import { furnituresPictures } from '../Pictures/furnituresPictures';
import { calculateEstimatedSize } from '../utils';

import LikeImageCard from '../Components/LikeImageCard.vue';
import NiceScrollbar from './NiceScrollbar.vue';

const scrollbarRef = ref<InstanceType<typeof NiceScrollbar> | null>(null);
const listRef = useTemplateRef<ShadowElement>('listRef');

function onScroll(event: {
  detail?: { scrollTop?: number; scrollHeight?: number; listHeight?: number };
}) {
  const scrollTop = event.detail?.scrollTop ?? 0;
  const scrollHeight = event.detail?.scrollHeight ?? 0;
  // `listHeight` is the list's own box. Native engines report it; Lynx for Web
  // reports 0, and there the list fills the page, so the page height is the
  // same number.
  const listHeight = event.detail?.listHeight || SystemInfo.pixelHeight / SystemInfo.pixelRatio;
  scrollbarRef.value?.adjustScrollbar(scrollTop, scrollHeight, listHeight);
}

onMounted(() => {
  nextTick(() => {
    listRef.value
      ?.invoke({
        method: 'autoScroll',
        params: { rate: '60', start: 'true' },
      })
      .exec();
  });
});
</script>

<template>
  <view class="gallery-wrapper">
    <NiceScrollbar ref="scrollbarRef" />
    <list
      ref="listRef"
      class="list"
      list-type="waterfall"
      :column-count="2"
      scroll-orientation="vertical"
      @scroll="onScroll"
      :scroll-event-throttle="0"
    >
      <list-item
        v-for="(pic, i) in furnituresPictures"
        :key="i"
        :item-key="String(i)"
        :estimated-main-axis-size-px="calculateEstimatedSize(pic.width, pic.height)"
      >
        <LikeImageCard :picture="pic" />
      </list-item>
    </list>
  </view>
</template>
