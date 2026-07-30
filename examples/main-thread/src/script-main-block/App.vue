<!-- Copyright 2026 Xuan Huang (huxpro). All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  `<script main>` Block Demo (issue #314)

  Same round trip as the cross-thread-calls demo:

    1. Main Thread:  onTap fires, calls runOnBackground(incrementCount)()
    2. Background:   incrementCount() bumps the reactive `count` ref
    3. Background:   watch(count) fires, calls runOnMainThread(applyColor)(nextColor)
    4. Main Thread:  applyColor() sets background-color via setStyleProperty()

  The difference: applyColor and onTap live in a `<script main>` block — no
  per-function 'main thread' directives. The plugin lowers the block into the
  regular worklet pipeline at compile time.
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMainThreadRef, runOnMainThread } from 'vue-lynx'

const COLORS = ['#4FC3F7', '#81C784', '#FFB74D', '#E57373', '#BA68C8']

// --- Background Thread state ---
const count = ref(0)

function incrementCount() {
  count.value++
}

const boxRef = useMainThreadRef(null)

// When count changes on the BG thread, apply the next color on the MT.
watch(count, (newCount) => {
  const nextColor = COLORS[newCount % COLORS.length]!
  runOnMainThread(applyColor)(nextColor)
})
</script>

<script main lang="ts">
import { runOnBackground } from 'vue-lynx'

const applyColor = (color: string) => {
  const el = (boxRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void }
  }).current
  el?.setStyleProperty?.('background-color', color)
}

const onTap = () => {
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
      <text :style="{ fontSize: 16, color: 'white', fontWeight: 'bold' }">
        Tap count: {{ count }}
      </text>
    </view>
  </view>
</template>
