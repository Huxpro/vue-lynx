<script setup lang="ts">
import { onMounted, nextTick, useMainThreadRef, useTemplateRef } from 'vue-lynx';
import type { ShadowElement } from 'vue-lynx';

import { furnituresPictures } from '../Pictures/furnituresPictures';
import { calculateEstimatedSize } from '../utils';

import LikeImageCard from '../Components/LikeImageCard.vue';
import NiceScrollbarMTS from './NiceScrollbarMTS.vue';

declare const SystemInfo: { pixelHeight: number; pixelRatio: number };

// MainThreadRef for the scrollbar thumb element
const scrollbarThumbRef = useMainThreadRef(null);
const listRef = useTemplateRef<ShadowElement>('listRef');

// MTS scrollbar adjuster — runs directly on Main Thread, no thread crossings
function adjustScrollbarMTS(
  scrollTop: number,
  scrollHeight: number,
  ref: { current?: { setStyleProperty?(k: string, v: string): void } },
) {
  'main thread';
  const listHeight = SystemInfo.pixelHeight / SystemInfo.pixelRatio - 48;
  const scrollbarHeight = listHeight * (listHeight / scrollHeight);
  const scrollbarTop = listHeight * (scrollTop / scrollHeight);
  ref.current?.setStyleProperty?.('height', `${scrollbarHeight}px`);
  ref.current?.setStyleProperty?.('top', `${scrollbarTop}px`);
}

const onScrollMTS = (event: { detail: { scrollTop: number; scrollHeight: number } }) => {
  'main thread';
  adjustScrollbarMTS(event.detail.scrollTop, event.detail.scrollHeight, scrollbarThumbRef);
};

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
    <NiceScrollbarMTS :thumb-ref="scrollbarThumbRef" />
    <list
      ref="listRef"
      class="list"
      list-type="waterfall"
      :column-count="2"
      scroll-orientation="vertical"
      :main-thread-bindscroll="onScrollMTS"
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
