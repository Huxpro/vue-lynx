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
      Inline :style + var() (InlineStyleVar.vue)
    </text>
    <text :style="{ fontSize: '11px', color: '#888', marginBottom: '10px' }">
      Parent sets --my-color via :style; child class reads color: var(--my-color).
    </text>

    <!-- --my-color must be on the SAME element as the class that uses var(--my-color).
         Lynx has no CSS cascade so a parent-set var is invisible to children. -->
    <text
      class="colored-text"
      :style="{ '--my-color': color, fontWeight: 'bold', padding: '12px', borderRadius: '6px', backgroundColor: '#fff' }"
    >
      This text should be {{ color }}
    </text>

    <text
      :style="{ marginTop: '10px', backgroundColor: '#1565c0', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', alignSelf: 'flex-start' }"
      :bindtap="cycle"
    >
      Cycle colour
    </text>
  </view>
</template>

<style>
.colored-text {
  color: var(--my-color);
}
</style>
