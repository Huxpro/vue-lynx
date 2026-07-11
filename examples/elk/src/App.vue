<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBottom from './components/NavBottom.vue';

import './styles/theme.css';
import './styles/content.css';
</script>

<template>
  <view class="app-root">
    <view class="app-content">
      <RouterView />
    </view>
    <NavBottom />
  </view>
</template>

<style>
.app-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--c-bg-base);
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
}
</style>
