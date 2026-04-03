<script setup lang="ts">
// VBindThreads — audits both style-update paths:
//
// LEFT  (Background Thread)
//   tap → BG JS handler → reactive ref → useCssVars → SET_STYLE op → MT applies CSS var
//
// RIGHT (Main Thread)
//   tap → MT worklet → setStyleProperty() directly (no ops round-trip)
//         + runOnBackground(incrementMtCount) to sync tap count for display

import { ref, watch } from 'vue'
import { useMainThreadRef, runOnBackground, runOnMainThread } from 'vue-lynx'

const COLORS = ['#1565c0', '#c62828', '#2e7d32', '#f57f17', '#6a1b9a']

// --- Background thread ---
const bgColorIdx = ref(0)
const bgColor = ref(COLORS[0]!)
const bgTapCount = ref(0)

function onBgTap() {
  bgTapCount.value++
  bgColorIdx.value = (bgColorIdx.value + 1) % COLORS.length
  bgColor.value = COLORS[bgColorIdx.value]!
}

// --- Main thread ---
const mtBoxRef = useMainThreadRef(null)
const mtTapCount = ref(0)

// Incremented on BG by runOnBackground() from the MT tap handler
function incrementMtCount() {
  mtTapCount.value++
}

// MT-local index — lives in MT JS context, not shared with BG reactive state.
// Captured by the SWC worklet transform into _c.
let mtColorIdx = 0

const onMtTap = () => {
  'main thread'
  // Cycle color directly on MT — no round-trip through BG
  mtColorIdx = (mtColorIdx + 1) % COLORS.length
  const el = (mtBoxRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void }
  }).current
  el?.setStyleProperty?.('background-color', COLORS[mtColorIdx]!)

  // Sync tap count back to BG for display only
  runOnBackground(incrementMtCount)()
}
</script>

<template>
  <view :style="{
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f3e5f5',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
  }">
    <text :style="{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px', color: '#4a148c' }">
      Thread comparison — style updates
    </text>
    <text :style="{ fontSize: '11px', color: '#555', marginBottom: '10px' }">
      Both boxes cycle colors on tap. BG path uses v-bind() in CSS; MT path calls setStyleProperty() directly.
    </text>

    <view :style="{ display: 'flex', flexDirection: 'row', gap: '12px' }">
      <!-- Background thread box -->
      <view :style="{ flex: 1 }">
        <text :style="{ fontSize: '11px', color: '#555', marginBottom: '4px', textAlign: 'center' }">
          Background thread
        </text>
        <view
          class="bg-box"
          :bindtap="onBgTap"
          :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80px',
            borderRadius: '8px',
          }"
        >
          <text :style="{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }">
            Taps: {{ bgTapCount }}
          </text>
        </view>
        <text :style="{ fontSize: '10px', color: '#888', marginTop: '4px', textAlign: 'center' }">
          v-bind(bgColor) in CSS
        </text>
      </view>

      <!-- Main thread box -->
      <view :style="{ flex: 1 }">
        <text :style="{ fontSize: '11px', color: '#555', marginBottom: '4px', textAlign: 'center' }">
          Main thread
        </text>
        <view
          :main-thread-ref="mtBoxRef"
          :main-thread-bindtap="onMtTap"
          :style="{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80px',
            borderRadius: '8px',
            backgroundColor: '#1565c0',
          }"
        >
          <text :style="{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }">
            Taps: {{ mtTapCount }}
          </text>
        </view>
        <text :style="{ fontSize: '10px', color: '#888', marginTop: '4px', textAlign: 'center' }">
          setStyleProperty() on MT
        </text>
      </view>
    </view>
  </view>
</template>

<style>
.bg-box {
  background-color: v-bind(bgColor);
}
</style>
