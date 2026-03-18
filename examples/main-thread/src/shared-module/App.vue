<!-- Copyright 2026 Xuan Huang (huxpro). All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  Shared Module Demo

  Tap the colored box to cycle through colors. The color-utils module is
  imported with `with { runtime: 'shared' }` so both threads can use the
  same `getNextColor()` function — the Main Thread calls it directly in
  the tap handler, and the Background Thread calls it to display the name.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useMainThreadRef,
  runOnBackground,
} from 'vue-lynx'
import { getNextColor, getColorCount } from './color-utils' with { runtime: 'shared' }

// --- Background Thread state ---
const count = ref(0)
const currentColor = computed(() => getNextColor(count.value))

// --- Main Thread function ---
const boxRef = useMainThreadRef(null)

const onTap = () => {
  'main thread'
  // Use shared function directly on the Main Thread to get color
  const idx = (boxRef as unknown as { current?: { __colorIdx?: number } }).current?.__colorIdx ?? 0
  const nextIdx = idx + 1
  const color = getNextColor(nextIdx)

  const el = (boxRef as unknown as {
    current?: {
      setStyleProperty?(k: string, v: string): void
      __colorIdx?: number
    }
  }).current
  el?.setStyleProperty?.('background-color', color)
  if (el) el.__colorIdx = nextIdx

  // Also update BG state so the text reflects the change
  runOnBackground(incrementCount)()
}

function incrementCount() {
  count.value++
}
</script>

<template>
  <view :style="{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }">
    <view
      :main-thread-ref="boxRef"
      :main-thread-bindtap="onTap"
      :style="{
        width: '200px',
        height: '200px',
        backgroundColor: currentColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
      }"
    >
      <text :style="{ fontSize: '16px', color: 'white', fontWeight: 'bold' }">
        Tap to cycle
      </text>
      <text :style="{ fontSize: '14px', color: 'white', marginTop: '8px' }">
        Color {{ (count % getColorCount()) + 1 }}/{{ getColorCount() }}
      </text>
    </view>
  </view>
</template>
