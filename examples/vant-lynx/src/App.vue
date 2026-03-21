<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <RouterView />
  </view>
</template>
