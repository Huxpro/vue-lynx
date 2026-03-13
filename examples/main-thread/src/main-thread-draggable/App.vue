<script setup lang="ts">
import { ref } from 'vue'
import { useMainThreadRef } from 'vue-lynx'

import MainThreadDraggable from './MainThreadDraggable.vue'
import BackgroundDraggable from './BackgroundDraggable.vue'

const DEFAULT_X = 0
const DEFAULT_Y = 500

// MainThreadRef for the MT draggable box
const mtDraggableRef = useMainThreadRef(null)

// Main Thread scroll handler — SWC captures mtDraggableRef in _c.
// On MT, the worklet-runtime hydrates _wvid refs, providing .current
// that points to the actual PAPI element.
const onMTScroll = (event: { detail?: { scrollTop?: number } }) => {
  'main thread'
  const scrollTop = event.detail?.scrollTop ?? 0
  const newY = DEFAULT_Y - scrollTop

  // mtDraggableRef is captured from _c — on MT it's hydrated as { current: element }
  const el = (mtDraggableRef as unknown as { current?: { setStyleProperty?(k: string, v: string): void } }).current
  if (el?.setStyleProperty) {
    el.setStyleProperty('transform', `translate(${DEFAULT_X}px, ${newY}px)`)
  }
}

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
        :main-thread-bindscroll="onMTScroll"
        @scroll="onBGScroll"
      >
        <view :style="{ backgroundColor: 'yellow', width: '100%', height: 500 }" />
        <view :style="{ backgroundColor: 'lightskyblue', width: '100%', height: 100 }" />
        <view :style="{ backgroundColor: 'yellow', width: '100%', height: 1000 }" />
      </scroll-view>

      <!-- Right half: Draggable boxes -->
      <view :style="{ width: '50%', height: '100%', display: 'flex', flexDirection: 'row' }">
        <MainThreadDraggable :size="100" :mt-ref="mtDraggableRef" />
        <BackgroundDraggable :size="100" :pos-x="bgPosX" :pos-y="bgPosY" />
      </view>
    </view>
  </view>
</template>
