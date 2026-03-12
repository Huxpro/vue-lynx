<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <view :style="{ padding: 16 }">
    <text :style="{ fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 8 }">
      About
    </text>
    <text :style="{ fontSize: 14, color: '#555', lineHeight: 20 }">
      Vue Router works in Lynx by using createMemoryHistory() instead of
      createWebHistory(). This avoids any dependency on window.location or
      the History API.
    </text>
    <text :style="{ fontSize: 12, color: '#999', marginTop: 12 }">
      Current path: {{ route.fullPath }}
    </text>
  </view>
</template>
