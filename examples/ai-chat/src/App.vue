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
import { useSidebarDrawer, useViewport } from './composables/useViewport';

/**
 * Root layout, porting app/layouts/default.vue: sidebar on the left, the
 * routed page inside a rounded ring "panel" card — plus the app-level
 * overlay + toast hosts that replace Nuxt UI portals.
 */
const { colorMode, rootStyle } = useTheme();
const { fetchChats } = useChats();
const { fetchSession } = useSession();
const { stack } = useOverlay();
const { isMobile } = useViewport();
const { sidebarOpen, close: closeSidebar } = useSidebarDrawer();

const themeClass = computed(() => `theme-${colorMode.value}`);

// Translucent overlay backdrops don't composite on the Lynx web platform
// (opaque backgrounds paint, alpha ones don't) — so modals dim the app by
// fading the content underneath instead, approximating UModal's backdrop.
const dimmed = computed(() => stack.value.length > 0 || (isMobile.value && sidebarOpen.value));

onMounted(async () => {
  await fetchSession();
  await fetchChats();
});
</script>

<template>
  <view class="root w-full h-full bg-page font-sans" :class="themeClass" :style="rootStyle">
    <view class="flex flex-row flex-1 h-full" :style="{ opacity: dimmed ? '0.4' : '1' }">
      <Sidebar v-if="!isMobile" />

      <!-- mobile: full-bleed panel, like the original's lg: breakpoint -->
      <view
        class="flex-1 flex flex-col bg-default min-w-0 overflow-hidden"
        :class="isMobile ? '' : 'm-4 ml-0 rounded-lg border border-default shadow-sm'"
      >
        <RouterView :key="$route.fullPath" />
      </view>
    </view>

    <!-- mobile slide-over sidebar (UDashboardSidebar's menu mode) -->
    <template v-if="isMobile && sidebarOpen">
      <view class="absolute inset-0 z-30" @tap="closeSidebar()" />
      <view class="absolute top-0 bottom-0 left-0 z-40 drawer-panel shadow-lg">
        <Sidebar drawer />
      </view>
    </template>

    <Toaster />
    <OverlayHost />
  </view>
</template>

<style>
.root {
  display: flex;
  flex-direction: row;
}
.drawer-panel {
  width: 288px;
  background-color: var(--ui-bg-sidebar);
}
</style>
