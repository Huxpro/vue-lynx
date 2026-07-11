<script setup lang="ts">
import { computed, onMounted } from 'vue-lynx';

import './App.css';
import OverlayHost from './components/overlay/OverlayHost.vue';
import Sidebar from './components/Sidebar.vue';
import Toaster from './components/ui/Toaster.vue';
import { useChats } from './composables/useChats';
import { useOverlay } from './composables/useOverlay';
import { useSession } from './composables/useSession';
import { useTheme } from './composables/useTheme';

/**
 * Root layout, porting app/layouts/default.vue: sidebar on the left, the
 * routed page inside a rounded ring "panel" card — plus the app-level
 * overlay + toast hosts that replace Nuxt UI portals.
 */
const { colorMode, rootStyle } = useTheme();
const { fetchChats } = useChats();
const { fetchSession } = useSession();
const { stack } = useOverlay();

const themeClass = computed(() => `theme-${colorMode.value}`);

// Translucent overlay backdrops don't composite on the Lynx web platform
// (opaque backgrounds paint, alpha ones don't) — so modals dim the app by
// fading the content underneath instead, approximating UModal's backdrop.
const dimmed = computed(() => stack.value.length > 0);

onMounted(async () => {
  await fetchSession();
  await fetchChats();
});
</script>

<template>
  <view class="root w-full h-full bg-page font-sans" :class="themeClass" :style="rootStyle">
    <view class="flex flex-row flex-1 h-full" :style="{ opacity: dimmed ? '0.4' : '1' }">
      <Sidebar />

      <view class="flex-1 flex flex-col m-4 ml-0 rounded-lg border border-default bg-default shadow-sm min-w-0 overflow-hidden">
        <RouterView />
      </view>
    </view>

    <Toaster />
    <OverlayHost />
  </view>
</template>

<style>
.root {
  display: flex;
  flex-direction: row;
}
</style>
