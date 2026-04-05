<script setup lang="ts">
import { ref } from 'vue'
import VBindRow from './VBindRow.vue'

const TEXT_COLORS = ['#1565c0', '#c62828', '#2e7d32', '#f57f17']
const BG_COLORS   = ['#1565c0', '#c62828', '#2e7d32', '#f57f17']
const FONT_SIZES  = ['12px', '14px', '16px', '20px']
const OPACITIES   = [1, 0.7, 0.4, 0.1]

const colorIdx = ref(0)
const textColor = ref(TEXT_COLORS[0]!)
const bgColor   = ref(BG_COLORS[0]!)
const fontSize  = ref(FONT_SIZES[1]!)
const opacity   = ref(OPACITIES[0]!)

function cycleColor() {
  colorIdx.value = (colorIdx.value + 1) % TEXT_COLORS.length
  textColor.value = TEXT_COLORS[colorIdx.value]!
  bgColor.value = BG_COLORS[colorIdx.value]!
}

function cycleFontSize() {
  const idx = FONT_SIZES.indexOf(fontSize.value)
  fontSize.value = FONT_SIZES[(idx + 1) % FONT_SIZES.length]!
}

function cycleOpacity() {
  const idx = OPACITIES.indexOf(opacity.value)
  opacity.value = OPACITIES[(idx + 1) % OPACITIES.length]!
}
</script>

<template>
  <view :style="{
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fafafa',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
  }">
    <text :style="{ fontSize: '15px', fontWeight: 'bold', marginBottom: '2px', color: '#333' }">
      v-bind() in CSS &nbsp;vs&nbsp; inline :style (VBindCSS.vue)
    </text>
    <text :style="{ fontSize: '11px', color: '#888', marginBottom: '10px' }">
      Same values drive both panels. Tap a button to cycle and compare.
    </text>

    <!-- Column headers -->
    <view :style="{ display: 'flex', flexDirection: 'row', gap: '10px', marginBottom: '8px' }">
      <text :style="{ flex: 1, fontSize: '11px', fontWeight: 'bold', color: '#555', textAlign: 'center' }">
        v-bind() in &lt;style&gt;
      </text>
      <text :style="{ flex: 1, fontSize: '11px', fontWeight: 'bold', color: '#555', textAlign: 'center' }">
        inline :style
      </text>
    </view>

    <!-- Each row is its own component instance with exactly ONE CSS variable -->
    <VBindRow property="background-color" label="background-color" :value="bgColor" />
    <VBindRow property="color" label="color" :value="textColor" />
    <VBindRow property="font-size" label="font-size" :value="fontSize" />
    <VBindRow property="opacity" label="opacity" :value="opacity" />

    <!-- Controls -->
    <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }">
      <text
        :style="{ backgroundColor: '#1565c0', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '11px' }"
        :bindtap="cycleColor"
      >
        Cycle colour
      </text>
      <text
        :style="{ backgroundColor: '#2e7d32', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '11px' }"
        :bindtap="cycleFontSize"
      >
        Cycle font-size
      </text>
      <text
        :style="{ backgroundColor: '#6a1b9a', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '11px' }"
        :bindtap="cycleOpacity"
      >
        Cycle opacity
      </text>
    </view>
  </view>
</template>

<style>
</style>
