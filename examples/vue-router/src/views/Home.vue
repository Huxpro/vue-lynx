<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goToUsers() {
  router.push('/users');
}
</script>

<template>
  <view :style="{ padding: 16 }">
    <text :style="{ fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 8 }">
      Home
    </text>
    <text :style="{ fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 }">
      This example demonstrates Vue Router with createMemoryHistory in Lynx.
      Since Lynx has no browser navigation APIs, memory history keeps the
      routing state entirely in-process.
    </text>
    <text
      @tap="goToUsers"
      :style="{
        fontSize: 14,
        color: '#1a73e8',
        padding: '8px 16px',
        backgroundColor: '#e8f0fe',
        borderRadius: 8,
        alignSelf: 'flex-start',
      }"
    >
      Browse Users →
    </text>
  </view>
</template>
