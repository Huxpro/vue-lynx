<script setup lang="ts">
import { ref } from 'vue-lynx';

declare const SystemInfo: { pixelHeight: number; pixelRatio: number };

const scrollbarHeight = ref(0);
const scrollbarTop = ref(0);

function adjustScrollbar(scrollTop: number, scrollHeight: number) {
  const listHeight = SystemInfo.pixelHeight / SystemInfo.pixelRatio;
  scrollbarHeight.value = listHeight * (listHeight / scrollHeight);
  scrollbarTop.value = listHeight * (scrollTop / scrollHeight);
}

defineExpose({ adjustScrollbar });
</script>

<template>
  <view
    class="scrollbar"
    :style="{ right: '3px', height: scrollbarHeight + 'px', top: scrollbarTop + 'px' }"
  >
    <view class="scrollbar-effect glow" />
  </view>
</template>
