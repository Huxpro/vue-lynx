<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  Cross-Thread Calls Demo

  Tap the colored box to trigger the following round trip:

    1. Main Thread:  onTap fires, calls runOnBackground(incrementCount)()
    2. Background:   incrementCount() bumps the reactive `count` ref
    3. Background:   watch(count) fires, calls runOnMainThread(applyColor)(nextColor)
    4. Main Thread:  applyColor() sets background-color via setStyleProperty()

  This demonstrates both directions of cross-thread async function calls.
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  useMainThreadRef,
  runOnMainThread,
  runOnBackground,
} from 'vue-lynx'

const COLORS = ['#4FC3F7', '#81C784', '#FFB74D', '#E57373', '#BA68C8']

// --- Background Thread state ---
const count = ref(0)

function incrementCount() {
  count.value++
}

// --- Main Thread function ---
const boxRef = useMainThreadRef(null)

const applyColor = (color: string) => {
  'main thread'
  const el = (boxRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void }
  }).current
  el?.setStyleProperty?.('background-color', color)
}

// --- Cross-thread wiring ---
// When count changes on the BG thread, pick the next color and
// call the MT function to apply it.
watch(count, (newCount) => {
  const nextColor = COLORS[newCount % COLORS.length]!
  runOnMainThread(applyColor)(nextColor)
})

// Main Thread tap handler → calls BG function
const onTap = () => {
  'main thread'
  runOnBackground(incrementCount)()
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
        backgroundColor: COLORS[0],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
      }"
    >
      <text :style="{ fontSize: '16px', color: 'white', fontWeight: 'bold' }">
        Tap count: {{ count }}
      </text>
    </view>
  </view>
</template>
