<script setup lang="ts">
import CounterSection from './CounterSection.vue';
import TodoSection from './TodoSection.vue';
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }">
    <text :style="{ fontSize: 18, fontWeight: 'bold', margin: 16, color: '#111' }">
      Vue-Lynx + Pinia
    </text>

    <CounterSection />
    <TodoSection />
  </view>
</template>
