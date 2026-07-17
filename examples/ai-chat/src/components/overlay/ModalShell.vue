<script setup lang="ts">
/**
 * Shared modal chrome standing in for UModal: dim backdrop + centered card
 * with title/description/optional close button. Rendered by OverlayHost at
 * app root (replaces Reka UI portals).
 */
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    close?: boolean;
    dismissible?: boolean;
  }>(),
  { close: true, dismissible: true },
);

const emit = defineEmits<{ dismiss: [] }>();

import Icon from '../ui/Icon.vue';

function onBackdrop() {
  emit('dismiss');
}
</script>

<template>
  <view class="absolute inset-0 z-40 items-center justify-center flex">
    <view class="absolute inset-0 z-40 modal-backdrop" @tap="dismissible ? onBackdrop() : undefined" />
    <view
      class="rounded-lg bg-default border border-default shadow-lg flex flex-col z-50 overflow-hidden"
      style="width: 440px; max-width: 92%"
    >
      <view v-if="title || close" class="flex flex-row items-start justify-between px-6 pt-6 gap-2">
        <view class="flex flex-col gap-1 flex-1">
          <text v-if="title" class="text-lg font-semibold text-highlighted">{{ title }}</text>
          <text v-if="description" class="text-sm text-muted">{{ description }}</text>
        </view>
        <view v-if="close" class="p-1 rounded-md" @tap="emit('dismiss')">
          <Icon name="i-lucide-x" tone="muted" :size="18" />
        </view>
      </view>
      <view class="px-6 py-6 flex flex-col">
        <slot />
      </view>
      <view v-if="$slots.footer" class="px-6 pb-6 flex flex-row-reverse gap-2">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

