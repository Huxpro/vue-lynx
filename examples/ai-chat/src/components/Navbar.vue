<script setup lang="ts">
import { useRouter } from 'vue-router';

import { useColorMode } from '../composables/useColorMode';
import Icon from './ui/Icon.vue';

/**
 * Port of app/components/Navbar.vue (UDashboardNavbar): title slot on the
 * left, actions + color-mode toggle on the right.
 */
const router = useRouter();
const { colorMode, toggle } = useColorMode();
</script>

<template>
  <view class="flex flex-row items-center justify-between px-4 h-12 shrink-0">
    <view class="flex flex-row items-center min-w-0 flex-1">
      <slot name="title" />
    </view>

    <view class="flex flex-row items-center gap-1">
      <slot />

      <view class="p-2 rounded-md" @tap="toggle">
        <Icon
          :name="colorMode === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
          tone="muted"
          :size="18"
        />
      </view>

      <view class="p-2 rounded-md" @tap="router.push('/')">
        <Icon name="i-lucide-circle-plus" tone="muted" :size="18" />
      </view>
    </view>
  </view>
</template>
