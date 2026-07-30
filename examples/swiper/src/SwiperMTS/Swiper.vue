<script setup lang="ts">
import { useMainThreadRef } from 'vue-lynx';
import SwiperItem from '../Components/SwiperItem.vue';

declare const SystemInfo: { pixelWidth: number; pixelRatio: number };

const props = withDefaults(defineProps<{
  data: string[];
  itemWidth?: number;
}>(), {
  itemWidth: () => SystemInfo.pixelWidth / SystemInfo.pixelRatio,
});

// --- Main Thread refs ---
const containerRef = useMainThreadRef<unknown>(null);
const currentOffsetRef = useMainThreadRef<number>(0);
const touchStartXRef = useMainThreadRef<number>(0);
const touchStartOffsetRef = useMainThreadRef<number>(0);
</script>

<!-- MTS touch handlers, grouped in the experimental `script main` block:
     every top-level function here runs on the Main Thread — no per-function
     'main thread' directives. The MainThreadRefs from `script setup` above
     are captured as usual. -->
<script main lang="ts">
const handleTouchStart = (e: { touches: Array<{ clientX: number }> }) => {
  touchStartXRef.current = e.touches[0].clientX;
  touchStartOffsetRef.current = currentOffsetRef.current;
};

const handleTouchMove = (e: { touches: Array<{ clientX: number }> }) => {
  const delta = e.touches[0].clientX - touchStartXRef.current;
  const offset = touchStartOffsetRef.current + delta;
  currentOffsetRef.current = offset;
  const el = containerRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void };
  };
  if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translateX(${offset}px)`);
  }
};

const handleTouchEnd = () => {
  touchStartXRef.current = 0;
  touchStartOffsetRef.current = 0;
};
</script>

<template>
  <view class="swiper-wrapper">
    <view
      class="swiper-container"
      :main-thread-ref="containerRef"
      :main-thread-bindtouchstart="handleTouchStart"
      :main-thread-bindtouchmove="handleTouchMove"
      :main-thread-bindtouchend="handleTouchEnd"
    >
      <SwiperItem
        v-for="(pic, index) in data"
        :key="index"
        :pic="pic"
        :item-width="props.itemWidth"
      />
    </view>
  </view>
</template>
