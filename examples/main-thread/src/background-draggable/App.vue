<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  Background Draggable Demo — Vue port of React Lynx's background-draggable example.

  Left half: scroll-view with large colored blocks
  Right half: a box that tracks scroll position (start at y=500, move up)

  Position is updated entirely through Vue's reactive system on the Background
  Thread — no Main Thread APIs are used. Compare with main-thread-draggable/
  to see the latency difference.
-->
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
