<script setup lang="ts">
import { computed, onMounted } from 'vue-lynx';

import './App.css';
import OverlayHost from './components/overlay/OverlayHost.vue';
import Sidebar from './components/Sidebar.vue';
import Toaster from './components/ui/Toaster.vue';
import { useChats } from './composables/useChats';
import { useColorMode } from './composables/useColorMode';
import { useSession } from './composables/useSession';

/**
 * Root layout, porting app/layouts/default.vue: sidebar on the left, the
 * routed page inside a rounded ring "panel" card — plus the app-level
 * overlay + toast hosts that replace Nuxt UI portals.
 */
const { colorMode } = useColorMode();
const { fetchChats } = useChats();
const { fetchSession } = useSession();

const themeClass = computed(() => `theme-${colorMode.value}`);

onMounted(async () => {
  await fetchSession();
  await fetchChats();
});
</script>

<template>
  <view class="root w-full h-full bg-page font-sans" :class="themeClass">
    <Sidebar />

    <view class="flex-1 flex flex-col m-4 ml-0 rounded-lg border border-default bg-default shadow-sm min-w-0 overflow-hidden">
      <RouterView />
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
