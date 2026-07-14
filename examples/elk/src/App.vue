<script setup lang="ts">
import { RouterView } from 'vue-router';
import MediaPreview from './components/MediaPreview.vue';
import NavBottom from './components/NavBottom.vue';
import { useUserSettings } from './composables/settings';
import { getSparklingSafeAreaInsets } from './safe-area';

import './styles/theme.css';
import './styles/content.css';

const settings = useUserSettings();
const safeArea = getSparklingSafeAreaInsets();
const safeAreaTopStyle = { height: `${safeArea.top}px` };
const safeAreaBottomStyle = { height: `${safeArea.bottom}px` };
</script>

<template>
  <view class="app-root" :class="settings.colorMode === 'dark' ? 'app-dark' : ''">
    <view v-if="safeArea.top" class="safe-area-spacer" :style="safeAreaTopStyle" />
    <view class="app-safe-content">
      <view class="app-content">
        <RouterView />
      </view>
      <NavBottom :safe-area-bottom="safeArea.bottom" />
      <MediaPreview />
    </view>
    <view v-if="safeArea.bottom" class="safe-area-spacer" :style="safeAreaBottomStyle" />
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

.app-safe-content {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.safe-area-spacer {
  width: 100%;
  flex-shrink: 0;
  background-color: var(--c-bg-base);
}

.page {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
}
</style>
