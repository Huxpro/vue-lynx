<script setup lang="ts">
import { RouterView } from 'vue-router';

import './styles/theme.css';
</script>

<template>
  <view class="w-full h-full flex flex-col bg-base">
    <RouterView />
  </view>
</template>
