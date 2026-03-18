<script setup lang="ts">
import { ref } from 'vue'
import { useMainThreadRef } from 'vue-lynx'

import MainThreadDraggable from './MainThreadDraggable.vue'
import BackgroundDraggable from './BackgroundDraggable.vue'

const DEFAULT_X = 0
const DEFAULT_Y = 500

// --- Main Thread Scroll Handler (worklet context) ---
const onMTScrollCtx = {
  _wkltId: 'main-thread-draggable-raw:onScroll',
  _workletType: 'main-thread',
  _c: {} as Record<string, unknown>,
}

// MainThreadRef for the MT draggable box
const mtDraggableRef = useMainThreadRef(null)

// Stamp the ref's _wvid into the worklet context so the MT handler
// can resolve it via lynxWorkletImpl._refImpl._workletRefMap
onMTScrollCtx._c = { _mtRef: mtDraggableRef.toJSON() }

// --- Background Thread Scroll Handler ---
const bgPosX = ref(DEFAULT_X)
const bgPosY = ref(DEFAULT_Y)

function onBGScroll(event: { detail?: { scrollTop?: number } }) {
  const scrollTop = event.detail?.scrollTop ?? 0
  bgPosX.value = DEFAULT_X
  bgPosY.value = DEFAULT_Y - scrollTop
}
</script>

<template>
  <view :style="{ width: '100%', height: '100%', position: 'relative', backgroundColor: 'white' }">
    <view :style="{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }">
      <!-- Left half: Scroll View -->
      <scroll-view
        :style="{ width: '50%', height: '100%' }"
        scroll-orientation="vertical"
        :main-thread-bindscroll="onMTScrollCtx"
        @scroll="onBGScroll"
      >
        <view :style="{ backgroundColor: 'yellow', width: '100%', height: '500px' }" />
        <view :style="{ backgroundColor: 'lightskyblue', width: '100%', height: '100px' }" />
        <view :style="{ backgroundColor: 'yellow', width: '100%', height: '1000px' }" />
      </scroll-view>

      <!-- Right half: Draggable boxes -->
      <view :style="{ width: '50%', height: '100%', display: 'flex', flexDirection: 'row' }">
        <MainThreadDraggable :size="100" :mt-ref="mtDraggableRef" />
        <BackgroundDraggable :size="100" :pos-x="bgPosX" :pos-y="bgPosY" />
      </view>
    </view>
  </view>
</template>
