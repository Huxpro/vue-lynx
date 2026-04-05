<script setup lang="ts">
import { ref } from 'vue'

// Both sides share the same reactive ref — tap either box to cycle color
// so you can directly compare how each approach propagates the update.
//
// LEFT  — inline :style sets a CSS custom property, class reads it via var()
//           :style="{ '--box-color': color }"  →  background-color: var(--box-color)
//
// RIGHT — v-bind() in <style> writes the value straight to a CSS custom property
//           background-color: v-bind(color)

const COLORS = ['#1565c0', '#c62828', '#2e7d32', '#f57f17', '#6a1b9a']

const colorIdx = ref(0)
const color = ref(COLORS[0]!)
const tapCount = ref(0)

function cycleColor() {
  tapCount.value++
  colorIdx.value = (colorIdx.value + 1) % COLORS.length
  color.value = COLORS[colorIdx.value]!
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
    <text :style="{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }">
      Inline :style + var() &nbsp;vs&nbsp; v-bind() in CSS
    </text>
    <text :style="{ fontSize: '11px', color: '#888', marginBottom: '10px' }">
      Same reactive ref. Tap either box to cycle — compare how each approach updates.
    </text>

    <view :style="{ display: 'flex', flexDirection: 'row', gap: '12px' }">
      <!-- Left: set CSS custom property via inline :style, consume with var() in class -->
      <view :style="{ flex: 1 }">
        <text :style="{ fontSize: '11px', color: '#555', marginBottom: '4px', textAlign: 'center' }">
          :style + var()
        </text>
        <view
          class="inline-var-box"
          :style="{ '--box-color': color, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', borderRadius: '8px' }"
          :bindtap="cycleColor"
        >
          <text :style="{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }">
            Taps: {{ tapCount }}
          </text>
        </view>
        <text :style="{ fontSize: '10px', color: '#888', marginTop: '4px', textAlign: 'center' }">
          background-color: var(--box-color)
        </text>
      </view>

      <!-- Right: v-bind() in <style> — Vue writes the CSS custom property for you -->
      <view :style="{ flex: 1 }">
        <text :style="{ fontSize: '11px', color: '#555', marginBottom: '4px', textAlign: 'center' }">
          v-bind() in CSS
        </text>
        <view
          class="vbind-color-box"
          :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', borderRadius: '8px' }"
          :bindtap="cycleColor"
        >
          <text :style="{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }">
            Taps: {{ tapCount }}
          </text>
        </view>
        <text :style="{ fontSize: '10px', color: '#888', marginTop: '4px', textAlign: 'center' }">
          background-color: v-bind(color)
        </text>
      </view>
    </view>
  </view>
</template>

<style>
.inline-var-box {
  background-color: var(--box-color);
}

.vbind-color-box {
  background-color: v-bind(color);
}
</style>
