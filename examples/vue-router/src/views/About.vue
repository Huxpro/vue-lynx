<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <view :style="{ padding: '16px' }">
    <text :style="{ fontSize: '20px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }">
      About
    </text>
    <text :style="{ fontSize: '14px', color: '#555', lineHeight: '20px' }">
      Vue Router works in Lynx by using createMemoryHistory() instead of
      createWebHistory(). This avoids any dependency on window.location or
      the History API.
    </text>
    <text :style="{ fontSize: '12px', color: '#999', marginTop: '12px' }">
      Current path: {{ route.fullPath }}
    </text>
  </view>
</template>
