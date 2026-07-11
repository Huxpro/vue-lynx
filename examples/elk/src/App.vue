<script setup lang="ts">
import { RouterView } from 'vue-router';
import MediaPreview from './components/MediaPreview.vue';
import NavBottom from './components/NavBottom.vue';
import { useUserSettings } from './composables/settings';

import './styles/theme.css';
import './styles/content.css';

const settings = useUserSettings();
</script>

<template>
  <view class="app-root" :class="settings.colorMode === 'dark' ? 'app-dark' : ''">
    <view class="app-content">
      <RouterView />
    </view>
    <NavBottom />
    <MediaPreview />
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
