<script setup lang="ts">
import { ref, computed } from 'vue'

// Workaround: Dynamic styling via reactive inline :style bindings
//
// Instead of v-bind() in CSS, use computed inline styles for dynamic values.
// This is the recommended pattern in vue-lynx today.

const isPrimary = ref(true)

const cardStyle = computed(() => ({
  display: 'flex' as const,
  flexDirection: 'column' as const,
  backgroundColor: isPrimary.value ? '#e3f2fd' : '#fce4ec',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '12px',
}))

const textStyle = computed(() => ({
  fontSize: '13px',
  color: isPrimary.value ? '#1565c0' : '#c62828',
}))

function toggle() {
  isPrimary.value = !isPrimary.value
}
</script>

<template>
  <view :style="cardStyle">
    <text :style="{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }">
      Workaround: Reactive inline :style
    </text>
    <text :style="{ fontSize: '12px', color: '#555', marginBottom: '8px' }">
      Use computed() + :style bindings instead of v-bind() in CSS.
      This is the recommended pattern for dynamic styling.
    </text>
    <view :style="{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px' }" @tap="toggle">
      <text :style="textStyle">Tap me — this DOES change color reactively</text>
    </view>
  </view>
</template>
