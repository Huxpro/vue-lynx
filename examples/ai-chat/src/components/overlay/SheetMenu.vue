<script setup lang="ts">
import Icon from '../ui/Icon.vue';

export interface SheetMenuItem {
  label: string;
  value: string;
  icon?: string;
  description?: string;
  color?: 'error' | 'default';
  checked?: boolean;
}

/**
 * Touch replacement for UDropdownMenu/USelectMenu: hover-anchored popover
 * menus don't translate to Lynx (no hover, no portals/anchoring), so
 * dropdowns become a centered action sheet. Items are [[...group], ...] like
 * the original's DropdownMenuItem[][].
 */
defineProps<{
  title?: string;
  groups: SheetMenuItem[][];
}>();

const emit = defineEmits<{ close: [result: string | false] }>();
</script>

<template>
  <view class="absolute inset-0 z-40 items-center justify-center flex">
    <view class="absolute inset-0 sheet-backdrop" @tap="emit('close', false)" />
    <view
      class="rounded-lg bg-default border border-default shadow-lg flex flex-col z-50 overflow-hidden p-1"
      style="width: 300px; max-width: 88%"
    >
      <text v-if="title" class="text-xs font-semibold text-muted px-3 pt-2.5 pb-1">{{ title }}</text>
      <view v-for="(group, gi) in groups" :key="gi" class="flex flex-col">
        <view v-if="gi > 0" class="h-px bg-accented my-1 mx-1" />
        <view
          v-for="item in group"
          :key="item.value"
          class="flex flex-row items-center gap-2.5 rounded-md px-3 py-2"
          :class="item.checked ? 'bg-elevated' : ''"
          @tap="emit('close', item.value)"
        >
          <Icon
            v-if="item.icon"
            :name="item.icon"
            :tone="item.color === 'error' ? 'error' : 'muted'"
            :size="16"
          />
          <view class="flex flex-col flex-1">
            <text
              class="text-sm"
              :class="item.color === 'error' ? 'text-error' : 'text-default'"
            >
              {{ item.label }}
            </text>
            <text v-if="item.description" class="text-xs text-muted">{{ item.description }}</text>
          </view>
          <Icon v-if="item.checked" name="i-lucide-check" tone="primary" :size="16" />
        </view>
      </view>
    </view>
  </view>
</template>

<style>
.sheet-backdrop {
  background-color: rgba(0, 0, 0, 0.35);
}
</style>
