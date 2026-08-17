<script setup lang="ts">
import { useSession } from '../../composables/useSession';
import { useTheme } from '../../composables/useTheme';
import { NEUTRAL_SCALES, PRIMARY_HUES } from '../../lib/palette';
import Icon from '../ui/Icon.vue';
import UAvatar from '../ui/UAvatar.vue';

/**
 * Port of app/components/UserMenu.vue's dropdown content as a sheet:
 * user header, primary/neutral theme pickers (17 + 5 swatches, mirroring
 * the original's chip submenus), light/dark appearance, log out.
 * External template/docs links are omitted (no browser on native Lynx).
 */
const emit = defineEmits<{ close: [result: 'logout' | false] }>();

const { user } = useSession();
const { colorMode, primary, neutral } = useTheme();

const primaries = Object.keys(PRIMARY_HUES);
const neutrals = Object.keys(NEUTRAL_SCALES);
</script>

<template>
  <view class="absolute inset-0 z-40 items-center justify-center flex">
    <view class="absolute inset-0 z-40 sheet-backdrop" @tap="emit('close', false)" />
    <view
      class="rounded-lg bg-default border border-default shadow-lg flex flex-col z-50 overflow-hidden"
      style="width: 320px; max-width: 88%"
    >
      <!-- user -->
      <view class="flex flex-row items-center gap-2.5 px-4 py-3 border-b border-default">
        <UAvatar :src="user?.avatar" :size="28" />
        <view class="flex flex-col">
          <text class="text-sm font-medium text-highlighted">{{ user?.name }}</text>
          <text class="text-xs text-muted">{{ user?.username }}</text>
        </view>
      </view>

      <view class="flex flex-col px-4 py-3 gap-2 border-b border-default">
        <view class="flex flex-row items-center gap-2">
          <Icon name="i-lucide-palette" tone="muted" :size="16" />
          <text class="text-sm text-default">Theme</text>
        </view>

        <text class="text-xs text-muted mt-1">Primary</text>
        <view class="flex flex-row flex-wrap gap-1.5">
          <view
            v-for="hue in primaries"
            :key="hue"
            class="swatch rounded-full"
            :class="primary === hue ? 'swatch-active' : ''"
            :style="{ backgroundColor: PRIMARY_HUES[hue]![colorMode === 'dark' ? 'dark' : 'light'] }"
            @tap="primary = hue"
          />
        </view>

        <text class="text-xs text-muted mt-1">Neutral</text>
        <view class="flex flex-row flex-wrap gap-1.5">
          <view
            v-for="scale in neutrals"
            :key="scale"
            class="swatch rounded-full"
            :class="neutral === scale ? 'swatch-active' : ''"
            :style="{ backgroundColor: NEUTRAL_SCALES[scale]![colorMode === 'dark' ? '400' : '500'] }"
            @tap="neutral = scale"
          />
        </view>
      </view>

      <!-- appearance -->
      <view class="flex flex-col px-1 py-1 border-b border-default">
        <view
          class="flex flex-row items-center gap-2.5 rounded-md px-3 py-2"
          :class="colorMode === 'light' ? 'bg-elevated' : ''"
          @tap="colorMode = 'light'"
        >
          <Icon name="i-lucide-sun" tone="muted" :size="16" />
          <text class="text-sm text-default flex-1">Light</text>
          <Icon v-if="colorMode === 'light'" name="i-lucide-check" tone="primary" :size="16" />
        </view>
        <view
          class="flex flex-row items-center gap-2.5 rounded-md px-3 py-2"
          :class="colorMode === 'dark' ? 'bg-elevated' : ''"
          @tap="colorMode = 'dark'"
        >
          <Icon name="i-lucide-moon" tone="muted" :size="16" />
          <text class="text-sm text-default flex-1">Dark</text>
          <Icon v-if="colorMode === 'dark'" name="i-lucide-check" tone="primary" :size="16" />
        </view>
      </view>

      <!-- logout -->
      <view class="flex flex-col px-1 py-1">
        <view class="flex flex-row items-center gap-2.5 rounded-md px-3 py-2" @tap="emit('close', 'logout')">
          <Icon name="i-lucide-log-out" tone="muted" :size="16" />
          <text class="text-sm text-default">Log out</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
.swatch {
  width: 18px;
  height: 18px;
}
.swatch-active {
  border: 2px solid var(--ui-text-highlighted);
}
</style>
