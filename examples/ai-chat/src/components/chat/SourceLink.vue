<script setup lang="ts">
import { getDomain, getFaviconUrl } from '../../lib/url';
import Icon from '../ui/Icon.vue';

/**
 * Port of app/components/chat/SourceLink.vue — a rounded-full pill with
 * favicon + domain. External links can't open a browser tab on native Lynx,
 * so the pill is informational.
 */
defineProps<{
  url: string;
  title?: string;
}>();
</script>

<template>
  <view class="flex flex-row items-center gap-1.5 rounded-full border border-accented px-2 py-1">
    <image :src="getFaviconUrl(url)" class="source-favicon rounded-full" />
    <text class="text-xs text-default" text-maxline="1">{{ getDomain(url) }}</text>
    <Icon name="i-lucide-arrow-up-right" tone="dimmed" :size="12" />
  </view>
</template>

<style>
.source-favicon {
  width: 14px;
  height: 14px;
}
</style>
