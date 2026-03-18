<script setup lang="ts">
const loadedAt = new Date().toLocaleTimeString()
</script>

<template>
  <view :style="{ padding: '12px', backgroundColor: '#d4edda', borderRadius: '6px' }">
    <text :style="{ color: '#155724', fontSize: '14px' }">Slow component loaded!</text>
    <text :style="{ color: '#155724', fontSize: '11px', marginTop: '4px' }">
      Resolved at: {{ loadedAt }}
    </text>
  </view>
</template>
