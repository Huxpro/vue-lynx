<script setup lang="ts">
import { useToast } from '../../composables/useToast';
import Icon from './Icon.vue';

/** Top-right toast stack, matching <UApp :toaster="{ position: 'top-right' }">. */
const { toasts, remove } = useToast();

function toneFor(color?: string) {
  if (color === 'error') return 'error';
  if (color === 'success') return 'success';
  return 'default';
}
</script>

<template>
  <view
    v-if="toasts.length"
    class="absolute top-4 right-4 flex flex-col gap-2 z-50"
    style="width: 320px"
  >
    <view
      v-for="toast in toasts"
      :key="toast.id"
      class="flex flex-row items-start gap-2.5 rounded-lg bg-default border border-default p-4 shadow-lg"
      @tap="remove(toast.id)"
    >
      <Icon v-if="toast.icon" :name="toast.icon" :tone="toneFor(toast.color)" :size="20" />
      <view class="flex flex-col flex-1 gap-0.5">
        <text v-if="toast.title" class="text-sm font-medium text-highlighted">{{ toast.title }}</text>
        <text v-if="toast.description" class="text-sm text-muted">{{ toast.description }}</text>
      </view>
      <Icon name="i-lucide-x" tone="dimmed" :size="16" />
    </view>
  </view>
</template>
