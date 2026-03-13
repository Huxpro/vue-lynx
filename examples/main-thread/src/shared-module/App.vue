<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  Cross-Thread Shared Module Demo

  Tap the box to cycle its color using helpers from a shared module.

  Flow:
    1. Main Thread:  onTap fires
    2. Main Thread:  calls nextColor() / hexToRgba() from the shared module
                     — these are plain functions, usable on MT because the
                     module is imported with `{ runtime: 'shared' }`
    3. Main Thread:  applies the new color via setStyleProperty()
    4. Main Thread:  calls runOnBackground(reportColor)(newHex) to send
                     the result back to the BG thread asynchronously
    5. Background:   reportColor() updates the reactive `lastColor` ref
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useMainThreadRef, runOnBackground } from 'vue-lynx'
// @ts-ignore — `with { runtime: 'shared' }` is a Lynx-specific import attribute
import { nextColor, hexToRgba } from './color-utils.ts' with { runtime: 'shared' }

const PALETTE = ['#4FC3F7', '#81C784', '#FFB74D', '#E57373', '#BA68C8']

// --- Background Thread state ---
// Updated asynchronously from the MT handler via runOnBackground
const lastColor = ref(PALETTE[0]!)

function reportColor(hex: string) {
  lastColor.value = hex
}

// --- Main Thread logic ---
const boxRef = useMainThreadRef(null)
const currentColorRef = useMainThreadRef(PALETTE[0]!)

const onTap = () => {
  'main thread'
  // Call shared module helpers directly on the Main Thread
  const newHex = nextColor(currentColorRef.current, PALETTE)
  const rgba = hexToRgba(newHex, 1)
  currentColorRef.current = newHex

  const el = (boxRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void }
  }).current
  el?.setStyleProperty?.('background-color', rgba)

  // Send the result back to the Background Thread
  runOnBackground(reportColor)(newHex)
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
        backgroundColor: PALETTE[0],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
      }"
    >
      <text :style="{ fontSize: 14, color: 'white', fontWeight: 'bold' }">
        Last color: {{ lastColor }}
      </text>
    </view>
  </view>
</template>
