<script setup lang="ts">
import { computed } from 'vue-lynx';
import { useRouter } from 'vue-router';

import { useColorMode } from '../composables/useColorMode';
import { useSidebarDrawer, useViewport } from '../composables/useViewport';
import Icon from './ui/Icon.vue';
import MotionPressable from './ui/MotionPressable.vue';

/**
 * Port of app/components/Navbar.vue (UDashboardNavbar): title slot on the
 * left, actions + color-mode toggle on the right. On mobile a hamburger
 * opens the slide-over sidebar (the original's UDashboardSidebarToggle).
 */
const router = useRouter();
const { colorMode, toggle } = useColorMode();
const { isMobile } = useViewport();
const { toggle: toggleSidebar } = useSidebarDrawer();
const SystemInfo = (globalThis as { SystemInfo?: { platform?: string } }).SystemInfo;
const isIOS = SystemInfo?.platform === 'iOS';
const hostProps =
  typeof lynx === 'undefined'
    ? undefined
    : (lynx.__globalProps as { fullscreen?: boolean | string; safeAreaTop?: number } | undefined);
const isFullscreen = hostProps?.fullscreen === true || hostProps?.fullscreen === 'true';
const safeAreaTop = isFullscreen && isIOS ? Math.max(0, Number(hostProps?.safeAreaTop) || 0) : 0;
const navbarStyle = computed(() => ({
  // A full-screen LynxView includes the status-bar area. Use the inset supplied
  // by the host so embedded views, landscape, and non-notched devices stay at 0.
  paddingTop: isMobile.value && safeAreaTop > 0 ? `${safeAreaTop}px` : undefined,
  height: isMobile.value ? `${48 + safeAreaTop}px` : '48px',
}));
</script>

<template>
  <view
    class="flex flex-row items-center justify-between px-4 h-12 shrink-0"
    :style="navbarStyle"
  >
    <view class="flex flex-row items-center min-w-0 flex-1 gap-1">
      <MotionPressable
        v-if="isMobile"
        class="p-2 rounded-md"
        accessibility-label="Open navigation"
        @tap="toggleSidebar()"
      >
        <Icon name="i-lucide-menu" tone="muted" :size="20" />
      </MotionPressable>
      <slot name="title" />
    </view>

    <view class="flex flex-row items-center gap-1">
      <slot />

      <MotionPressable
        class="p-2 rounded-md"
        :accessibility-label="colorMode === 'dark' ? 'Use light mode' : 'Use dark mode'"
        @tap="toggle"
      >
        <Icon
          :name="colorMode === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
          tone="muted"
          :size="18"
        />
      </MotionPressable>

      <MotionPressable
        class="p-2 rounded-md"
        accessibility-label="New chat"
        @tap="router.push('/')"
      >
        <Icon name="i-lucide-circle-plus" tone="muted" :size="18" />
      </MotionPressable>
    </view>
  </view>
</template>
