<script setup lang="ts">
const loadedAt = new Date().toLocaleTimeString()
</script>

<template>
  <view :style="{ padding: 12, backgroundColor: '#d4edda', borderRadius: 6 }">
    <text :style="{ color: '#155724', fontSize: 14 }">Slow component loaded!</text>
    <text :style="{ color: '#155724', fontSize: 11, marginTop: 4 }">
      Resolved at: {{ loadedAt }}
    </text>
  </view>
</template>
