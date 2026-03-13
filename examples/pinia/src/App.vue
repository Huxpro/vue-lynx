<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<!--
  App.vue — Pinia state management demo
  Demonstrates: createPinia, defineStore (setup syntax), multiple stores,
  state/getters/actions in SFC components
-->
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
