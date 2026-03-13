<script setup lang="ts">
import { ref } from 'vue'

import BackgroundDraggable from './BackgroundDraggable.vue'

const DEFAULT_X = 0
const DEFAULT_Y = 500

const posX = ref(DEFAULT_X)
const posY = ref(DEFAULT_Y)

function onScroll(event: { detail?: { scrollTop?: number } }) {
  const scrollTop = event.detail?.scrollTop ?? 0
  posX.value = DEFAULT_X
  posY.value = DEFAULT_Y - scrollTop
}
</script>

<template>
  <view :style="{ width: '100%', height: '100%', position: 'relative', backgroundColor: 'white' }">
    <view :style="{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }">
      <!-- Left half: Scroll View -->
      <scroll-view
        :style="{ width: '50%', height: '100%' }"
        scroll-orientation="vertical"
        @scroll="onScroll"
      >
        <view :style="{ backgroundColor: 'yellow', width: '100%', height: 500 }" />
        <view :style="{ backgroundColor: 'lightskyblue', width: '100%', height: 100 }" />
        <view :style="{ backgroundColor: 'yellow', width: '100%', height: 1000 }" />
      </scroll-view>

      <!-- Right half: Draggable box -->
      <view :style="{ width: '50%', height: '100%', display: 'flex', flexDirection: 'row' }">
        <BackgroundDraggable :size="100" :pos-x="posX" :pos-y="posY" />
      </view>
    </view>
  </view>
</template>
