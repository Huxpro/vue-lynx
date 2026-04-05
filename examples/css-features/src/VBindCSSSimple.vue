<script setup lang="ts">
import { ref } from 'vue'

const COLORS = ['#1565c0', '#c62828', '#2e7d32', '#f57f17']
const idx = ref(0)
const color = ref(COLORS[0]!)

function cycle() {
  idx.value = (idx.value + 1) % COLORS.length
  color.value = COLORS[idx.value]!
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
    <text :style="{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '2px' }">
      v-bind() in CSS (VBindCSSSimple.vue)
    </text>
    <text :style="{ fontSize: '11px', color: '#888', marginBottom: '10px' }">
      SFC compiler emits useCssVars(); Lynx walks VNode tree to stamp the var.
    </text>

    <view :style="{ padding: '12px', borderRadius: '6px', backgroundColor: '#fff' }">
      <text class="bound-text" :style="{ fontWeight: 'bold' }">
        This text should be {{ color }}
      </text>
    </view>

    <text
      :style="{ marginTop: '10px', backgroundColor: '#1565c0', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', alignSelf: 'flex-start' }"
      :bindtap="cycle"
    >
      Cycle colour
    </text>
  </view>
</template>

<style>
.bound-text {
  color: v-bind(color);
}
</style>
