<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue-lynx';
import type { ShadowElement } from 'vue-lynx';

import './App.css';
import OverlayHost from './components/overlay/OverlayHost.vue';
import Sidebar from './components/Sidebar.vue';
import Toaster from './components/ui/Toaster.vue';
import { useChats } from './composables/useChats';
import { useOverlay } from './composables/useOverlay';
import { useReducedMotion } from './composables/useReducedMotion';
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
const reducedMotion = useReducedMotion();
const drawerRef = useTemplateRef<ShadowElement>('drawerRef');
const DRAWER_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';

const themeClass = computed(() => `theme-${colorMode.value}`);
const rootClass = computed(() => [
  themeClass.value,
  reducedMotion.value ? 'motion-reduced' : '',
]);

// Translucent overlay backdrops don't composite on the Lynx web platform
// (opaque backgrounds paint, alpha ones don't) — so modals dim the app by
// fading the content underneath instead, approximating UModal's backdrop.
const dimmed = computed(() => stack.value.length > 0 || (isMobile.value && sidebarOpen.value));

function handleSidebarShowChange(show: boolean) {
  if (!show) closeSidebar();
}

async function syncDrawerSurface(open: boolean) {
  // Lynx UI's Sheet keeps horizontal movement on the main thread. Vue's
  // background style diff does not reliably update a previously translated
  // native surface, so use the native UI method for the same direct mutation.
  await nextTick();
  drawerRef.value
    ?.setNativeProps({
      transform: open ? 'translateX(0px)' : 'translateX(-288px)',
      transition: reducedMotion.value ? 'none' : `transform 240ms ${DRAWER_EASING}`,
    })
    .exec();
}

watch(sidebarOpen, (open) => void syncDrawerSurface(open));

onMounted(async () => {
  await fetchSession();
  await fetchChats();
});
</script>

<template>
  <view class="root w-full h-full bg-page font-sans" :class="rootClass" :style="rootStyle">
    <view
      class="flex flex-row flex-1 h-full app-content"
      :style="{ opacity: dimmed ? '0.4' : '1' }"
    >
      <Sidebar v-if="!isMobile" />

      <!-- mobile: full-bleed panel, like the original's lg: breakpoint -->
      <view
        class="flex-1 flex flex-col bg-default min-w-0 overflow-hidden"
        :class="isMobile ? '' : 'm-4 ml-0 rounded-lg border border-default shadow-sm'"
      >
        <RouterView :key="$route.fullPath" />
      </view>
    </view>

    <!-- Mobile side sheet: mount the hit-test layer only while it is open. -->
    <view
      v-if="isMobile && sidebarOpen"
      class="absolute inset-0 drawer-backdrop"
      :event-through="false"
      :style="{ opacity: sidebarOpen ? '1' : '0' }"
      @tap="handleSidebarShowChange(false)"
    />
    <!-- Keep only the moving surface mounted so its transform can animate. -->
    <view
      v-if="isMobile"
      ref="drawerRef"
      class="absolute top-0 bottom-0 left-0 drawer-panel shadow-lg"
      :event-through="false"
      :style="{
        transform: 'translateX(-288px)',
      }"
    >
      <Sidebar drawer />
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
.app-content {
  transition: opacity 240ms cubic-bezier(0.25, 1, 0.5, 1);
}
.drawer-panel {
  z-index: 40;
  width: 288px;
  background-color: var(--ui-bg-sidebar);
}
.drawer-backdrop {
  z-index: 30;
  transition: opacity 240ms cubic-bezier(0.25, 1, 0.5, 1);
}
</style>
