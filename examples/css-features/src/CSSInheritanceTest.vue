<script setup lang="ts">
import { ref } from 'vue'

const COLORS = ['#c62828', '#1565c0', '#2e7d32']
const colorIdx = ref(0)
const color = ref(COLORS[0]!)

function cycleColor() {
  colorIdx.value = (colorIdx.value + 1) % COLORS.length
  color.value = COLORS[colorIdx.value]!
}
</script>

<template>
  <view :style="{
    backgroundColor: '#fafafa',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
  }">
    <text :style="{ fontSize: '15px', fontWeight: 'bold', marginBottom: '2px', color: '#333' }">
      enableCSSInheritance — CSS var propagation (CSSInheritanceTest.vue)
    </text>
    <text :style="{ fontSize: '11px', color: '#888', marginBottom: '10px' }">
      Parent sets --test-color via :style. Children consume it via var() in class rules.
      No useCssVars involved. Tests whether enableCSSInheritance propagates CSS custom properties.
    </text>

    <!-- Parent sets the CSS var via :style only — no v-bind(), no useCssVars -->
    <view :style="{ '--test-color': color, padding: '10px', borderRadius: '6px', backgroundColor: '#fff' }">
      <text :style="{ fontSize: '11px', color: '#555', marginBottom: '6px' }">
        Parent: :style="{ '--test-color': color }"
      </text>

      <!-- Depth 1 child -->
      <view :style="{ marginBottom: '4px' }">
        <text class="inherited-color" :style="{ fontWeight: 'bold' }">
          Depth 1 — color: var(--test-color)
        </text>
      </view>

      <!-- Depth 2 child -->
      <view>
        <view>
          <text class="inherited-color" :style="{ fontWeight: 'bold' }">
            Depth 2 — color: var(--test-color)
          </text>
        </view>
      </view>
    </view>

    <text
      :style="{
        marginTop: '10px',
        backgroundColor: '#1565c0',
        color: '#fff',
        padding: '6px 10px',
        borderRadius: '4px',
        fontSize: '11px',
      }"
      :bindtap="cycleColor"
    >
      Cycle color (currently: {{ color }})
    </text>
  </view>
</template>

<style>
.inherited-color {
  color: var(--test-color);
}
</style>
